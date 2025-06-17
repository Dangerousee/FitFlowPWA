import { useEffect } from "react";

const KakaoCallback = () => {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const error = query.get("error");

    if (error) {
      window.opener?.postMessage({ success: false, error }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      window.opener?.postMessage({ success: true, code }, window.location.origin);
      window.close();
    }
  }, []);

  return <p>카카오 로그인 처리 중...</p>;
};

export default KakaoCallback;