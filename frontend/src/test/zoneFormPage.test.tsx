import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { ZoneFormPage } from '../admin/pages/ZoneFormPage';
import { zoneApi } from '../admin/api/zoneApi';
import { AdminZoneDetail } from '../admin/types/zone';

vi.mock('../admin/api/zoneApi', () => ({
  zoneApi: {
    getAdminZones: vi.fn(),
    getAdminZoneDetail: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
  },
}));

const detail: AdminZoneDetail = {
  id: 1,
  code: 'Q1_HISTORIC',
  name: 'Trung tâm Quận 1',
  description: 'Khu vực trung tâm',
  centerLat: 10.7769,
  centerLng: 106.7009,
  radiusMeters: 1200,
  isActive: true,
  poiCount: 0,
  routeCount: 0,
  version: 2,
};

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/quan-tri/khu-vuc/moi']}>
      <Routes>
        <Route path="/quan-tri/khu-vuc" element={<div>Danh sách khu vực</div>} />
        <Route path="/quan-tri/khu-vuc/moi" element={<ZoneFormPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderEdit = (id = 1) =>
  render(
    <MemoryRouter initialEntries={[`/quan-tri/khu-vuc/${id}`]}>
      <Routes>
        <Route path="/quan-tri/khu-vuc" element={<div>Danh sách khu vực</div>} />
        <Route path="/quan-tri/khu-vuc/:id" element={<ZoneFormPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ZoneFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chế độ tạo mới: hiển thị lỗi bắt buộc khi bỏ trống các trường', async () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /tạo khu vực/i }));

    expect(await screen.findByText('Mã khu vực không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Tên khu vực không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Vĩ độ tâm không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Kinh độ tâm không được để trống')).toBeInTheDocument();
    expect(zoneApi.createZone).not.toHaveBeenCalled();
  });

  it('chế độ tạo mới: gửi mã viết hoa và chuyển về danh sách khi thành công', async () => {
    vi.mocked(zoneApi.createZone).mockResolvedValue({
      id: 10,
      code: 'Q1_TEST',
      name: 'Khu thử',
      centerLat: 10.77,
      centerLng: 106.7,
      radiusMeters: 1000,
    });

    renderCreate();

    fireEvent.change(screen.getByLabelText(/mã khu vực/i), { target: { value: 'q1_test' } });
    fireEvent.change(screen.getByLabelText(/tên khu vực/i), { target: { value: 'Khu thử' } });
    fireEvent.change(screen.getByLabelText(/vĩ độ tâm/i), { target: { value: '10.77' } });
    fireEvent.change(screen.getByLabelText(/kinh độ tâm/i), { target: { value: '106.7' } });

    fireEvent.click(screen.getByRole('button', { name: /tạo khu vực/i }));

    await waitFor(() => {
      expect(zoneApi.createZone).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'Q1_TEST', name: 'Khu thử', radiusMeters: 1000 })
      );
    });

    expect(await screen.findByText('Danh sách khu vực')).toBeInTheDocument();
  });

  it('chế độ chỉnh sửa: nạp dữ liệu khu vực và khóa mã', async () => {
    vi.mocked(zoneApi.getAdminZoneDetail).mockResolvedValue(detail);
    renderEdit();

    await waitFor(() => {
      expect(zoneApi.getAdminZoneDetail).toHaveBeenCalledWith(1);
    });

    const codeInput = (await screen.findByLabelText(/mã khu vực/i)) as HTMLInputElement;
    expect(codeInput.value).toBe('Q1_HISTORIC');
    expect(codeInput).toBeDisabled();
    expect((screen.getByLabelText(/tên khu vực/i) as HTMLInputElement).value).toBe(
      'Trung tâm Quận 1'
    );
  });

  it('chặn phía client khi ngừng hoạt động khu vực còn điểm thuyết minh', async () => {
    vi.mocked(zoneApi.getAdminZoneDetail).mockResolvedValue({ ...detail, poiCount: 5 });
    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/mã khu vực/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/đang hoạt động/i));
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    expect(
      await screen.findByText(/không thể ngừng hoạt động khu vực khi vẫn còn 5 điểm/i)
    ).toBeInTheDocument();
    expect(zoneApi.updateZone).not.toHaveBeenCalled();
  });

  it('hiển thị lỗi trường từ máy chủ khi lưu thất bại', async () => {
    vi.mocked(zoneApi.getAdminZoneDetail).mockResolvedValue(detail);
    const axiosErr = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      data: { message: 'Validation failed', details: { name: 'name is required' } },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(zoneApi.updateZone).mockRejectedValue(axiosErr);

    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/mã khu vực/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tên khu vực/i), { target: { value: 'Đổi tên' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    expect(await screen.findByText('Tên khu vực không được để trống')).toBeInTheDocument();
  });

  it('hiển thị hộp thoại xác nhận khi rời trang với thay đổi chưa lưu', async () => {
    renderCreate();

    fireEvent.change(screen.getByLabelText(/tên khu vực/i), { target: { value: 'Khu mới' } });
    fireEvent.click(screen.getByRole('button', { name: /quay lại danh sách khu vực/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/chỉnh sửa chưa được lưu/i)).toBeInTheDocument();
  });

  it('hiển thị hộp thoại xung đột khi cập nhật trả về 409 và tải lại khi xác nhận', async () => {
    vi.mocked(zoneApi.getAdminZoneDetail).mockResolvedValue(detail);
    const conflictErr = new AxiosError('Conflict', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      data: { message: 'Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(zoneApi.updateZone).mockRejectedValue(conflictErr);

    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/mã khu vực/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tên khu vực/i), { target: { value: 'Đổi tên' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    expect(
      await screen.findByText(/Nội dung đã được người khác cập nhật/i)
    ).toBeInTheDocument();
    expect(zoneApi.updateZone).toHaveBeenCalledWith(1, expect.objectContaining({ version: 2 }));

    fireEvent.click(screen.getByRole('button', { name: /tải lại/i }));
    await waitFor(() => {
      expect(zoneApi.getAdminZoneDetail).toHaveBeenCalledTimes(2);
    });
  });
});
