import LoginFormUI from '@components/auth/LoginFormUI';
import { useLogin } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import SnsFormUI from '@components/auth/SnsFormUI';
import { useState } from 'react';
import { useSignUp } from '@hooks/useSignUp';

export default function HomePage() {
  const [email, setEmail] = useState<string>('vocal2th@gmail.com');
  const [password, setPassword] = useState<string>('1234qwer');

  const {
    error,
    loading,
    isLoggedIn,
    handleNativeLogin,
  } = useLogin();
  const { handleNativeSignUp, loading: signUpLoading, error: signUpError } = useSignUp();
  const router = useRouter();

  if (isLoggedIn) {
    router.push('/samples/handle-logout');
  }

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
        onLogin={() => handleNativeLogin(email, password)}
        onRegister={() => handleNativeSignUp({ email: email, password: password, username: '이종원' })}
        loading={loading || signUpLoading}
        error={error || signUpError}
      />
      <SnsFormUI />
    </div>
  );
}
