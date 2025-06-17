// src/components/LoginFormUI.tsx
import React, {useEffect, useState} from 'react';
import styles from '@components/auth/LoginFormUI.module.css';
import TextField, { State, Status, TextFieldType} from '@components/ui/text-fields/TextField';

// UI 컴포넌트가 받을 props 타입 정의
interface LoginFormUIProps {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  password: string;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogin: () => void;
  onRegister: () => void;
  loading: boolean;
  error: string | null;
}

export default function LoginFormUI({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onLogin,
  onRegister,
  loading,
  error,
}: LoginFormUIProps) {
    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [isDisabled, setIsDisabled] = useState<boolean>(true);

    // 이메일 형식 검사
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    useEffect(() => {
        if (!isValidEmail(email)) {
            setIsDisabled(true);
            return ;
        }
        if (password.length < 4) {
            setIsDisabled(true);
            return ;
        }
        setIsDisabled(false);
    }, [email, password]);

  return (
    <div className={styles.formContainer}>
      <h1>로그인 / 회원가입</h1>
      {error && <p className={styles.errorText}>{error}</p>}
      <div>
        <TextField
          status={Status.Empty}
          state={State.Default}
          label="이메일"
          id={'1234'}
          value={email}
          type={TextFieldType.Text}
          onClearButtonClick={() => onEmailChange({target: {value: ''}})}
          onEventHandlers={{
            onChange: onEmailChange,
          }}
          loading={loading}
          error={emailError}
          // icon={<CalendarButton onClick={() => console.log("button clicked1")}/>}
        />
      </div>
      <div>
        <TextField
          status={Status.Empty}
          state={State.Default}
          label="비밀번호"
          id="password"
          value={password}
          type={TextFieldType.Password}
          onClearButtonClick={() => onPasswordChange({target: {value: ''}})}
          onEventHandlers={{
            onChange: onPasswordChange,
          }}
          loading={loading}
          error={passwordError}
          // icon={<CalendarButton onClick={() => console.log("button clicked2")}/>}
        />
      </div>
      <button
        onClick={onLogin}
        disabled={loading || isDisabled}
        className={styles.loginButton}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
      <button
        onClick={onRegister}
        disabled={loading}
        className={styles.registerButton}
      >
        {loading ? '가입 중...' : '회원가입'}
      </button>
    </div>
  );
}
