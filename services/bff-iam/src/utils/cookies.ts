import type { FastifyReply } from 'fastify';

import type { BffConfig } from '../config.js';

function normalizeSameSite(value: BffConfig['sessionCookieSameSite']): 'strict' | 'lax' | 'none' {
  return value.toLowerCase() as 'strict' | 'lax' | 'none';
}

export function setSessionCookie(reply: FastifyReply, config: BffConfig, sessionId: string): void {
  reply.setCookie(config.sessionCookieName, sessionId, {
    path: '/',
    httpOnly: config.sessionCookieHttpOnly,
    secure: config.sessionCookieSecure,
    sameSite: normalizeSameSite(config.sessionCookieSameSite)
  });
}

export function clearSessionCookie(reply: FastifyReply, config: BffConfig): void {
  reply.clearCookie(config.sessionCookieName, {
    path: '/',
    httpOnly: config.sessionCookieHttpOnly,
    secure: config.sessionCookieSecure,
    sameSite: normalizeSameSite(config.sessionCookieSameSite)
  });
}