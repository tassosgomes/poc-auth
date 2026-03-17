import { ZodError } from 'zod';
export class BffAppError extends Error {
    code;
    status;
    details;
    constructor(code, status, message, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = 'BffAppError';
    }
}
export function isBffAppError(error) {
    return error instanceof BffAppError;
}
export function toErrorEnvelope(error, context = {}) {
    if (isBffAppError(error)) {
        return {
            code: error.code,
            message: error.message,
            status: error.status,
            details: error.details,
            correlationId: context.correlationId,
            traceId: context.traceId,
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
            correlationId: context.correlationId,
            traceId: context.traceId,
            timestamp: new Date().toISOString()
        };
    }
    return {
        code: 'UPSTREAM_ERROR',
        message: 'Unexpected BFF failure',
        status: 500,
        correlationId: context.correlationId,
        traceId: context.traceId,
        timestamp: new Date().toISOString()
    };
}
export function sessionStoreUnavailable(error, operation) {
    return new BffAppError('SESSION_STORE_UNAVAILABLE', 503, 'Session store unavailable', {
        operation,
        cause: error instanceof Error ? error.message : 'unknown'
    });
}
