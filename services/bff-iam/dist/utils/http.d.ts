import type { FastifyRequest } from 'fastify';
export declare function buildUpstreamHeaders(request: FastifyRequest, accessToken: string): Headers;
export declare function buildUpstreamBody(request: FastifyRequest): BodyInit | undefined;
export declare function copyResponseHeaders(source: Headers, target: {
    header: (name: string, value: string) => void;
}): void;
