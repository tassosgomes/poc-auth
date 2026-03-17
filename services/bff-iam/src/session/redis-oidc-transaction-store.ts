import type { RedisClientType } from 'redis';

import { sessionStoreUnavailable } from '../errors.js';
import type { BffConfig } from '../config.js';
import type { OidcFlowTransaction, OidcTransactionStore } from '../types.js';

const OIDC_TRANSACTION_PREFIX = 'oidc_tx:';
type AnyRedisClient = RedisClientType<any, any, any>;

function transactionKey(state: string): string {
  return `${OIDC_TRANSACTION_PREFIX}${state}`;
}

export class RedisOidcTransactionStore implements OidcTransactionStore {
  constructor(
    private readonly redis: AnyRedisClient,
    private readonly config: Pick<BffConfig, 'oidcTransactionTtlSeconds'>
  ) {}

  async save(transaction: OidcFlowTransaction): Promise<void> {
    try {
      await this.redis.set(transactionKey(transaction.state), JSON.stringify(transaction), {
        EX: this.config.oidcTransactionTtlSeconds
      });
    } catch (error) {
      throw sessionStoreUnavailable(error, 'save-oidc-transaction');
    }
  }

  async consume(state: string): Promise<OidcFlowTransaction | null> {
    try {
      const raw = await this.redis.getDel(transactionKey(state));
      return raw ? (JSON.parse(raw) as OidcFlowTransaction) : null;
    } catch (error) {
      throw sessionStoreUnavailable(error, 'consume-oidc-transaction');
    }
  }
}