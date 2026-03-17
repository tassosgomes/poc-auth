import type { FixedRole, RoleAccessConfig } from '@zcorp/shared-contracts';
import type { Pool, PoolClient } from 'pg';

import { BffAppError } from '../errors.js';
import type { RoleAccessUpdateCommand } from '../types.js';

interface RoleAccessRow {
  role: FixedRole;
  permissions_json: string[];
  screens_json: string[];
  routes_json: string[];
  microfrontends_json: string[];
  version: number;
  updated_at: Date;
  updated_by: string;
}

interface RoleVersionRow {
  role: FixedRole;
  version: number;
}

export class RoleAccessRepository {
  constructor(private readonly pool: Pool) {}

  async listVersions(roles: readonly FixedRole[]): Promise<Array<{ role: FixedRole; version: number }>> {
    if (roles.length === 0) {
      return [];
    }

    const result = await this.pool.query<RoleVersionRow>(
      `
        select role, version
        from role_access
        where role = any($1::text[])
      `,
      [roles]
    );

    return result.rows;
  }

  async getByRoles(roles: readonly FixedRole[]): Promise<RoleAccessConfig[]> {
    if (roles.length === 0) {
      return [];
    }

    const result = await this.pool.query<RoleAccessRow>(
      `
        select role, permissions_json, screens_json, routes_json, microfrontends_json, version, updated_at, updated_by
        from role_access
        where role = any($1::text[])
      `,
      [roles]
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async listAll(): Promise<RoleAccessConfig[]> {
    const result = await this.pool.query<RoleAccessRow>(
      `
        select role, permissions_json, screens_json, routes_json, microfrontends_json, version, updated_at, updated_by
        from role_access
      `
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async update(role: FixedRole, command: RoleAccessUpdateCommand): Promise<RoleAccessConfig> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const current = await this.getByRoleForUpdate(client, role);
      if (!current) {
        throw new BffAppError('UPSTREAM_ERROR', 500, 'Role access row not found', { role });
      }

      const updatedAt = new Date();
      const next: RoleAccessConfig = {
        role,
        permissions: command.permissions,
        screens: command.screens,
        routes: command.routes,
        microfrontends: command.microfrontends,
        updatedAt: updatedAt.toISOString(),
        updatedBy: command.updatedBy,
        version: current.version + 1
      };

      await client.query(
        `
          update role_access
          set permissions_json = $2::jsonb,
              screens_json = $3::jsonb,
              routes_json = $4::jsonb,
              microfrontends_json = $5::jsonb,
              version = $6,
              updated_at = $7,
              updated_by = $8
          where role = $1
        `,
        [
          role,
          JSON.stringify(next.permissions),
          JSON.stringify(next.screens),
          JSON.stringify(next.routes),
          JSON.stringify(next.microfrontends),
          next.version,
          next.updatedAt,
          next.updatedBy
        ]
      );

      await client.query(
        `
          insert into role_access_audit (
            role,
            previous_value_json,
            new_value_json,
            changed_at,
            changed_by,
            correlation_id
          )
          values ($1, $2::jsonb, $3::jsonb, $4, $5, $6)
        `,
        [
          role,
          JSON.stringify(current),
          JSON.stringify(next),
          next.updatedAt,
          command.updatedBy,
          command.correlationId
        ]
      );

      await client.query('commit');
      return next;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  private async getByRoleForUpdate(client: PoolClient, role: FixedRole): Promise<RoleAccessConfig | null> {
    const result = await client.query<RoleAccessRow>(
      `
        select role, permissions_json, screens_json, routes_json, microfrontends_json, version, updated_at, updated_by
        from role_access
        where role = $1
        for update
      `,
      [role]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: RoleAccessRow): RoleAccessConfig {
    return {
      role: row.role,
      permissions: row.permissions_json,
      screens: row.screens_json,
      routes: row.routes_json,
      microfrontends: row.microfrontends_json,
      version: row.version,
      updatedAt: row.updated_at.toISOString(),
      updatedBy: row.updated_by
    };
  }
}