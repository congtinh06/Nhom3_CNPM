import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helperText,
  required = false,
  optional = false,
  children,
}) => {
  return (
    <div className={`adm-form-field ${error ? 'adm-form-field-error' : ''}`}>
      <label htmlFor={htmlFor} className="adm-form-label">
        {label}
        {required && <span className="adm-required-mark" aria-hidden="true">*</span>}
      </label>
      {optional && !required && (
        <span className="adm-optional-mark">Không bắt buộc</span>
      )}
      <div className="adm-form-control-wrap">
        {children}
      </div>
      {error ? (
        <span id={`${htmlFor}-error`} className="adm-field-error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${htmlFor}-helper`} className="adm-field-helper">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
