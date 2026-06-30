import React from 'react';
import '../../styles/components/textarea.css';

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onEnterPress?: () => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
  onEnterPress,
  onKeyDown,
  ...props
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) {
        onEnterPress();
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return <textarea className="dotbro-textarea" onKeyDown={handleKeyDown} {...props} />;
};
