import React, { useState, forwardRef, ReactNode } from 'react';
import styles from '@components/ui/text-fields/TextField.module.css'; // CSS 모듈 import
import LoadingCircle from '@components/ui/LoadingCircle';
import ClearButton from '@components/ui/buttons/ClearButton';


export enum TextFieldType {
  Text = 'Text',
  Password = 'Password'
}

export enum Status {
  Empty = 'Empty',
  Filled = 'Filled',
}

export enum State {
  Default = 'Default',
  Active = 'Active',
  Disabled = 'Disabled',
  Error = 'Error',
}

export interface TextFieldsProps {
  status: Status;
  state: State;
  id: string;
  type?: TextFieldType;
  value: string;
  label?: string;
  placeholder?: string;
  // onEventHandlers?: Record<string, React.ChangeEvent<HTMLInputElement>>;
  onEventHandlers?: Record<string, any>;
  useClearButton?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  showPassword?: boolean;
  onClearButtonClick?: () => void;
  icon?: ReactNode, // 예: onBeforeChange의 결과에따라 셋팅, 클릭이벤트는 제공하는 컴포넌트에서 직접 제어, Text버튼을 넣어도 된다
  loading?: boolean;
  error?: string;
}

// 디버깅 용
const defaultHandleKeyDown = (event) => {
  switch (event.key) {
    case 'Enter':
      console.log('Enter key pressed!');
      break;
    case ' ':
      console.log('Spacebar pressed');
      break;
    case 'Backspace':
      console.log('Backspace key pressed!');
      break;
    case 'ArrowUp':
      console.log('Arrow Up key pressed!');
      break;
    case 'ArrowDown':
      console.log('Arrow Down key pressed!');
      break;
    case 'ArrowLeft':
      console.log('Arrow Left key pressed!');
      break;
    case 'ArrowRight':
      console.log('Arrow Right key pressed!');
      break;
    default:
      break;
  }
};

// 전략 1: 숫자만 입력 허용 (최대 5자리)
export const handleNumericBeforeChange = (newValue) => {
  if (newValue === '') return true; // 비우는 것은 허용
  if (/^\d*$/.test(newValue) && newValue.length <= 5) {
    return true; // 숫자이고 5자리 이하이면 허용
  }
  return false; // 그 외 불허
};

// 전략 2: 최대 3자리까지만 입력 허용 (길이 초과 시 잘라내기)
export const handleMaxLengthBeforeChange = (newValue) => {
  if (newValue.length > 3) {
    return newValue.substring(0, 3); // 3자리로 잘라서 반환 (변환)
  }
  return true; // 3자리 이하면 그대로 허용
};

// 전략 3: 입력값을 항상 대문자로 변환
export const handleTransformToUpperBeforeChange = (newValue) => {
  return newValue.toUpperCase(); // 대문자로 변환하여 반환
};




// 예시: 비동기 작업 (API 호출 등)
export const handleValidateDateWithAsync = async (value, event) => {
  const res = await new Promise((resolve) =>
    setTimeout(() => resolve(value), 200)
  );
  return value;
};

