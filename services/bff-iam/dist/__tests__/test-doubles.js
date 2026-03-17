export class InMemorySessionStore {
    sessions = new Map();
    async get(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    async save(session) {
        this.sessions.set(session.sessionId, session);
    }
    async delete(sessionId) {
        this.sessions.delete(sessionId);
    }
    async deleteAllForUser(userId) {
        let count = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(sessionId);
                count += 1;
            }
        }
        return count;
    }
    async withRefreshLock(_sessionId, action) {
        return action();
    }
}
export class InMemoryOidcTransactionStore {
    transactions = new Map();
    async save(transaction) {
        this.transactions.set(transaction.state, transaction);
    }
    async consume(state) {
        const transaction = this.transactions.get(state) ?? null;
        this.transactions.delete(state);
        return transaction;
    }
}
export class FakeOidcClient {
    tokenSet;
    authorizationUrl;
    constructor(tokenSet, authorizationUrl = 'https://oidc.example/authorize?foo=bar') {
        this.tokenSet = tokenSet;
        this.authorizationUrl = authorizationUrl;
    }
    async createAuthorizationUrl() {
        return this.authorizationUrl;
    }
    async exchangeCode() {
        return this.tokenSet;
    }
    async refresh() {
        return this.tokenSet;
    }
    async validateIdToken(idToken) {
        return {
            sub: 'user-123',
            nonce: 'nonce-123',
            ROLES: ['admin'],
            raw: idToken
        };
    }
}
export class StaticPermissionReader {
    snapshotFactory;
    constructor(snapshotFactory) {
        this.snapshotFactory = snapshotFactory;
    }
    async getEffectivePermissions(input) {
        return this.snapshotFactory(input);
    }
}
