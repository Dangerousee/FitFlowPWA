import LoginFormUI from '@components/auth/LoginFormUI';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import SnsFormUI from '@components/auth/SnsFormUI';
import { useState } from 'react';
import { useSignUp } from '@hooks/useSignUp';

export default function HomePage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('vocal2th@gmail.com');
  const [password, setPassword] = useState<string>('1234qwer');

  const {
    error,
    loading,
    isLoggedIn,
    handleNativeLogin,
  } = useAuth();

  const { handleNativeSignUp, loading: signUpLoading, error: signUpError } = useSignUp({
    onSuccess: (data) => {
      alert('회원가입이 완료되었습니다! 자동으로 로그인합니다.');
      // 회원가입 시 사용한 비밀번호를 알면 여기서 바로 로그인 가능
      // await handleNativeLogin(data.email, 'user-entered-password');
      router.push('/'); // 로그인 후 메인 페이지로 이동
    }
  });


  if (isLoggedIn) {
    router.push('/samples/handle-logout');
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      await handleNativeLogin(email, password);
      // router.push('/')
    } catch (err) {
      console.error("로그인 실패");
    }
  };

  const handleSignup = async (email: string, password: string) => {
    try {
      await handleNativeSignUp({ email: email, password: password, username: '이종원' });
    } catch (err) {
      console.error("로그인 실패");
    }
  };



  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
      }}
    >
      <LoginFormUI
        email={email}
        onEmailChange={(e) => setEmail(e.target.value)}
        password={password}
        onPasswordChange={(e) => setPassword(e.target.value)}
        onLogin={() => handleLogin(email, password)}
        onRegister={() => handleSignup(email, password)}
        loading={loading || signUpLoading}
        error={error || signUpError}
      />
      <SnsFormUI />
    </div>
  );
}
