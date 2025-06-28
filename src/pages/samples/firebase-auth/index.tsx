import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  AuthError,
} from 'firebase/auth';
import { auth } from '@lib/cleint/config/firebase'; // 위에서 생성한 firebase 초기화 파일

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setError('');
    } catch (err: unknown) {
      setError((err as AuthError).message);
      setUser(null);
    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setError('');
    } catch (err: unknown) {
      setError((err as AuthError).message);
      setUser(null);
    }
  };

  return (
    <div>
      <h1>Firebase Auth with Next.js</h1>
      {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
