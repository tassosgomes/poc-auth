import type { BffErrorCode, BffErrorEnvelope } from '@zcorp/shared-contracts';
export declare class BffAppError extends Error {
    readonly code: BffErrorCode;
    readonly status: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: BffErrorCode, status: number, message: string, details?: Record<string, unknown> | undefined);
}
export declare function isBffAppError(error: unknown): error is BffAppError;
interface ErrorEnvelopeContext {
    correlationId?: string;
    traceId?: string;
}
export declare function toErrorEnvelope(error: unknown, context?: ErrorEnvelopeContext): BffErrorEnvelope;
export declare function sessionStoreUnavailable(error: unknown, operation: string): BffAppError;
export {};
