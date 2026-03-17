import { decodeJwt } from 'jose';

import { BffAppError } from '../errors.js';

export function decodeIdTokenClaims(idToken: string): Record<string, unknown> {
  try {
    return decodeJwt(idToken) as Record<string, unknown>;
  } catch (error) {
    throw new BffAppError('OIDC_CALLBACK_INVALID', 400, 'Invalid id_token returned by OIDC provider', {
      cause: error instanceof Error ? error.message : 'unknown'
    });
  }
}