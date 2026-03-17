import type { BffErrorCode, BffErrorEnvelope } from '@zcorp/shared-contracts';
import { ZodError } from 'zod';

export class BffAppError extends Error {
  constructor(
    public readonly code: BffErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BffAppError';
  }
}

export function isBffAppError(error: unknown): error is BffAppError {
  return error instanceof BffAppError;
}

export function toErrorEnvelope(error: unknown, traceId?: string): BffErrorEnvelope {
  if (isBffAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
      traceId,
      timestamp: new Date().toISOString()
    };
  }

  if (error instanceof ZodError) {
    return {
      code: 'INVALID_REQUEST',
      message: 'Request validation failed',
      status: 400,
      details: {
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code
        }))
      },
      traceId,
      timestamp: new Date().toISOString()
    };
  }

  return {
    code: 'UPSTREAM_ERROR',
    message: 'Unexpected BFF failure',
    status: 500,
    traceId,
    timestamp: new Date().toISOString()
  };
}

export function sessionStoreUnavailable(error: unknown, operation: string): BffAppError {
  return new BffAppError('SESSION_STORE_UNAVAILABLE', 503, 'Session store unavailable', {
    operation,
    cause: error instanceof Error ? error.message : 'unknown'
  });
}