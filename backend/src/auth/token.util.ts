import { createHmac, timingSafeEqual } from 'node:crypto';
import { TokenPayload, TokenType } from './auth.types';

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signToken(
  subject: string,
  type: TokenType,
  secret: string,
  expiresInSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: subject,
    type,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const content = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(content).digest('base64url');
  return `${content}.${signature}`;
}

export function verifyToken(token: string, secret: string, type: TokenType): TokenPayload {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid token');
  }

  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret).update(content).digest();
  const receivedSignature = Buffer.from(encodedSignature, 'base64url');
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;
  if (payload.type !== type || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Expired or invalid token');
  }
  return payload;
}
