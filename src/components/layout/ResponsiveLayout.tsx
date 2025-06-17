// src/components/layout/layout.tsx
import React from 'react';
import styles from './ResponsiveLayout.module.css'; // CSS Module import

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string; // 외부에서 추가적인 클래스를 받을 수 있도록
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>{children}</div>
  );
};

export default ResponsiveLayout;
