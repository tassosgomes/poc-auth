const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'content-length',
    'cookie',
    'host',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade'
]);
export function buildUpstreamHeaders(request, accessToken) {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
        if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase()) || name.toLowerCase() === 'authorization') {
            continue;
        }
        if (Array.isArray(value)) {
            headers.set(name, value.join(','));
            continue;
        }
        headers.set(name, String(value));
    }
    headers.set('authorization', `Bearer ${accessToken}`);
    headers.set('x-correlation-id', request.id);
    return headers;
}
export function buildUpstreamBody(request) {
    if (request.method === 'GET' || request.method === 'HEAD') {
        return undefined;
    }
    if (request.body === undefined || request.body === null) {
        return undefined;
    }
    if (typeof request.body === 'string') {
        return request.body;
    }
    if (request.body instanceof Uint8Array) {
        return Buffer.from(request.body);
    }
    return JSON.stringify(request.body);
}
export function copyResponseHeaders(source, target) {
    for (const [name, value] of source.entries()) {
        if (HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
            continue;
        }
        target.header(name, value);
    }
}
