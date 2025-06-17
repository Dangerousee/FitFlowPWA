// components/CalendarButton.tsx
import React from 'react';

type CalendarButtonProps = {
  onClick?: () => void;
  isCustomDateType?: boolean;
  className?: string;
};

const CalendarButton: React.FC<CalendarButtonProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      name="button-calendar-1"
      onClick={onClick}
      className={`absolute right-0 pr-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 ${className}`}
      aria-label="Open date picker modal"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6 text-gray-700"
      >
        <path d="M5 4v4" />
        <path d="M15 4v4" />
        <rect x="3" y="8" width="14" height="12" rx="2" />
        <path d="M4 11h11" />
      </svg>
    </button>
  );
};

export default CalendarButton;