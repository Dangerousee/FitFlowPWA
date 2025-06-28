import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// 1. Axios 인스턴스 생성
const apiClient = axios.create({
  // baseURL: API 요청의 기본 URL을 설정합니다.
  // Vercel 배포 환경에서는 상대 경로('/api')가 잘 동작합니다.
  // 외부 API 서버가 있다면 'https://api.example.com'과 같이 설정합니다.
  baseURL: process.env.NEXT_PUBLIC_API_URL,

  // 요청 타임아웃 설정 (ms)
  timeout: 10000,

  // 기본 헤더 설정
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. 요청 인터셉터 (Request Interceptor)
//    - 모든 API 요청이 서버로 전송되기 전에 실행됩니다.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 여기서 요청을 보내기 전에 수행할 로직을 작성합니다.
    // 예: 로컬 스토리지에서 액세스 토큰을 가져와 헤더에 추가
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    // 요청 에러 처리
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
//    - 서버로부터 응답을 받은 후, .then() 또는 .catch()로 처리되기 전에 실행됩니다.
apiClient.interceptors.response.use(
  (response) => {
    // 2xx 범위의 상태 코드에 대한 응답 데이터 처리
    // axios는 기본적으로 response.data에 실제 데이터를 담아주므로 그대로 반환합니다.
    return response;
  },
  (error: AxiosError) => {
    // 2xx 외의 상태 코드에 대한 에러 처리
    // 예: 401 Unauthorized 에러 시 로그인 페이지로 리디렉션
    if (error.response?.status === 401) {
      console.error('Unauthorized! Redirecting to login...');
      // 여기서 로그아웃 처리 및 로그인 페이지로 리디렉션 로직을 구현할 수 있습니다.
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;