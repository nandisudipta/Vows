import React, { useEffect } from 'react';
import { X } from './Icons';
import '../../styles/components/modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dotbro-modal-overlay" onClick={onClose}>
      <div className="dotbro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dotbro-modal__header">
          <h3 className="dotbro-modal__title">{title}</h3>
          <button className="dotbro-modal__close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="dotbro-modal__content">{children}</div>
        {actions && <div className="dotbro-modal__actions">{actions}</div>}
      </div>
    </div>
  );
};
