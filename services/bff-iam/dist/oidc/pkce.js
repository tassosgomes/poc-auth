import { createHash, randomBytes } from 'node:crypto';
export function generateRandomToken(size = 32) {
    return randomBytes(size).toString('base64url');
}
export function createCodeChallenge(codeVerifier) {
    return createHash('sha256').update(codeVerifier).digest('base64url');
}
