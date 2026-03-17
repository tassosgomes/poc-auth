import { sessionStoreUnavailable } from '../errors.js';
const OIDC_TRANSACTION_PREFIX = 'oidc_tx:';
function transactionKey(state) {
    return `${OIDC_TRANSACTION_PREFIX}${state}`;
}
export class RedisOidcTransactionStore {
    redis;
    config;
    constructor(redis, config) {
        this.redis = redis;
        this.config = config;
    }
    async save(transaction) {
        try {
            await this.redis.set(transactionKey(transaction.state), JSON.stringify(transaction), {
                EX: this.config.oidcTransactionTtlSeconds
            });
        }
        catch (error) {
            throw sessionStoreUnavailable(error, 'save-oidc-transaction');
        }
    }
    async consume(state) {
        try {
            const raw = await this.redis.getDel(transactionKey(state));
            return raw ? JSON.parse(raw) : null;
        }
        catch (error) {
            throw sessionStoreUnavailable(error, 'consume-oidc-transaction');
        }
    }
}
