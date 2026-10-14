import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../admin/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('không render khi isOpen = false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Xóa địa điểm"
        message="Hành động này không thể hoàn tác."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('render đầy đủ nội dung, thuộc tính trợ năng và kích hoạt onConfirm', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Xóa bản ghi"
        message="Bạn có chắc chắn muốn xóa bản ghi này?"
        confirmText="Xóa vĩnh viễn"
        cancelText="Bỏ qua"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Xóa bản ghi')).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn xóa bản ghi này?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Xóa vĩnh viễn' });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleCancel).not.toHaveBeenCalled();
  });

  it('gọi onCancel khi nhấn nút Hủy', () => {
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Xác nhận thao tác"
        message="Bạn có muốn hủy không?"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('gọi onCancel khi nhấn phím Escape', () => {
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Xác nhận phím tắt"
        message="Nhấn Escape để đóng."
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
