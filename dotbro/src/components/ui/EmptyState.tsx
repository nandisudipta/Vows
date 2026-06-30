import React from 'react';
import '../../styles/components/empty-state.css';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="dotbro-empty-state">
      <div className="dotbro-empty-state__icon">{icon}</div>
      <h3 className="dotbro-empty-state__title">{title}</h3>
      <p className="dotbro-empty-state__description">{description}</p>
      {action && <div className="dotbro-empty-state__action">{action}</div>}
    </div>
  );
};
