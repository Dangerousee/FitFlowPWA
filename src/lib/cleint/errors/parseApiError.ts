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
 * try {
 *   const { data } = await apiClient.post('/some/api', payload);
 *   // ... 정상 처리
 * } catch (err) {
 *   throw parseApiError(err.response, err.response?.data);
 * }
 */

export function parseApiError(response: Response, data: any): ClientApiError {
  const error = new Error(data?.message ?? `HTTP ${response.status}`) as ClientApiError;
  error.status = response.status;
  error.code = data?.code;
  return error;
}

