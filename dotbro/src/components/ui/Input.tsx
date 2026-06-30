import React from 'react';
import '../../styles/components/input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  className = '',
  id,
  ...props
}) => {
  const wrapperClass = [
    'dotbro-input-wrapper',
    icon ? 'dotbro-input-wrapper--with-icon' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`dotbro-input-group ${className}`}>
      {label && (
        <label htmlFor={id} className="dotbro-input-label">
          {label}
        </label>
      )}
      <div className={wrapperClass}>
        {icon && <span className="dotbro-input-icon">{icon}</span>}
        <input id={id} className="dotbro-input" {...props} />
      </div>
    </div>
  );
};
