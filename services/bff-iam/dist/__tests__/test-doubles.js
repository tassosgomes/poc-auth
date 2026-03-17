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
const DEFAULT_ROLE_ACCESS = [
    {
        role: 'admin',
        permissions: ['dashboard:view', 'ordens:view', 'relatorios:view', 'role-access:manage'],
        screens: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
        routes: ['/dashboard', '/ordens', '/relatorios', '/admin/acessos'],
        microfrontends: ['dashboard', 'ordens', 'relatorios', 'admin-acessos'],
        updatedAt: '2026-03-17T00:00:00.000Z',
        updatedBy: 'test-double',
        version: 1
    },
    {
        role: 'coordenador',
        permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
        screens: ['dashboard', 'ordens', 'relatorios'],
        routes: ['/dashboard', '/ordens', '/relatorios'],
        microfrontends: ['dashboard', 'ordens', 'relatorios'],
        updatedAt: '2026-03-17T00:00:00.000Z',
        updatedBy: 'test-double',
        version: 1
    },
    {
        role: 'tecnico',
        permissions: ['dashboard:view', 'ordens:view', 'relatorios:view'],
        screens: ['dashboard', 'ordens', 'relatorios'],
        routes: ['/dashboard', '/ordens', '/relatorios'],
        microfrontends: ['dashboard', 'ordens', 'relatorios'],
        updatedAt: '2026-03-17T00:00:00.000Z',
        updatedBy: 'test-double',
        version: 1
    }
];
export class StaticPermissionService {
    snapshotFactory;
    roleAccess = new Map();
    constructor(snapshotFactory) {
        this.snapshotFactory = snapshotFactory;
        DEFAULT_ROLE_ACCESS.forEach((entry) => {
            this.roleAccess.set(entry.role, entry);
        });
    }
    async getEffectivePermissions(input) {
        return this.snapshotFactory(input);
    }
    async listRoleAccess() {
        return Array.from(this.roleAccess.values());
    }
    async updateRoleAccess(role, command) {
        const current = this.roleAccess.get(role);
        const next = {
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
