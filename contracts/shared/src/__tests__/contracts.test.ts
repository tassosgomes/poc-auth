import { describe, expect, it } from 'vitest';

import {
  BFF_ERROR_CODES,
  BffErrorEnvelopeSchema,
  MICROFRONTEND_CATALOG_SEED,
  PERMISSION_SNAPSHOT_FIXTURE,
  PermissionSnapshotSchema,
  ROLE_ACCESS_SEED,
  RoleAccessConfigSchema,
  USER_SESSION_FIXTURE,
  UserSessionSchema,
  extractNormalizedRoles,
  parsePermissionSnapshot,
  parseSession,
  serializePermissionSnapshot,
  serializeSession
} from '../index.js';

describe('shared contracts', () => {
  it('validates canonical user session and keeps serialization round-trip', () => {
    const serialized = serializeSession(USER_SESSION_FIXTURE);
    const parsed = parseSession(serialized);

    expect(parsed).toEqual(USER_SESSION_FIXTURE);
    expect(() => UserSessionSchema.parse(parsed)).not.toThrow();
  });

  it('validates permission snapshot and keeps serialization round-trip', () => {
    const serialized = serializePermissionSnapshot(PERMISSION_SNAPSHOT_FIXTURE);
    const parsed = parsePermissionSnapshot(serialized);

    expect(parsed).toEqual(PERMISSION_SNAPSHOT_FIXTURE);
    expect(() => PermissionSnapshotSchema.parse(parsed)).not.toThrow();
  });

  it('normalizes roles from ROLES claim preserving lowercase fixed roles', () => {
    const claims = {
      ROLES: ['ADMIN', 'coordenador', 'tecnico', 'invalid-role', 'admin']
    };

    const roles = extractNormalizedRoles(claims);

    expect(roles).toEqual(['admin', 'coordenador', 'tecnico']);
  });

  it('validates mandatory BFF error codes in canonical envelope', () => {
    expect(BFF_ERROR_CODES).toEqual([
      'OIDC_CALLBACK_INVALID',
      'INVALID_REQUEST',
      'SESSION_NOT_FOUND',
      'SESSION_EXPIRED',
      'TOKEN_REFRESH_FAILED',
      'FORBIDDEN',
      'SESSION_STORE_UNAVAILABLE',
      'UPSTREAM_ERROR'
    ]);

    const envelope = {
      code: 'SESSION_NOT_FOUND',
      message: 'Session was not found',
      status: 401,
      timestamp: '2026-03-17T00:00:00.000Z'
    };

    expect(() => BffErrorEnvelopeSchema.parse(envelope)).not.toThrow();
  });

  it('ensures role access seed reflects PRD initial matrix', () => {
    ROLE_ACCESS_SEED.forEach((entry) => {
      expect(() => RoleAccessConfigSchema.parse(entry)).not.toThrow();
    });

    const admin = ROLE_ACCESS_SEED.find((entry) => entry.role === 'admin');
    const coordenador = ROLE_ACCESS_SEED.find((entry) => entry.role === 'coordenador');
    const tecnico = ROLE_ACCESS_SEED.find((entry) => entry.role === 'tecnico');

    expect(admin?.screens).toEqual(['dashboard', 'ordens', 'relatorios', 'admin-acessos']);
    expect(coordenador?.screens).toEqual(['dashboard', 'ordens', 'relatorios']);
    expect(tecnico?.screens).toEqual(['dashboard', 'ordens', 'relatorios']);
  });

  it('ensures microfrontend catalog has required contract fields', () => {
    expect(MICROFRONTEND_CATALOG_SEED).toHaveLength(4);

    MICROFRONTEND_CATALOG_SEED.forEach((item) => {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.route.length).toBeGreaterThan(0);
      expect(item.entry.startsWith('https://')).toBe(true);
      expect(item.scope.length).toBeGreaterThan(0);
      expect(item.module.length).toBeGreaterThan(0);
      expect(Array.isArray(item.requiredPermissions)).toBe(true);
    });
  });
});
