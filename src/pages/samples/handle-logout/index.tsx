import { useAuth } from '@/contexts/AuthContext';

const HandleLogout = () => {
  // authLoading 상태 추가
  const { handleLogout, isLoggedIn, email, authLoading } = useAuth();

  // 인증 상태 확인 중일 때 로딩 메시지 표시
  if (authLoading) {
    return <p>인증 정보를 확인 중입니다...</p>;
  }

  if (!isLoggedIn) {
    return <p>로그인이 필요합니다.</p>;
  }

  return (
    <div>
      <p>환영합니다, {email}님!</p>
      <button onClick={() => handleLogout('/')}>로그아웃</button>
    </div>
  );
};

export default HandleLogout;