// components/ClearButton.tsx
import React from 'react';

type ClearButtonProps = {
  onClick?: () => void;
  className?: string;
};

const ClearButton: React.FC<ClearButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      aria-label="내용 지우기"
      type="button"
      className={`${className} elm-size-xxs`}
      style={{
        padding: 0,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    </button>
  );
};

export default ClearButton;