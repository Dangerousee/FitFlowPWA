// src/pages/index.tsx
import LoginFormUI from '@components/auth/LoginFormUI';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import SnsFormUI from '@components/auth/SnsFormUI';

export default function HomePage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    error,
    loading,
    isLoggedIn,
    authLoading,
    handleLogin,
    handleRegister,
    handleLogout,
  } = useAuth();
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
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loading}
        error={error}
      />
      <SnsFormUI />
    </div>
  );
}
