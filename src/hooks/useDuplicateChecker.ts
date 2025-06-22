import { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import apiClient from '@lib/shared/axios';
import { API_ROUTES } from '@routes/apis';


export function useDuplicateChecker() {
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [usernameDuplicate, setUsernameDuplicate] = useState(false);

  const checkDuplicate = async (field: 'email' | 'username', value: string) => {
    try {
      const { data } = await apiClient.post(API_ROUTES.AUTH.DUPLICATE_CHECKER, {
        [field]: value,
      });

      return data.duplicateFields?.[field] === true;
    } catch (err) {
      console.error('중복 검사 요청 실패:', err);
      return false; // 실패 시 중복 아닌 걸로 처리하거나, 별도 에러 핸들링 가능
    }
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