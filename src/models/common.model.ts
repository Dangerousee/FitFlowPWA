export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  code?: string; // API에서 반환하는 에러 코드
};