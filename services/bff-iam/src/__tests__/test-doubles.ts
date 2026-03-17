import type { UserSession } from '@zcorp/shared-contracts';

import type {
  OidcClient,
  OidcFlowTransaction,
  OidcTransactionStore,
  PermissionLookupInput,
  PermissionReader,
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

export class StaticPermissionReader implements PermissionReader {
  constructor(private readonly snapshotFactory: (input: PermissionLookupInput) => Record<string, unknown>) {}

  async getEffectivePermissions(input: PermissionLookupInput) {
    return this.snapshotFactory(input) as Awaited<ReturnType<PermissionReader['getEffectivePermissions']>>;
  }
}