import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect, useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from "next/router";

export interface ExitDetectContextType {
  showExitConfirmation: boolean,
  setAllowedPaths: Dispatch<SetStateAction<string[]>>,
  confirmNavigation: () => void,
  cancelNavigation: () => void,
  setPendingNavigationPath: Dispatch<SetStateAction<string | null>>,
}

export const ExitDetectContext = createContext<ExitDetectContextType | undefined>(undefined);

export const ExitDetectProvider = ({ children }: { children: ReactNode }) => {

  // 확인 모달 표시 여부
  const [showExitConfirmation, setShowExitConfirmation] = useState<boolean>(false);

  // 허용된 경로 목록
  const [allowedPaths, setAllowedPaths] = useState<string[]>(['/']);

  // 보류 중인 내비게이션
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  // 원래 경로 저장
  const [originalPath, setOriginalPath] = useState<string | null>(null);

  const skipRouteDetectionRef = useRef(false);

  // 새로고침 여부 저장할 ref
  const isRefreshingRef = useRef(false);

  const router = useRouter();

  /**
   * 이동을 허용할 경로 설정
   */
  const isAllowedPath = useCallback((url: string) => {
    if (!url) return false;
    return allowedPaths.some((path) => {
      if (path === '/') return url === '/';
      return url.startsWith(path);
    });
  }, [allowedPaths]);

  /**
   * 사용자가 내비게이션을 "확인"했을 때 호출될 함수
   */
  const confirmNavigation = useCallback(() => {
    if (!pendingNavigationPath) return;

    // 1. 다음 라우팅은 감지 로직을 건너뛰도록 플래그 설정
    skipRouteDetectionRef.current = true;
    // 2. 모달을 닫고 상태 초기화
    setShowExitConfirmation(false);
    // 3. 보류 중이던 경로로 이동
    router.replace(pendingNavigationPath);
    // 4. 상태 초기화
    // setPendingNavigationPath(null);
    setOriginalPath(null);
  }, [pendingNavigationPath, router]);

  /**
   * 사용자가 내비게이션을 "취소"했을 때 호출될 함수
   */
  const cancelNavigation = useCallback(() => {
    // 1. 모달 닫기 및 상태 초기화
    setShowExitConfirmation(false);
    // setPendingNavigationPath(null);
    // 2. 브라우저 URL을 원래 경로로 복원
    if (originalPath) {
      window.history.replaceState(null, '', originalPath);
    }
    setOriginalPath(null);
  }, [originalPath]);

  const blockNavigation = (targetUrl: string) => {
    setOriginalPath(router.asPath); // 현재 경로를 원래 경로로 저장
    setShowExitConfirmation(true);
  };

  useEffect(() => {
    /**
     * [브라우저 뒤로가기 감지]
     * popstate 이벤트는 사용자가 브라우저의 뒤로가기 버튼을 눌렀을 때 발생 됨.
     * 제외된 URL이 아니라면:
     *  - pendingNavigationPath를 해당 경로로 설정하고
     *  - showExitConfirmation로 이탈 감지 여부 트리거
     *  - history.pushState()를 사용하여 실제 페이지 이동을 무효화 처리 (이동은 모달 처리 후 명시적으로 진행)
     */
    const handlePopState = () => {
      const url = document.location.pathname;
      if (!isAllowedPath(url)) {
        blockNavigation(url);
        history.pushState(null, "", location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAllowedPath, router.asPath]);

  useEffect(() => {
    /**
     * [클라이언트 라우팅 감지]
     * Next.js의 router.push() 또는 <Link /> 클릭처럼 내부 라우팅이 발생할 때 호출 됨.
     * - 프로그래밍적 이동(`skipRouteDetectionRef`)이면 무시
     * - 감지 제외 URL이 아니라면:
     *    - pendingNavigationPath 설정 → confirm 모달에서 사용할 목적지
     *    - showExitConfirmation로 → 모달 트리거
     *    - routeChangeError + throw → Next.js 라우팅 강제 취소
     */
    const handleRouteChangeStart = (url: string) => {
      if (skipRouteDetectionRef.current) {
        return;
      }
      if (!isAllowedPath(url)) {
        setPendingNavigationPath(url);
        blockNavigation(url);

        // 이동 취소 트릭 (Next.js의 routeChangeError를 강제로 발생시켜 차단
        router.events.emit('routeChangeError');
        throw 'routeChange aborted by ExitDetectContext';
      }
    };

    /**
     * 라우팅 완료 후 처리
     * 프로그래밍 방식으로 승인된 내비게이션이 완료된 후,
     * 다음 사용자 상호작용을 위해 감지 스킵 플래그를 초기화합니다.
     * 이것이 레이스 컨디션을 해결하는 가장 확실한 방법입니다.
     */
    const handleRouteChangeComplete = () => {
      if (skipRouteDetectionRef.current) {
        skipRouteDetectionRef.current = false;
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [isAllowedPath, router.asPath]);

  /**
   * ExitDetectContext는 Next.js 내부 라우팅과 브라우저 히스토리(뒤로가기/앞으로가기)는 제대로 처리하지만, 사용자가 <a href="https://google.com">처럼 완전히 다른 도메인으로 이동하거나,
   * 주소창에 직접 다른 URL을 입력하거나, 탭을 닫으려고 할 때는 감지하지 못한다. 이러한 "페이지 이탈"을 감지하기 위해서는 브라우저가 제공하는 네이티브 이벤트인 **beforeunload**를 사용해야 한다.
   *
   * beforeunload를 사용하면 다른 사이트로의 이동을 감지하고 막을 수 있지만, 매우 중요한 한계점이 있으며 보안상의 이유로, beforeunload 이벤트 핸들러 내에서는 직접 만든 커스텀 React 모달(ConfirmModal)을
   * 띄울 수 없다.대신, 브라우저가 제공하는 네이티브 확인 대화상자가 표시된다. 이 대화상자의 문구는 대부분의 최신 브라우저에서 개발자가 원하는 대로 바꿀 수 없으며, "이 사이트를 나가시겠습니까?
   * 변경사항이 저장되지 않을 수 있습니다."와 같은 표준 메시지가 나오는데 이는 악의적인 사이트가 사용자를 가짜 대화상자로 속여서 나가지 못하게 만드는 피싱 공격을 방지하기 위한 브라우저의 보안 정책이다.
   */
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     // F5 또는 Ctrl+R / Cmd+R 키를 감지
  //     if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
  //       isRefreshingRef.current = true;
  //     }
  //   };
  //
  //   const handleBeforeUnload = (e) => {
  //     // 1. 프로그래밍 방식으로 승인된 내비게이션인 경우, 아무것도 하지 않고 통과
  //     // 이로써 confirmNavigation 후 네이티브 확인 창이 뜨는 것을 방지
  //     if (skipRouteDetectionRef.current) {
  //       return;
  //     }
  //
  //     // isRefreshingRef 플래그가 true이면, 새로고침으로 판단하고 아무것도 하지 않음
  //     if (isRefreshingRef.current) {
  //       isRefreshingRef.current = false; // 다음 이벤트를 위해 플래그 초기화
  //       return;
  //     }
  //
  //     // 새로고침이 아닌 경우에만 이탈 방지 로직 실행
  //     e.preventDefault();
  //     // Chrome에선 returnValue 값 설정 시 prompt가 표시됨
  //     e.returnValue = '';
  //   };
  //
  //   window.addEventListener('keydown', handleKeyDown);
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, []);

  const value = useMemo(
    () => ({
      showExitConfirmation,
      setAllowedPaths,
      confirmNavigation,
      cancelNavigation,
      setPendingNavigationPath
    }),
    [showExitConfirmation, setAllowedPaths, confirmNavigation, cancelNavigation, setPendingNavigationPath]
  );

  return (
    <ExitDetectContext.Provider value={value}>{children}</ExitDetectContext.Provider>
  );
};

/**
 * const { showExitConfirmation, setAllowedPaths, confirmNavigation, cancelNavigation, setPendingNavigationPath } = useExitDetectContext();
 * const isInitialRender = useRef(true);
 *
 *   useEffect(() => {
 *     if (isInitialRender.current) {
 *       isInitialRender.current = false;
 *       return;
 *     }
 *     if (showExitConfirmation) {
 *       openConfirmModal({
 *         mainTitle: '',
 *         contents: (<>지금 화면을 나가면<br />입력한 정보들은 저장되지 않아요.<br />그래도 화면을 나가시겠습니까?</>),
 *         onClick: {
 *           primaryBtn: confirmNavigation,
 *           secondaryBtn: cancelNavigation,
 *         },
 *         close: cancelNavigation,
 *       });
 *     }
 *   }, [showExitConfirmation, confirmNavigation, cancelNavigation]);
 *
 */
export const useExitDetectContext = () => useContext(ExitDetectContext);