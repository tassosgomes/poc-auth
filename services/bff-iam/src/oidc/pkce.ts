import { createHash, randomBytes } from 'node:crypto';

export function generateRandomToken(size = 32): string {
  return randomBytes(size).toString('base64url');
}

export function createCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}