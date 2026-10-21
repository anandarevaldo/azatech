import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [algorithm, salt, encodedKey] = encodedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !encodedKey) return false;

  const expectedKey = Buffer.from(encodedKey, 'hex');
  const actualKey = scryptSync(password, salt, expectedKey.length);
  return (
    expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey)
  );
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