const TextField = forwardRef<HTMLInputElement, TextFieldsProps>(
  (
    {
      status = Status.Empty,
      state = State.Disabled,
      id: idProp,
      type = TextFieldType.Text,
      value,
      label,
      placeholder,
      onEventHandlers,
      disabled,
      readOnly,
      useClearButton = true,
      showPassword: showPasswordProp = true,
      onClearButtonClick,
      icon,
      loading,
      error,
    },
    ref
  ) => {
    const finalId = idProp || label?.toLowerCase().replace(/\s+/g, '-') + "-input" || "text-field";

    const [showPassword, setShowPassword] = useState<boolean>(false);

    const { onChange, onBeforeChange, ...eventHandlers } = onEventHandlers ?? {};

    const internalHandleChange = async (event) => {
      const proposedValue = event.target.value;
      let finalValue = proposedValue;
      let allowUpdate = true;

      if (onBeforeChange) {
        const validationOutcome = await onBeforeChange(proposedValue, event);
        // onBeforeChange가 undefined를 반환하면, 기본적으로 변경을 허용
        allowUpdate = typeof validationOutcome === 'boolean' ? validationOutcome : true/** 기본 허용 */;
        finalValue = typeof validationOutcome === 'string' ? validationOutcome /** 변경된 값 */: finalValue/** 원래 값 */;
      }


      if (allowUpdate && onChange) {
        // 값이 onBeforeChange에 의해 변환되었다면,
        // 부모의 onChange 핸들러에 전달되는 이벤트 객체의 값을 업데이트해야 합니다.
        const syntheticEvent = {
          ...event,
          target: { ...event.target, value: finalValue ?? proposedValue },
          currentTarget: { ...event.currentTarget, value: finalValue ?? proposedValue },
        };
        // 이벤트 객체가 비동기 흐름에서 재사용될 수 없도록 정리(disposed)되지 않도록해서
        // SyntheticEvent 객체를 풀에서 제거해서 값이 유지되도록 한다.
        // 아니면 onChange(event)로 원래 이벤틀르 보내도 event.target.value에 값이 없다.
        // React17부터는 event.persist(); 필요없다고 한다.
        // FIXME 때문에 항상 syntheticEvent를 보내도록 해야할듯
        onChange(syntheticEvent);
      }
      // allowUpdate가 false인 경우 (제어 컴포넌트):
      // 부모의 onChange가 호출되지 않으므로, 부모의 상태(value prop으로 연결된)가
      // 업데이트되지 않아 input 값은 이전 상태로 유지되거나 변경되지 않는다.
      // onChange만 셋팅하는 경우:
      // allowUpdate가 기본 true이므로 onChange를 셋팅하면 onBeforeChange와 관걔없이 업데이트 된다.
    };

    const handleClearButtonClick = () => onClearButtonClick?.();

    const renderButtons = () => {
      /** 로딩 스피너 */
      if (loading) {
        return (
          <div className={`${styles.buttonContainer}`}><LoadingCircle /></div>
        );
      }

      const showPasswordIcon = (type === TextFieldType.Password && showPasswordProp);

      return (
        <div className={`${styles.buttonContainer}`}>
          {/** TextField 특성상 clear 버튼은 노출 */}
          {useClearButton ? <ClearButton onClick={handleClearButtonClick} /> : null}
          {/** 비밀번호 타입 경우에 '비밀번호 보기' 버튼 제공 */}
          {showPasswordIcon && (
            <button
              type="button"
              name="button-password-1"
              className="elm-size-xxs"
              onClick={() => setShowPassword(!showPassword)}
              style={{ paddingTop: 1 }} /** clearButton과 상하 위치가 미묘하게 안맞는다 */
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          )}
          {/** 그 외, 달력 아이콘 등 */}
          {icon && <div className="elm-size-xxs">{icon}</div>}
        </div>
      );
    };

    return (
      <>
        <div className={`
          ${styles.container} pr-m pl-m elm-min-width
          ${label ? 'elm-height-xxl' : 'elm-height-xl'}          
          ${error ? 'border-error' : 'border-regular'}
          mb-xs
          `}>
          <div className={styles.inputRow}>
            {label && <label className={`${styles.label} font-size-xxs pt-xxs text-secondary`} htmlFor={finalId}>{label}</label>}
            <input
              className={`
                ${styles.inputField} 
                `
              }
              id={finalId}
              type={showPassword ? 'text' : type}
              placeholder={placeholder}
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              onChange={internalHandleChange}
              {...eventHandlers}
            />
          </div>
          {renderButtons()}
        </div>
        {error && <p className={`${styles.errorText} font-size-xxs pl-m`}>{error}</p>}
      </>
    );
  }
);
TextField.displayName = "TextField";
export default TextField;