export interface ClientErrorOptions {
  statusCode?: number;
  message?: string;
  code?: string;
  data?: unknown;
}

/**
 * 사용 예시:
 *
 * ✅ 일반 함수 안에서 직접 throw
 * if (!user) {
 *   throwClientError({ message: '유저를 찾을 수 없습니다.', code: 'USER_NOT_FOUND' });
 * }
 *
 * ✅ try-catch 블록에서 재throw
 * try {
 *   await login(payload);
 * } catch (err: any) {
 *   throwClientError({
 *     message: '로그인 중 오류 발생',
 *     code: err.code,
 *     data: err.response?.data,
 *   });
 * }
 */
export function throwClientError(options: ClientErrorOptions): never {
  throw {
    statusCode: options.statusCode ?? 400,
    message: options.message ?? '알 수 없는 오류가 발생했습니다.',
    code: options.code,
    data: options.data,
  };
}

/**
 * Error를 확장한 커스텀 Error 클래스
 *
 * 사용 예시:
 * throw new ClientError({ message: '검증 실패', code: 'VALIDATION_ERROR' });
 */
export class ClientError extends Error {
  statusCode: number;
  code?: string;
  data?: unknown;

  constructor({ message, statusCode = 400, code, data }: ClientErrorOptions) {
    super(message);
    this.name = 'ClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;

    Object.setPrototypeOf(this, ClientError.prototype); // for instanceof
  }
}