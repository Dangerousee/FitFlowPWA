/**
 * - email 중복: SNS 가입자가 같은 이메일을 쓰는 상황 방지
 * → login_type + email에 대한 복합 unique index 고려
 * - native 사용자만 password 저장
 * → DB에 password 컬럼은 nullable로 두고, SNS 유저는 null 처리
 * - login_type 누락 방지
 * → 회원가입 API나 로그인 라우트에서 login_type 미지정 방지 로직 추가
 */
import { useState } from 'react';
import { UseRegisterResult } from '@models/auth.model';

export function useRegister(): UseRegisterResult {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  //
  // 아직 우리 커뮤니티의 멤버가 아니시네요!
  // 회원가입을 진행하시겠어요?

  const ERROR_MESSAGES = {
    REGISTER_NETWORK: '회원가입 중 네트워크 또는 응답 처리 오류: ',
  };

  // --- Helper Functions ---
  function generateUsername(email: string): string {
    const prefix = email.split('@')[0];
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}_${randomNumber}`;
  }

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username: username || generateUsername(email),
        }),
      };

      const response = await fetch('/api/auth/register', options);
      const data = await response.json();

      if (!response.ok) {
        console.error(`${options.method} 회원가입 실패 (서버 응답)::`, data);
        const errorMessage = data.message || `회원가입 중 오류 (HTTP ${response.status})`;
        const errorCode = data.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorCode}`);
      }

      // TODO 성공 처리
      console.log('회원가입 성공:', data);
    } catch (err: any) {
      console.error('Register processing error:', err);
      setError(ERROR_MESSAGES.REGISTER_NETWORK + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    error,
    loading,
    handleRegister,
  };
}