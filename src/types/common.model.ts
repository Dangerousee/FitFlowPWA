import type { NextApiRequest } from 'next';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  code?: string; // API에서 반환하는 에러 코드
};

export interface NextApiRequestWithUser extends NextApiRequest {
  user?: any; // 또는 정확한 타입: UserPayload 같은 타입
}