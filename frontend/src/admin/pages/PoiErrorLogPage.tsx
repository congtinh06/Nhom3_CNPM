import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminPoiListItem } from '../types/poi';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge, StatusBadgeVariant } from '../components/StatusBadge';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { isFailedLanguageStatus, resolveLanguageStatus } from '../utils/poiStatus';
import { formatDateTime } from '../utils/format';

// ============================================================================
// Trang "Nhật ký xử lý lỗi" — route /quan-tri/diem-thuyet-minh/nhat-ky-loi
// Chức năng: gom các lỗi của điểm thuyết minh thành từng dòng để theo dõi và
// phát hành lại. Nguồn dữ liệu: getAdminPois(overallStatus = NEEDS_ATTENTION) —
// mỗi điểm cần chú ý sẽ được tách thành các dòng lỗi theo ngôn ngữ và lỗi phát hành.
// ============================================================================

const PAGE_SIZE = 10;

// Một dòng trong nhật ký lỗi (1 ngôn ngữ lỗi, hoặc 1 lỗi phát hành của 1 điểm).
interface ErrorLogRow {
  key: string;
  poiId: number;
  poiName: string;
  kind: 'publish' | 'language';
  languageLabel: string;
  status: string;
  statusLabel: string;
  statusVariant: StatusBadgeVariant;
  reason: string;
  lastAttemptAt: string | null;
}

// Biến danh sách điểm cần chú ý thành các dòng lỗi chi tiết.
function buildErrorRows(pois: AdminPoiListItem[]): ErrorLogRow[] {
  const rows: ErrorLogRow[] = [];
  for (const poi of pois) {
    // (1) Lỗi phát hành (gửi sự kiện thất bại).
    if ((poi.publishStatus || '').toUpperCase() === 'FAILED') {
      rows.push({
        key: `${poi.id}-publish`,
        poiId: poi.id,
        poiName: poi.name,
        kind: 'publish',
        languageLabel: '-',
        status: 'FAILED',
        statusLabel: 'Phát hành lỗi',
        statusVariant: 'danger',
        reason:
          (poi.attentionReasons ?? []).join('; ') || 'Gửi sự kiện phát hành thất bại.',
        lastAttemptAt: null,
      });
    }
    // (2) Lỗi dịch / tổng hợp audio của từng ngôn ngữ.
    for (const language of poi.languages ?? []) {
      if (!isFailedLanguageStatus(language.audioStatus)) continue;
      const config = resolveLanguageStatus(language.audioStatus);
      rows.push({
        key: `${poi.id}-${language.languageCode}`,
        poiId: poi.id,
        poiName: poi.name,
        kind: 'language',
        languageLabel: language.languageName || language.languageCode,
        status: language.audioStatus,
        statusLabel: config.label,
        statusVariant: config.variant,
        reason: language.errorReason || 'Không có mô tả lỗi.',
        lastAttemptAt: language.lastAttemptAt ?? null,
      });
    }
  }
  return rows;
}

