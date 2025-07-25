import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface SingletonLoadingContextType {
  isLoading: boolean,
  showLoading: () => void,
  hideLoading: () => void,
  showGroupLoading: (id: string) => void,
  hideGroupLoading: (id: string, timeout?: number) => void,
  clearLoading: () => void
}

/**
 * @description 애플리케이션 전체에서 단일 로딩 상태를 관리하기 위한 Context입니다.
 * 이 Context는 여러 비동기 작업 그룹의 로딩 상태를 통합적으로 제어하고,
 * 중복 로딩 표시를 방지하며, 모든 작업 완료 시 로딩을 숨기는 기능을 제공합니다.
 */
const SingletonLoadingContext = createContext<SingletonLoadingContextType | undefined>(undefined);

// 로딩 작업 그룹의 상태를 나타내는 타입
type LoadingTaskGroup = { [id: string]: boolean };

export const SingletonLoadingProvider = ({ children }: { children: ReactNode }) => {
  /**
   * @description 컴포넌트가 언마운트 될 시 발생 가능한 memory leak을 막기 위한 변수
   * 예를들면 authorized를 감지하던 하위 컴포넌트가 감지 후 router.push로 페이지 이동하면 컴포넌트가 언마운트 되는데
   * 이 때 아직 완료되지 않은 비동기 작업이 언마운트 된 컴포넌트의 상태를 변경하려고하면 발생 할 수 있다.
   * ref를 저장하고 있다가 useEffect의 언마운트에서 제거 해준다.
   */
  const timersRef = useRef<NodeJS.Timeout[]>([]); // setTimeout 타이머 ID들을 저장할 ref
  /**
   * @description 현재 전체 로딩 UI (dimmed 등)가 활성화되어 있는지 여부를 추적하는 ref.
   * `isLoading` state와 별도로 관리하여, `showLoading` 중복 호출 시 경고를 표시하는 데 사용됩니다.
   */
  const loadingRef = useRef(false);
  /**
   * @description 실제 로딩 컴포넌트의 표시 여부를 제어하는 state.
   */
  const [isLoading, setIsLoading] = useState(false);
  /**
   * @description 여러 비동기 작업 그룹의 로딩 상태를 관리하는 배열.
   * 각 요소는 { [id: string]: boolean } 형태의 객체로, id는 작업 식별자, boolean 값은 완료 여부(true: 완료, false: 진행 중)를 나타냅니다.
   * 예: [{ 'taskA': false }, { 'taskB': true }]
   */
  const [loadingTaskGroup, setLoadingTaskGroup] = useState<LoadingTaskGroup>({});
  /**
   * @description 컴포넌트의 첫 렌더링 여부를 판별하는 ref.
   * 특정 useEffect 훅들이 마운트 시점이 아닌, 의존성 변경 시에만 동작하도록 제어하는 데 사용됩니다.
   */
  const isFirstRender = useRef(true);


  // 컴포넌트 언마운트 시 모든 타이머 클리어
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = []; // 참조 초기화
    };
  }, []);

  /**
   * @description `loadingTaskGroup` 상태가 변경될 때마다 실행됩니다.
   * 모든 작업 그룹(`loadingTaskGroup` 내의 모든 항목)이 완료되었는지 확인하고,
   * 모두 완료되었다면 전체 로딩 UI를 숨깁니다.
   *
   * @detail `setLoadingTaskGroup`은 비동기적으로 동작하지만, 이 `useEffect`는 상태 업데이트가 완료된 후에 실행됩니다.
   *         따라서 작업 완료 여부를 체크하는 도중에 새로운 작업이 추가되어 데이터 정합성이 깨지는 문제는 발생하지 않습니다.
   *         다만, 새로운 작업이 추가되었을 때 이미 진행 중이던 "모든 작업 완료 확인" 로직이 중단되지 않으므로,
   *         매우 짧은 시간 동안 로딩 UI가 불필요하게 사라졌다가 다시 나타나는 깜빡임이 발생할 가능성은 있습니다.
   */
  useEffect(() => {
    if (isFirstRender.current) return;
    const tasks = Object.values(loadingTaskGroup);
    // 작업 그룹이 비어있지 않고, 모든 작업이 완료되었을 때만 로딩 숨김 처리
    if (tasks.length > 0 && tasks.every(isDone => isDone)) {
      hideLoading();
    }
    // console.log({allDone}, loadingTaskGroup);
  }, [loadingTaskGroup]);

  /**
   * @description `isLoading` 상태가 `false`로 변경될 때 (즉, 전체 로딩 UI가 숨겨질 때) 실행됩니다.
   * 모든 작업 그룹의 상태(`loadingTaskGroup`)를 초기화합니다.
   * 이는 다음 로딩 시퀀스를 위해 이전 작업들의 상태가 남아있지 않도록 합니다.
   */
  useEffect(() => {
    if (isFirstRender.current) return;
    if (!isLoading) {
      loadingRef.current = false; // 전체 로딩 UI 비활성화 상태로 업데이트
      setLoadingTaskGroup({});
    }
  }, [isLoading]);

  /**
   * @function showLoading
   * @description 전체 로딩 UI (dimmed 등)를 활성화합니다.
   * 이미 로딩 UI가 활성화된 상태(`loadingRef.current === true`)에서 중복 호출될 경우,
   * 경고를 출력하고 추가적인 로딩 상태 변경을 실행하지 않습니다.
   */
  const showLoading = useCallback(() => {
    if (loadingRef.current) {
      // console.warn('[showLoading] 로딩 UI가 이미 활성화되어 있습니다.');
      return;
    }
    loadingRef.current = true;
    setIsLoading(true);
  }, []);

  /**
   * @function hideLoading
   * @description 전체 로딩 UI를 비활성화하고 화면에서 제거합니다.
   * @param {number} [timeout=0] - 로딩 UI를 숨기기 전 지연 시간(ms).
   */
  const hideLoading = useCallback((timeout = 0) => {
    const timerId = setTimeout(() => {
      isFirstRender.current = false;
      setIsLoading(false);
    }, timeout);
    timersRef.current.push(timerId);
  }, []);


  const clearLoading = useCallback(() => {
    const timerId = setTimeout(() => {
      setLoadingTaskGroup(prevTasks => {
        const clearedTasks: LoadingTaskGroup = {};
        for (const key in prevTasks) {
          clearedTasks[key] = true; // 모든 작업을 '완료' 상태로 변경
        }
        return clearedTasks;
      });
    }, 300);
    timersRef.current.push(timerId);
  }, []);

  /**
   * @function showGroupLoading
   * @description 특정 작업(ID)에 대한 로딩을 시작하고, 해당 작업을 `loadingTaskGroup`에 추가합니다.
   * 이미 동일한 ID의 작업이 존재하면 중복 추가하지 않습니다.
   * 이 함수 호출 시 전체 로딩 UI도 함께 표시됩니다.
   *
   * @param {string} id - 로딩을 시작할 작업의 고유 식별자.
   *
   * @example
   * showGroupLoading('userDataFetch');
   */
  const showGroupLoading = useCallback((id: string) => { // useCallback으로 감싸서 의존성 변경 시에만 함수 재생성
    if (!id) {
      console.warn('[showGroupLoading] ID가 제공되지 않았습니다.');
      return;
    }
    // console.log('showGroupLoading', id);
    setLoadingTaskGroup(prevTasks => ({
      ...prevTasks,
      [id]: false, // 신규 또는 기존 작업을 '진행 중'으로 설정
    }));

    // 현재 프로젝트 공통으로 설정된 request의 timeout이 3분 20초로 너무 길다.
    // 특정 상황(예: axios interceptor 설정 누락)으로 인해 hideGroupLoading이 호출되지 않아
    // 로딩 바가 계속 표시되는 것을 방지하기 위한 안전장치로 고려될 수 있습니다.
    // 필요시, 이 로직을 활성화하거나 보다 정교한 에러 처리 메커니즘을 구현할 수 있습니다.
    // setTimeout(() => {
    //   console.warn(`[showGroupLoading] 작업 '${id}'에 대한 자동 완료 처리 (30초 타임아웃)`);
    //   setLoadingTaskGroup(state =>
    //     state.map(item => Object.keys(item)[0] === id ? { ...item, [id]: true } : item)
    //   );
    // }, 30000);

    showLoading();
  }, [showLoading]);

  /**
   * @function hideGroupLoading
   * @description 특정 작업(ID)을 완료 상태로 변경합니다.
   * 이 함수 자체는 전체 로딩 UI를 직접 숨기지 않습니다.
   * `loadingTaskGroup`의 변경을 감지하는 `useEffect` 훅에 의해 모든 작업이 완료되었을 때 전체 로딩 UI가 숨겨집니다.
   *
   * @param {string} id - 완료 처리할 작업의 고유 식별자.
   * @param {number} [timeout=300] - 상태 업데이트 전 지연 시간(ms). UI 변경이 반영될 시간을 주기 위함.
   *
   * @example
   * hideGroupLoading('userDataFetch');
   */
  const hideGroupLoading = useCallback((id: string, timeout = 300) => {
    if (!id) {
      console.warn('[hideGroupLoading] ID가 제공되지 않았습니다.');
      return;
    }
    // console.log('hideGroupLoading', id);

    const timerId = setTimeout(() => {
      setLoadingTaskGroup(prevTasks => ({
        ...prevTasks,
        [id]: true, // 해당 작업을 '완료' 상태로 변경
      }));
    }, timeout);

    // 타이머 ID 저장
    timersRef.current.push(timerId);

  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      showLoading,
      hideLoading,
      showGroupLoading,
      hideGroupLoading,
      clearLoading,
    }),
    [isLoading, showLoading, hideLoading, showGroupLoading, hideGroupLoading, clearLoading]
  );

  return (
    <SingletonLoadingContext.Provider value={value}>
      {children}
      {/*
        만약 이 Provider 내에서 직접 로딩 UI를 렌더링하려면 주석을 해제하고 사용합니다.
        예: {isLoading && <Loading type="dimmed" />}
      */}
    </SingletonLoadingContext.Provider>
  );
};

/**
 * const { isLoading, showGroupLoading, hideGroupLoading } = useSingletonLoading();
 * const LOADING_GRP_PREFIX = 'my-task';
 * showGroupLoading(`${LOADING_GRP_PREFIX}-loadCarDetail`);
 * hideGroupLoading(`${LOADING_GRP_PREFIX}-loadCarDetail`);
 */
export const useSingletonLoading = () => {
  const context = useContext(SingletonLoadingContext);
  if (context === undefined) {
    throw new Error('useSingletonLoading must be used within a SingletonLoadingProvider');
  }
  return context;
};
