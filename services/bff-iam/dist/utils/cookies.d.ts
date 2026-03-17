import type { FastifyReply } from 'fastify';
import type { BffConfig } from '../config.js';
export declare function setSessionCookie(reply: FastifyReply, config: BffConfig, sessionId: string): void;
export declare function clearSessionCookie(reply: FastifyReply, config: BffConfig): void;