export const PoiErrorLogPage: React.FC = () => {
  // --- State dữ liệu bảng + phân trang ---
  const [rows, setRows] = useState<ErrorLogRow[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // --- State phát hành lại: dòng đang chọn + trạng thái + thông báo ---
  const [target, setTarget] = useState<ErrorLogRow | null>(null);
  const [republishing, setRepublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tải danh sách điểm cần chú ý rồi biến thành các dòng lỗi.
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await poiApi.getAdminPois({
        page,
        size: PAGE_SIZE,
        overallStatus: 'NEEDS_ATTENTION',
      });
      const content = result?.content || [];
      setRows(buildErrorRows(content));
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Xác nhận: gọi API phát hành lại điểm rồi tải lại danh sách.
  const handleRepublish = async () => {
    if (!target || republishing) return;
    setRepublishing(true);
    setActionError(null);
    setNotice(null);
    try {
      await poiApi.republish(target.poiId);
      setNotice(
        `Đã gửi yêu cầu phát hành lại cho ${target.poiName}. Trạng thái sẽ được cập nhật sau khi hệ thống xử lý.`
      );
      setTarget(null);
      await fetchList();
    } catch (err) {
      setActionError(`Không thể phát hành lại: ${normalizeAdminError(err).message}`);
      setTarget(null);
    } finally {
      setRepublishing(false);
    }
  };

  // --- Định nghĩa các cột của bảng nhật ký lỗi ---
  const columns: Column<ErrorLogRow>[] = [
    // Tên điểm (bấm để mở trang sửa điểm).
    {
      key: 'poi',
      title: 'Tên điểm',
      width: '220px',
      render: (row) => (
        <Link to={`/quan-tri/diem-thuyet-minh/${row.poiId}`} className="adm-product-name-link">
          {row.poiName}
        </Link>
      ),
    },
    // Phân loại dòng lỗi: phát hành sự kiện hay dịch/tổng hợp audio.
    {
      key: 'kind',
      title: 'Loại lỗi',
      width: '130px',
      render: (row) => (row.kind === 'publish' ? 'Phát hành' : 'Dịch / audio'),
    },
    {
      key: 'language',
      title: 'Ngôn ngữ',
      width: '120px',
      render: (row) => row.languageLabel,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      render: (row) => (
        <StatusBadge variant={row.statusVariant}>{row.statusLabel}</StatusBadge>
      ),
    },
    {
      key: 'reason',
      title: 'Lý do',
      render: (row) => <span className="adm-clamp-2">{row.reason}</span>,
    },
    {
      key: 'lastAttempt',
      title: 'Thử gần nhất',
      width: '150px',
      render: (row) => (
        <span className="adm-date-text">{formatDateTime(row.lastAttemptAt)}</span>
      ),
    },
    // Nút mở hộp thoại xác nhận phát hành lại điểm của dòng này.
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '150px',
      render: (row) => (
        <div className="adm-row-actions">
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => {
              setNotice(null);
              setActionError(null);
              setTarget(row);
            }}
          >
            Phát hành lại
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      {/* Tiêu đề trang + nút quay về danh sách điểm */}
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Nhật ký xử lý lỗi</h1>
          <p className="adm-page-desc">
            Danh sách lỗi dịch thuật, tổng hợp audio và phát hành của các điểm thuyết minh.
          </p>
        </div>
        <div className="adm-page-actions">
          <Link to="/quan-tri/diem-thuyet-minh" className="adm-btn adm-btn-secondary">
            Danh sách điểm
          </Link>
        </div>
      </div>

      {/* Thanh công cụ (chỉ có nút làm mới, không có bộ lọc) */}
      <AdminToolbar onRefresh={fetchList} refreshing={loading} refreshLabel="Làm mới" />

      {/* Thông báo phát hành lại thành công */}
      {notice && (
        <div className="adm-alert adm-alert-success adm-alert-sm" role="status">
          <span>{notice}</span>
        </div>
      )}

      {/* Thông báo lỗi khi phát hành lại thất bại */}
      {actionError && (
        <div className="adm-alert adm-alert-danger adm-alert-sm" role="alert">
          <span>{actionError}</span>
        </div>
      )}

      {/* Khu vực nội dung: lỗi tải / rỗng / bảng nhật ký */}
      {error ? (
        <ErrorState
          title="Không thể tải nhật ký xử lý lỗi"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        <EmptyState
          title="Không có lỗi xử lý"
          description="Tất cả điểm thuyết minh hiện đang được xử lý thành công."
        />
      ) : (
        <>
          {/* Bảng nhật ký lỗi */}
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(row) => row.key}
            loading={loading}
            emptyText="Không có lỗi xử lý để hiển thị."
            ariaLabel="Bảng nhật ký xử lý lỗi điểm thuyết minh"
            caption="Nhật ký xử lý lỗi"
            stickyLastColumn
          />

          {/* Phân trang phía server */}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="điểm"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}

      {/* Hộp thoại xác nhận phát hành lại điểm đang chọn */}
      <ConfirmDialog
        isOpen={target !== null}
        title="Xác nhận phát hành lại"
        message={`Hệ thống sẽ gửi lại sự kiện để tạo bản dịch và audio cho ${
          target?.poiName || 'điểm này'
        }. Bạn có chắc chắn muốn tiếp tục?`}
        confirmText={republishing ? 'Đang xử lý...' : 'Xác nhận phát hành lại'}
        cancelText="Hủy bỏ"
        variant="primary"
        onConfirm={handleRepublish}
        onCancel={() => {
          if (!republishing) {
            setTarget(null);
          }
        }}
      />
    </div>
  );
};

export default PoiErrorLogPage;
