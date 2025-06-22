// 클라이언트용
export interface ClientApiError extends Error {
  code?: string;
  status?: number;
}

/**
 * 서버에서 내려온 API 에러 응답(body: { message, code })를 JS Error 객체로 래핑하여 throw할 수 있도록 변환해준다.
 * - 기존 `throw new Error(...)` 방식은 code/status를 포함하지 않기 때문에 catch(err.code) 분기 불가능
 * - 이 유틸을 통해 클라이언트에서도 code 값을 안전하게 유지하고 분기 처리 가능
 *
 * 사용 예시:
 * const res = await fetch(...);
 * const data = await res.json();
 * if (!res.ok) throw parseApiError(res, data);
 */
export function parseApiError(response: Response, data: any): ClientApiError {
  const error = new Error(data.message || `HTTP ${response.status}`) as ClientApiError;
  if (data.code) error.code = data.code; // 서버에서 내려준 error.code를 직접 복사
  error.status = response.status;        // HTTP 상태코드도 활용 가능하도록 유지
  return error;
}