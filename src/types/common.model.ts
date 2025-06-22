import type { NextApiRequest } from 'next';
import { JwtPayload } from 'jsonwebtoken';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  code?: string; // API에서 반환하는 에러 코드
};

export interface NextApiRequestWithUser extends NextApiRequest {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  [key: string]: any;
}