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
export function toErrorEnvelope(error, traceId) {
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
    return {
        code: 'UPSTREAM_ERROR',
        message: 'Unexpected BFF failure',
        status: 500,
        traceId,
        timestamp: new Date().toISOString()
    };
}
export function sessionStoreUnavailable(error, operation) {
    return new BffAppError('SESSION_STORE_UNAVAILABLE', 503, 'Session store unavailable', {
        operation,
        cause: error instanceof Error ? error.message : 'unknown'
    });
}
