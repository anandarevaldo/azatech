export type TokenType = 'access' | 'refresh';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface TokenPayload {
  sub: string;
  type: TokenType;
  iat: number;
  exp: number;
}
