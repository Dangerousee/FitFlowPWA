# 🎨 UI 컴포넌트 라이브러리

이 폴더는 프로젝트 전반에서 재사용되는 기본 UI 컴포넌트들을 모아놓은 곳입니다. (e.g., Button, Input, Card, Modal)

## 📖 사용 방법

모든 컴포넌트는 `index.ts`를 통해 export 되므로, 아래와 같이 한 번에 가져와 사용할 수 있습니다.

## 🤝 기여 방법

새로운 범용 UI 컴포넌트를 추가할 때는 다음 규칙을 따라주세요.

1.  **파일 생성**: `src/components/ui/` 폴더 안에 컴포넌트 이름으로 `.tsx` 파일을 생성합니다. (e.g., `Avatar.tsx`)
2.  **접근성 준수**: 키보드 네비게이션, ARIA 속성 등 웹 접근성을 고려하여 개발합니다.
3.  **`index.ts`에 추가**: `src/components/ui/index.ts` 파일에 새로 만든 컴포넌트를 `export * from './YourComponent';` 형태로 추가해주세요.