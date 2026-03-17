import type { FixedRole, RoleAccessConfig, UserSession } from '@zcorp/shared-contracts';

import type {
  OidcClient,
  OidcFlowTransaction,
  OidcTransactionStore,
  PermissionLookupInput,
  PermissionService,
  RoleAccessUpdateCommand,
  SessionStore,
  TokenSet
} from '../types.js';

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, UserSession>();

  async get(sessionId: string): Promise<UserSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async save(session: UserSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteAllForUser(userId: string): Promise<number> {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count += 1;
      }
    }

    return count;
  }

  async withRefreshLock<T>(_sessionId: string, action: () => Promise<T>): Promise<T> {
    return action();
  }
}

export class InMemoryOidcTransactionStore implements OidcTransactionStore {
  private readonly transactions = new Map<string, OidcFlowTransaction>();

  async save(transaction: OidcFlowTransaction): Promise<void> {
    this.transactions.set(transaction.state, transaction);
  }

  async consume(state: string): Promise<OidcFlowTransaction | null> {
    const transaction = this.transactions.get(state) ?? null;
    this.transactions.delete(state);
    return transaction;
  }
}

export class FakeOidcClient implements OidcClient {
  constructor(
    private readonly tokenSet: TokenSet,
    private readonly authorizationUrl = 'https://oidc.example/authorize?foo=bar'
  ) {}

  async createAuthorizationUrl(): Promise<string> {
    return this.authorizationUrl;
  }

  async exchangeCode(): Promise<TokenSet> {
    return this.tokenSet;
  }

  async refresh(): Promise<TokenSet> {
    return this.tokenSet;
  }

  async validateIdToken(idToken: string): Promise<Record<string, unknown>> {
    return {
      sub: 'user-123',
      nonce: 'nonce-123',
      ROLES: ['admin'],
      raw: idToken
    };
  }
}

const DEFAULT_ROLE_ACCESS: RoleAccessConfig[] = [
  {
    role: 'admin',
    permissions: ['dashboard:view', 'ordens:view', 'ordens:create', 'relatorios:view', 'role-access:manage'],
    screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
    routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios', 'mfe-admin-acessos'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'test-double',
    version: 1
  },
  {
    role: 'coordenador',
    permissions: ['dashboard:view', 'ordens:view', 'ordens:create', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'test-double',
    version: 1
  },
  {
    role: 'tecnico',
    permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
    screens: ['dashboard', 'ordens', 'relatorios'],
    routes: ['/dashboard', '/ordens', '/relatorios'],
    microfrontends: ['mfe-dashboard', 'mfe-ordens', 'mfe-relatorios'],
    updatedAt: '2026-03-17T00:00:00.000Z',
    updatedBy: 'test-double',
    version: 1
  }
];

export class StaticPermissionService implements PermissionService {
  private readonly roleAccess = new Map<FixedRole, RoleAccessConfig>();

  constructor(private readonly snapshotFactory: (input: PermissionLookupInput) => Record<string, unknown>) {
    DEFAULT_ROLE_ACCESS.forEach((entry) => {
      this.roleAccess.set(entry.role, entry);
    });
  }

  async getEffectivePermissions(input: PermissionLookupInput) {
    return this.snapshotFactory(input) as Awaited<ReturnType<PermissionService['getEffectivePermissions']>>;
  }

  async listRoleAccess(): Promise<RoleAccessConfig[]> {
    return Array.from(this.roleAccess.values());
  }

  async updateRoleAccess(role: FixedRole, command: RoleAccessUpdateCommand): Promise<RoleAccessConfig> {
    const current = this.roleAccess.get(role);
    const next: RoleAccessConfig = {
      role,
      permissions: [...command.permissions],
      screens: [...command.screens],
      routes: [...command.routes],
      microfrontends: [...command.microfrontends],
      updatedAt: '2026-03-17T12:00:00.000Z',
      updatedBy: command.updatedBy,
      version: current ? current.version + 1 : 1
    };

    this.roleAccess.set(role, next);
    return next;
  }
}