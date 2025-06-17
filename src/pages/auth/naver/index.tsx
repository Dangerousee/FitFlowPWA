import { useEffect } from "react";

const NaverCallback = () => {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const state = query.get("state");
    const error = query.get("error");

    if (error) {
      window.opener?.postMessage({ success: false, error }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      window.opener?.postMessage({ success: true, code, state }, window.location.origin);
      window.close();
    }
  }, []);

  return <p>네이버 로그인 처리 중...</p>;
};

export default NaverCallback;