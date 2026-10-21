import * as bcrypt from 'bcryptjs';
import { createHash, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  if (encodedHash.startsWith('$2')) return bcrypt.compareSync(password, encodedHash);

  // Kompatibilitas satu kali untuk hash scrypt lama sebelum user menjalankan seed ulang.
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
