import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Đặt focus an toàn mặc định vào nút Hủy
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="adm-dialog-overlay" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="adm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adm-dialog-title"
        aria-describedby="adm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="adm-dialog-title" className="adm-dialog-title">
          {title}
        </h3>
        <p id="adm-dialog-desc" className="adm-dialog-message">
          {message}
        </p>

        <div className="adm-dialog-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`adm-btn ${variant === 'danger' ? 'adm-btn-danger' : 'adm-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
