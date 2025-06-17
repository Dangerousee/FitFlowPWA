// jest.config.js
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Jest 설정 파일 경로
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    // CSS Modules, 이미지 파일 등을 모킹 처리
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 경로 별칭(@/) 설정 (tsconfig.json과 일치하도록)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // TypeScript 파일을 ts-jest로 트랜스폼
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // Next.js의 SWC 컴파일러와 충돌을 피하기 위한 설정 (선택 사항, 필요시 추가)
  // preset: 'next/babel', // 또는
  // transformIgnorePatterns: [
  //   '/node_modules/',
  //   '^.+\\.module\\.(css|sass|scss)$',
  // ],
  // Playwright 테스트 파일이 있는 폴더를 제외합니다.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/' // e2e 폴더 제외
  ],
};
