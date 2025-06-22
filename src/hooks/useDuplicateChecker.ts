import { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';

export function useDuplicateChecker() {
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [usernameDuplicate, setUsernameDuplicate] = useState(false);

  // 실제 API 요청 로직
  const checkDuplicate = async (field: 'email' | 'username', value: string) => {
    const res = await fetch('/api/auth/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });

    const data = await res.json();
    return data.duplicateFields?.[field] === true;
  };

  // 디바운스된 함수: 300ms 대기 후 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckDuplicate = useCallback(
    debounce(async (field: 'email' | 'username', value: string) => {
      const isDuplicate = await checkDuplicate(field, value);
      if (field === 'email') setEmailDuplicate(isDuplicate);
      if (field === 'username') setUsernameDuplicate(isDuplicate);
    }, 300),
    []
  );

  return {
    emailDuplicate,
    usernameDuplicate,
    checkEmail: (value: string) => debouncedCheckDuplicate('email', value),
    checkUsername: (value: string) => debouncedCheckDuplicate('username', value),
  };
}

// const {
//   emailDuplicate,
//   usernameDuplicate,
//   checkEmail,
//   checkUsername,
// } = useDuplicateChecker();
//
// <input
//   value={email}
// onChange={(e) => {
//   setEmail(e.target.value);
//   checkEmail(e.target.value);
// }}
// />
//
// <input
// value={username}
// onChange={(e) => {
//   setUsername(e.target.value);
//   checkUsername(e.target.value);
// }}
// />
//
// {emailDuplicate && <p>이미 사용 중인 이메일입니다.</p>}
//   {usernameDuplicate && <p>이미 사용 중인 사용자명입니다.</p>}