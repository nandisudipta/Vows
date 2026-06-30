import React from 'react';
import '../../styles/components/button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  ...props
}) => {
  const classes = [
    'dotbro-btn',
    `dotbro-btn--${variant}`,
    `dotbro-btn--${size}`,
    fullWidth ? 'dotbro-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {icon && <span className="dotbro-btn__icon">{icon}</span>}
      {children}
    </button>
  );
};
