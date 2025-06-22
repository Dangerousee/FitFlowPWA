// lib/jwt/issue.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { SupabaseUserDTO } from '@types';

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const getPayload = (user: SupabaseUserDTO) => ({
  sub: user.id,
  email: user.email,
  username: user.username,
  role: user.userRole,
  plan: user.planType,
});

export function issueAccessTokenFromPayload(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

/**
 * Access Token 발급
 */
export function issueAccessToken(user: SupabaseUserDTO): string {
  return jwt.sign(getPayload(user), ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

/**
 * Refresh Token 발급
 */
export function issueRefreshToken(user: SupabaseUserDTO): string {
  return jwt.sign(getPayload(user), REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}