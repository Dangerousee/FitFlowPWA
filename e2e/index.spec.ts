import { test, expect, Page } from '@playwright/test';

const AUTH_TOKEN_KEY = 'fitflow_auth_token'; // useAuth.ts 내부의 키와 동일하게

// 테스트 전 localStorage의 인증 토큰을 지우는 헬퍼 함수
const clearAuthTokenInLocalStorage = async (page: Page) => {
  await page.evaluate((key) => localStorage.removeItem(key), AUTH_TOKEN_KEY);
};

test.describe('HomePage (로그인 페이지)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. 먼저 홈페이지로 이동합니다.
    await page.goto('/');
    // 2. 그 다음 localStorage를 조작합니다.
    await clearAuthTokenInLocalStorage(page);
    // 페이지가 완전히 로드되고, 로그인 폼의 특정 요소가 보일 때까지 대기
    await expect(page.getByPlaceholder('이메일')).toBeVisible({ timeout: 10000 });
  });

  test('로그인하지 않았을 때 로그인 폼이 보여야 함', async ({ page }) => {
    await expect(page.getByPlaceholder('이메일')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('이메일과 비밀번호 필드에 타이핑이 가능해야 함', async ({ page }) => {
    const emailInput = page.getByPlaceholder('이메일');
    const passwordInput = page.getByPlaceholder('비밀번호');

    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('이미 로그인된 상태라면 (localStorage에 토큰 존재) /samples/handle-logout으로 리디렉션되어야 함', async ({ page }) => {
    // beforeEach에서 이미 page.goto('/') 및 초기 토큰 제거가 수행됨

    // localStorage에 토큰을 설정하여 로그인 상태 시뮬레이션
    await page.evaluate((key) => {
      localStorage.setItem(key, 'dummy-test-token-for-redirect');
    }, AUTH_TOKEN_KEY);

    // 페이지를 다시 로드하거나 새로 이동하여 AuthContext가 토큰을 읽도록 함
    await page.reload(); // 또는 page.goto('/'); 다시 호출

    await expect(page).toHaveURL('/samples/handle-logout', { timeout: 10000 });
    await expect(page.getByText('환영합니다,')).toBeVisible();
  });
});