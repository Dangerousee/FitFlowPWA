FitFlowPWA
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
# Jest 유닛/통합 테스트 실행
npm run test:unit
# Jest 유닛/통합 테스트 (watch 모드)
npm run test:unit:watch
# Playwright E2E 테스트 실행
npm run test:e2e
# Playwright E2E 테스트 (UI 모드)
npm run test:e2e:ui
# 모든 테스트 실행
npm test
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# 🏋️ Fit Flow - 피트니스 PWA

Fit Flow는 사용자가 자신의 운동 루틴을 기록하고 진행 상황을 추적할 수 있도록 돕는 프로그레시브 웹 앱(PWA)입니다.

## ✨ 주요 기능

-   소셜 로그인 (Google, Kakao) 및 이메일 회원가입
-   운동 루틴 생성 및 관리
-   날짜별 운동 기록 및 조회
-   (추가 예정) 운동 성과 통계 및 차트

## 🛠️ 기술 스택

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS, clsx
-   **Backend & DB**: Supabase
-   **State Management**: Zustand (또는 Jotai)
-   **Linting & Formatting**: ESLint, Prettier

## 🚀 시작하기

### 1. 환경 변수 설정

프로젝트를 실행하기 전에, 루트 디렉토리에 `.env.local` 파일을 생성하고 아래 내용을 채워주세요. Supabase 프로젝트 대시보드에서 키를 확인할 수 있습니다.
