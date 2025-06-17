// next.config.ts
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true, // skipWaiting과 함께 사용하여 서비스 워커가 활성화되자마자 페이지 제어를 시작하도록 하는 데 유용
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
