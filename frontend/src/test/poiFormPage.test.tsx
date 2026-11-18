import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PoiFormPage } from '../admin/pages/PoiFormPage';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiDetail, PoiDetail } from '../admin/types/poi';
import { AxiosError, AxiosHeaders } from 'axios';

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getZones: vi.fn(),
    getCategories: vi.fn(),
    getRoutes: vi.fn(),
    getAdminPoiDetail: vi.fn(),
    createPoi: vi.fn(),
    updatePoi: vi.fn(),
  },
}));

vi.mock('../admin/components/PoiAudioStatusPanel', () => ({
  PoiAudioStatusPanel: () => null,
}));

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => null,
}));

const mockRoutes = [{ id: 7, zoneId: 1, name: 'Tuyến trung tâm' }];

const mockDetail: AdminPoiDetail = {
  id: 10,
  code: 'BEN_THANH',
  qrToken: 'qr-ben-thanh',
  name: 'Chợ Bến Thành',
  latitude: 10.7725,
  longitude: 106.698,
  triggerRadiusMeters: 50,
  zoneId: 1,
  zoneCode: 'Q1',
  categoryId: 2,
  categoryCode: 'HISTORY',
  categoryNameVi: 'Di tích',
  routeId: null,
  routeName: null,
  stopOrder: null,
  status: 'ACTIVE',
  version: 4,
  publishStatus: 'PUBLISHED',
  publishAttempts: 0,
  overallStatus: 'NEEDS_ATTENTION',
  attentionReasons: ['Đang bảo trì'],
  languageSummary: { total: 4, ready: 1, pending: 2, failed: 1 },
  languages: [
    { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'READY' },
    { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'PENDING' },
    { languageCode: 'ja', languageName: 'Tiếng Nhật', audioStatus: 'FAILED_TTS' },
    { languageCode: 'ko', languageName: 'Tiếng Hàn', audioStatus: 'FAILED_TTS' },
  ],
  translations: {
    vi: {
      languageCode: 'vi',
      title: 'Tiêu đề gốc',
      summary: 'Tóm tắt gốc',
      description: 'Mô tả gốc',
      audioStatus: 'READY',
    },
    en: {
      languageCode: 'en',
      title: 'Original title',
      summary: 'Original summary',
      description: 'Original description',
      audioStatus: 'PENDING',
    },
  },
};

const mockCreated: PoiDetail = {
  id: 10,
  code: 'BEN_THANH',
  qrToken: 'qr-ben-thanh',
  name: 'Chợ Bến Thành',
  latitude: 10.7725,
  longitude: 106.698,
  triggerRadiusMeters: 50,
  zoneId: 1,
  zoneCode: 'Q1',
  categoryCode: 'HISTORY',
  languageCode: 'vi',
  title: 'Chợ Bến Thành',
  summary: 'Khu chợ biểu tượng',
  description: 'Chi tiết',
  audioStatus: 'PENDING',
};

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="list-location-state">{JSON.stringify(location.state ?? null)}</div>;
};

