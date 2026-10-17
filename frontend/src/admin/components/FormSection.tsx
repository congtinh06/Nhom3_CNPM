import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`adm-card adm-form-section ${className}`.trim()}>
      <h2 className="adm-card-title">{title}</h2>
      {description && <p className="adm-form-section-desc">{description}</p>}
      {children}
    </div>
  );
};
