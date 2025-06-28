// 서버용
export interface AppError {
  statusCode?: number;
  message: string;
  code?: string;
  internalError?: string;
}

/**
 * 서버 내부에서 발생한 에러 객체를 HTTP 응답 형식으로 정제하여 반환하는 함수.
 * - API 라우트의 catch 블록에서 사용하여 일관된 에러 응답 구조를 유지할 수 있음
 * - statusCode, message, code 등을 추출하고, 개발 환경에서는 internalError도 포함 가능
 *
 * 사용 예시:
 * catch (error) {
 *   const { status, body } = handleApiErrors(error);
 *   return res.status(status).json(body);
 * }
 */
export function handleApiErrors(error: unknown): {
  status: number;
  body: { message: string; code?: string; error?: string; data?: any };
} {
  const fallback: AppError = {
    statusCode: 500,
    message: '내부 서버 오류가 발생했습니다.',
  };

  const err = (typeof error === 'object' && error !== null) ? error as any : fallback;

  const status = err.statusCode || 500;
  const message = err.message || fallback.message;

  const body: { message: string; code?: string; error?: string; data?: any } = {
    message,
  };

  if (err.code) body.code = err.code;
  if (err.data) body.data = err.data;

  // 개발 환경에서만 내부 디버깅 메시지 포함
  if (process.env.NODE_ENV === 'development' && err.internalError) {
    body.error = err.internalError;
  }

  return { status, body };
}