describe('PoiFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(poiApi.getZones).mockResolvedValue([{ id: 1, code: 'Q1', name: 'Quận 1' }]);
    vi.mocked(poiApi.getCategories).mockResolvedValue([
      { id: 2, code: 'HISTORY', nameVi: 'Di tích' },
    ]);
    vi.mocked(poiApi.getRoutes).mockResolvedValue(mockRoutes);
  });

  const renderCreate = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/moi']}>
        <Routes>
          <Route path="/quan-tri/diem-thuyet-minh/moi" element={<PoiFormPage />} />
          <Route path="/quan-tri/diem-thuyet-minh/:id" element={<PoiFormPage />} />
          <Route
            path="/quan-tri/diem-thuyet-minh"
            element={
              <div data-testid="poi-list-page">
                Danh sách điểm thuyết minh
                <LocationProbe />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

  const renderEdit = (id = '10') =>
    render(
      <MemoryRouter initialEntries={[`/quan-tri/diem-thuyet-minh/${id}`]}>
        <Routes>
          <Route path="/quan-tri/diem-thuyet-minh/:id" element={<PoiFormPage />} />
          <Route
            path="/quan-tri/diem-thuyet-minh"
            element={<div data-testid="poi-list-page">Danh sách điểm thuyết minh</div>}
          />
        </Routes>
      </MemoryRouter>
    );

  const fillRequired = () => {
    fireEvent.change(screen.getByLabelText(/khu vực/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/danh mục/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/mã điểm/i), { target: { value: 'BEN_THANH' } });
    fireEvent.change(screen.getByLabelText(/mã qr/i), { target: { value: 'qr-ben-thanh' } });
    fireEvent.change(screen.getByLabelText(/tên điểm/i), { target: { value: 'Chợ Bến Thành' } });
    fireEvent.change(screen.getByLabelText(/vĩ độ/i), { target: { value: '10.7725' } });
    fireEvent.change(screen.getByLabelText(/kinh độ/i), { target: { value: '106.698' } });
    fireEvent.change(screen.getByLabelText(/tiêu đề/i), { target: { value: 'Chợ Bến Thành' } });
    fireEvent.change(screen.getByLabelText(/tóm tắt/i), { target: { value: 'Khu chợ biểu tượng' } });
    fireEvent.change(screen.getByLabelText(/mô tả chi tiết/i), { target: { value: 'Chi tiết' } });
  };

  const awaitFormLoaded = async () => {
    await screen.findByRole('button', { name: /tạo điểm thuyết minh/i });
  };

  const awaitEditLoaded = async () => {
    await screen.findByRole('button', { name: /lưu thay đổi/i });
  };

  it('chặn gửi khi thiếu các trường bắt buộc và hiển thị lỗi tiếng Việt', async () => {
    renderCreate();
    await awaitFormLoaded();

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(screen.getByText('Khu vực không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Tên điểm không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Vĩ độ không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Tiêu đề không được để trống')).toBeInTheDocument();
    });

    expect(poiApi.createPoi).not.toHaveBeenCalled();
  });

  it('ánh xạ lỗi xác thực từ backend sang trường tương ứng bằng tiếng Việt', async () => {
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    const axios400 = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Validation Failed', details: { name: 'name is required' } },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );
    vi.mocked(poiApi.createPoi).mockRejectedValueOnce(axios400);

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(screen.getByText('Tên điểm không được để trống')).toBeInTheDocument();
    });
  });

  it('tạo mới thành công và điều hướng về danh sách', async () => {
    vi.mocked(poiApi.createPoi).mockResolvedValueOnce(mockCreated);
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(poiApi.createPoi).toHaveBeenCalledTimes(1);
      expect(poiApi.createPoi).toHaveBeenCalledWith(
        expect.objectContaining({
          zoneId: 1,
          categoryId: 2,
          code: 'BEN_THANH',
          name: 'Chợ Bến Thành',
          latitude: 10.7725,
          longitude: 106.698,
        })
      );
      expect(screen.getByTestId('poi-list-page')).toBeInTheDocument();
    });
  });

  it('vô hiệu hóa nút và ngăn chặn gửi đúp khi đang xử lý', async () => {
    let resolveCreate: (value: PoiDetail) => void;
    const pending = new Promise<PoiDetail>((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(poiApi.createPoi).mockReturnValueOnce(pending);

    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /đang tạo mới.../i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /đang tạo mới.../i }));
    expect(poiApi.createPoi).toHaveBeenCalledTimes(1);

    resolveCreate!(mockCreated);

    await waitFor(() => {
      expect(screen.getByTestId('poi-list-page')).toBeInTheDocument();
    });
  });

  it('chế độ chỉnh sửa nạp chi tiết admin với toàn bộ bản dịch trong một lần gọi', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    await waitFor(() => {
      expect(poiApi.getAdminPoiDetail).toHaveBeenCalledWith(10);
      expect(screen.getByLabelText(/tên điểm/i)).toHaveValue('Chợ Bến Thành');
      expect(screen.getByLabelText(/tiêu đề/i)).toHaveValue('Tiêu đề gốc');
      expect(screen.getByLabelText(/tóm tắt/i)).toHaveValue('Tóm tắt gốc');
      expect(screen.getByLabelText(/danh mục/i)).toHaveValue('2');
    });
  });

  it('hiển thị trạng thái tổng, lý do cần chú ý và tóm tắt ngôn ngữ ở chế độ chỉnh sửa', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    expect(await screen.findByText('Cần xử lý')).toBeInTheDocument();
    expect(screen.getByText('Đang bảo trì')).toBeInTheDocument();
    expect(screen.getByText('1/4 sẵn sàng')).toBeInTheDocument();
  });

  it('chuyển tab hiển thị bản dịch ngôn ngữ khác và mã QR', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.click(screen.getByRole('tab', { name: /nội dung đa ngôn ngữ/i }));
    expect(await screen.findByText('Bản dịch ngôn ngữ khác')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /phát hành & qr/i }));
    expect(await screen.findByText('Mã QR của điểm')).toBeInTheDocument();
    expect(screen.getByText('qr-ben-thanh')).toBeInTheDocument();
  });

  it('cho phép chỉnh sửa tuyến và thứ tự điểm dừng rồi gửi kèm version', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    vi.mocked(poiApi.updatePoi).mockResolvedValueOnce(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.change(screen.getByLabelText(/tuyến \(không bắt buộc\)/i), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText(/thứ tự điểm dừng/i), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    await waitFor(() => {
      expect(poiApi.updatePoi).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ routeId: 7, stopOrder: 3, version: 4 })
      );
      expect(screen.getByTestId('poi-list-page')).toBeInTheDocument();
    });
  });

  it('chặn gửi khi chỉ nhập tuyến mà thiếu thứ tự điểm dừng', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.change(screen.getByLabelText(/tuyến \(không bắt buộc\)/i), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Vui lòng nhập thứ tự điểm dừng cho tuyến')
      ).toBeInTheDocument();
    });
    expect(poiApi.updatePoi).not.toHaveBeenCalled();
  });

  it('xung đột 409 giữ nguyên chỉnh sửa và cho phép tải lại dữ liệu mới', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    const axios409 = new AxiosError(
      'Request failed with status code 409',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );
    vi.mocked(poiApi.updatePoi).mockRejectedValueOnce(axios409);

    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.change(screen.getByLabelText(/tên điểm/i), {
      target: { value: 'Chợ Bến Thành mới' },
    });
    fireEvent.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    const dialog = await screen.findByRole('heading', {
      name: /nội dung đã được người khác cập nhật/i,
    });
    expect(dialog).toBeInTheDocument();
    // Chỉnh sửa của người dùng vẫn hiển thị cho tới khi họ chọn tải lại
    expect(screen.getByLabelText(/tên điểm/i)).toHaveValue('Chợ Bến Thành mới');

    fireEvent.click(screen.getByRole('button', { name: /tải lại/i }));

    await waitFor(() => {
      expect(poiApi.getAdminPoiDetail).toHaveBeenCalledTimes(2);
      expect(screen.getByLabelText(/tên điểm/i)).toHaveValue('Chợ Bến Thành');
      expect(
        screen.queryByRole('heading', { name: /nội dung đã được người khác cập nhật/i })
      ).not.toBeInTheDocument();
    });
  });

  it('hiện hộp thoại xác nhận khi rời trang với biểu mẫu chưa lưu', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.change(screen.getByLabelText(/tên điểm/i), {
      target: { value: 'Chợ Bến Thành mới' },
    });
    fireEvent.click(screen.getByRole('button', { name: /quay lại danh sách điểm thuyết minh/i }));

    const dialog = await screen.findByRole('heading', { name: /rời khỏi trang khi chưa lưu/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ở lại tiếp tục sửa/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /rời khỏi trang khi chưa lưu/i })
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /quay lại danh sách điểm thuyết minh/i }));
    fireEvent.click(await screen.findByRole('button', { name: /rời khỏi trang/i }));

    await waitFor(() => {
      expect(screen.getByTestId('poi-list-page')).toBeInTheDocument();
    });
  });

  it('mô tả trang sửa dùng tên điểm thay cho mã số', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    expect(
      screen.getByText('Cập nhật thông tin và nội dung thuyết minh của Chợ Bến Thành.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/điểm #10/)).not.toBeInTheDocument();
  });

  it('thanh lưu dính hiện Có thay đổi chưa lưu khi biểu mẫu bị sửa', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    expect(screen.queryByText('Có thay đổi chưa lưu')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/tên điểm/i), {
      target: { value: 'Chợ Bến Thành mới' },
    });

    expect(screen.getByText('Có thay đổi chưa lưu')).toBeInTheDocument();
  });

  it('gợi ý bán kính kèm mặc định và giới hạn tối đa', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue({
      ...mockDetail,
      triggerRadiusMeters: 50,
    });
    renderEdit('10');
    await awaitEditLoaded();

    expect(screen.queryByText(/Khác mặc định/)).not.toBeInTheDocument();
    expect(screen.getByText('Mặc định 50 m; tối đa 5000 m')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/bán kính kích hoạt/i), {
      target: { value: '80' },
    });

    expect(screen.getByText('Khác mặc định (50 m); tối đa 5000 m')).toBeInTheDocument();
    expect(screen.getByLabelText(/bán kính kích hoạt/i)).toHaveAttribute('max', '5000');
    expect(screen.getByLabelText(/bán kính kích hoạt/i)).toHaveAttribute('step', '1');
  });

  it('hiển thị quy ước bắt buộc và đánh dấu các trường không bắt buộc', async () => {
    renderCreate();
    await awaitFormLoaded();

    expect(screen.getByText(/Các trường có dấu \*/)).toBeInTheDocument();
    expect(screen.getAllByText('Không bắt buộc').length).toBeGreaterThanOrEqual(5);
  });

  it('gửi bán kính kích hoạt đã nhập và chặn giá trị ngoài khoảng cho phép', async () => {
    vi.mocked(poiApi.createPoi).mockResolvedValueOnce(mockCreated);
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.change(screen.getByLabelText(/bán kính kích hoạt/i), {
      target: { value: '120' },
    });
    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(poiApi.createPoi).toHaveBeenCalledWith(
        expect.objectContaining({ triggerRadiusMeters: 120 })
      );
      expect(screen.getByTestId('poi-list-page')).toBeInTheDocument();
    });
  });

  it('chặn bán kính kích hoạt vượt quá 5000 hoặc không phải số nguyên', async () => {
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.change(screen.getByLabelText(/bán kính kích hoạt/i), {
      target: { value: '5001' },
    });
    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    expect(
      await screen.findByText('Bán kính kích hoạt phải là số nguyên từ 1 đến 5000 mét')
    ).toBeInTheDocument();
    expect(poiApi.createPoi).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/bán kính kích hoạt/i), {
      target: { value: '50.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    expect(
      await screen.findByText('Bán kính kích hoạt phải là số nguyên từ 1 đến 5000 mét')
    ).toBeInTheDocument();
    expect(poiApi.createPoi).not.toHaveBeenCalled();
  });

  it('chặn mã điểm có ký tự không hợp lệ trước khi gửi', async () => {
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.change(screen.getByLabelText(/mã điểm/i), { target: { value: 'BEN THANH' } });
    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    expect(
      await screen.findByText('Mã điểm chỉ được chứa chữ, số, dấu gạch dưới hoặc dấu gạch ngang')
    ).toBeInTheDocument();
    expect(poiApi.createPoi).not.toHaveBeenCalled();
  });

  it('hiện đúng lỗi từ backend đã được chuẩn hóa thay vì lỗi không xác định', async () => {
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    vi.mocked(poiApi.createPoi).mockRejectedValueOnce({
      status: 400,
      message: 'Validation failed',
      details: { triggerRadiusMeters: 'triggerRadiusMeters must be <= 5000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    expect(await screen.findByText('Bán kính kích hoạt tối đa 5000 mét')).toBeInTheDocument();
    expect(screen.queryByText(/Đã xảy ra lỗi không xác định/)).not.toBeInTheDocument();
  });

  it('điều hướng kèm thông tin POI vừa tạo để danh sách hiển thị', async () => {
    vi.mocked(poiApi.createPoi).mockResolvedValueOnce(mockCreated);
    renderCreate();
    await awaitFormLoaded();
    fillRequired();

    fireEvent.click(screen.getByRole('button', { name: /tạo điểm thuyết minh/i }));

    await waitFor(() => {
      expect(screen.getByTestId('list-location-state')).toHaveTextContent('"createdPoiId":10');
      expect(screen.getByTestId('list-location-state')).toHaveTextContent(
        '"createdPoiName":"Chợ Bến Thành"'
      );
    });
  });

  it('chỉ hiện đếm ký tự khi đã dùng hơn 80% giới hạn', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    fireEvent.change(screen.getByLabelText(/tên điểm/i), {
      target: { value: 'A'.repeat(205) },
    });

    expect(screen.getByText('205/255 ký tự')).toBeInTheDocument();
  });

  it('khối ảnh đại diện có xem trước và nút tải ảnh lên dạng sắp có', async () => {
    vi.mocked(poiApi.getAdminPoiDetail).mockResolvedValue(mockDetail);
    renderEdit('10');
    await awaitEditLoaded();

    expect(screen.getByText('Chưa có ảnh')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải ảnh lên: sắp có' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/ảnh đại diện/i), {
      target: { value: '/img/pois/ben-thanh.jpg' },
    });

    expect(
      screen.getByAltText('Ảnh đại diện của Chợ Bến Thành')
    ).toBeInTheDocument();
  });
});
