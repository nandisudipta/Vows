import React from 'react';
import '../../styles/components/spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return <div className={`dotbro-spinner dotbro-spinner--${size} ${className}`} />;
};
