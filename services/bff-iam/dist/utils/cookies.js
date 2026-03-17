function normalizeSameSite(value) {
    return value.toLowerCase();
}
export function setSessionCookie(reply, config, sessionId) {
    reply.setCookie(config.sessionCookieName, sessionId, {
        path: '/',
        httpOnly: config.sessionCookieHttpOnly,
        secure: config.sessionCookieSecure,
        sameSite: normalizeSameSite(config.sessionCookieSameSite)
    });
}
export function clearSessionCookie(reply, config) {
    reply.clearCookie(config.sessionCookieName, {
        path: '/',
        httpOnly: config.sessionCookieHttpOnly,
        secure: config.sessionCookieSecure,
        sameSite: normalizeSameSite(config.sessionCookieSameSite)
    });
}
