import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { Report } from '../types/report';

export interface HistoryItem {
  id: number;
  url: string;
  channel: 'WEB' | 'SMS';
  verdict: 'PHISHING' | 'SAFE' | 'PENDING';
  verdictLabel: string;
  riskScore: number | null;
  createdAt: string;
  reporterContact?: string;
  description?: string;
  status?: string;
}

const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 1048,
    url: 'https://vietcombank-login.xyz/auth',
    channel: 'WEB',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    riskScore: 0.67,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    reporterContact: 'vi***@gmail.com',
    description: 'Trang web mạo danh đăng nhập Vietcombank.',
    status: 'VERIFIED',
  },
  {
    id: 1047,
    url: 'https://portal.vietcombank.com.vn',
    channel: 'WEB',
    verdict: 'SAFE',
    verdictLabel: 'An toàn',
    riskScore: 0.0,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    reporterContact: 'an***@vcb.com.vn',
    description: 'Cổng thông tin chính thức của Vietcombank.',
    status: 'VERIFIED',
  },
  {
    id: 1046,
    url: 'https://techcom-otp.top/verify',
    channel: 'SMS',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    riskScore: 0.67,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    reporterContact: '090***4567',
    description: 'Tin nhắn SMS lừa đảo yêu cầu nhập OTP.',
    status: 'NOTIFIED',
  },
  {
    id: 1041,
    url: 'https://acb-online-portal.info',
    channel: 'WEB',
    verdict: 'PENDING',
    verdictLabel: 'Đang chờ',
    riskScore: null,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    reporterContact: 'le***@gmail.com',
    description: 'Trang đang chờ kiểm tra bảo mật.',
    status: 'PENDING',
  },
  {
    id: 1045,
    url: 'https://mbbank-online-secure.net/login',
    channel: 'WEB',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    riskScore: 1.0,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    reporterContact: 'tr***@outlook.com',
    description: 'Tên miền phishing giả mạo MB Bank.',
    status: 'NOTIFIED',
  },
];

const formatRelativeTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

const mapReportToHistoryItem = (r: Report): HistoryItem => {
  let verdict: 'PHISHING' | 'SAFE' | 'PENDING' = 'PENDING';
  let verdictLabel = 'Đang chờ';

  if (r.isPhishing === true) {
    verdict = 'PHISHING';
    verdictLabel = 'Giả mạo';
  } else if (r.isPhishing === false) {
    verdict = 'SAFE';
    verdictLabel = 'An toàn';
  } else if (r.status === 'VERIFIED' && r.riskScore !== null && r.riskScore !== undefined) {
    verdict = r.riskScore > 0.5 ? 'PHISHING' : 'SAFE';
    verdictLabel = r.riskScore > 0.5 ? 'Giả mạo' : 'An toàn';
  }

  return {
    id: r.id,
    url: r.targetUrl,
    channel: r.channel || 'WEB',
    verdict,
    verdictLabel,
    riskScore: r.riskScore ?? null,
    createdAt: r.createdAt,
    reporterContact: r.reporterContact,
    description: r.description,
    status: r.status,
  };
};

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState('Tất cả');
  const [verdictFilter, setVerdictFilter] = useState('Tất cả');
  const [searchUrl, setSearchUrl] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Selected row for detail drawer
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [copyNotification, setCopyNotification] = useState('');

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Build filter parameters to transmit down to API
    const params: { channel?: string; verdict?: string; url?: string } = {};
    if (channelFilter !== 'Tất cả') {
      params.channel = channelFilter.toUpperCase();
    }
    if (verdictFilter !== 'Tất cả') {
      params.verdict =
        verdictFilter === 'Giả mạo'
          ? 'PHISHING'
          : verdictFilter === 'An toàn'
          ? 'SAFE'
          : 'PENDING';
    }
    if (searchUrl.trim()) {
      params.url = searchUrl.trim();
    }

    try {
      const reports = await api.getReports(params);
      let mapped = reports.map(mapReportToHistoryItem);

      // Client-side guard filter in case backend returns unfiltered collection
      if (params.channel) {
        mapped = mapped.filter((item) => item.channel === params.channel);
      }
      if (params.verdict) {
        mapped = mapped.filter((item) => item.verdict === params.verdict);
      }
      if (params.url) {
        const q = params.url.toLowerCase();
        mapped = mapped.filter((item) => item.url.toLowerCase().includes(q));
      }

      setData(mapped);
    } catch {
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        let filtered = [...DEFAULT_HISTORY];
        if (channelFilter !== 'Tất cả') {
          filtered = filtered.filter((i) => i.channel === channelFilter.toUpperCase());
        }
        if (verdictFilter !== 'Tất cả') {
          filtered = filtered.filter((i) => i.verdictLabel === verdictFilter);
        }
        if (searchUrl.trim()) {
          const q = searchUrl.trim().toLowerCase();
          filtered = filtered.filter((i) => i.url.toLowerCase().includes(q));
        }
        setData(filtered);
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [channelFilter, verdictFilter, searchUrl]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopyNotification('Đã sao chép!');
    setTimeout(() => setCopyNotification(''), 2000);
  };

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const displayFrom = totalItems > 0 ? startIndex + 1 : 0;
  const displayTo = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div>
      {/* 1. Tiêu đề chuẩn 28px, font-weight 600, subtitle --muted */}
      <h1 className="page-title">Lịch sử của tôi</h1>
      <p className="page-subtitle">Nhật ký các liên kết bạn đã gửi yêu cầu phân tích và đối soát an ninh.</p>

      {/* 2. Khung bảng luôn hiển thị */}
      <div
        className="panel"
        style={{
          padding: 0,
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        {/* Thanh trên bảng: Bộ lọc kênh, kết luận và ô tìm kiếm */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Bộ lọc kênh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                KÊNH:
              </span>
              {['Tất cả', 'Web', 'SMS'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-btn ${channelFilter === c ? 'active' : ''}`}
                  onClick={() => {
                    setChannelFilter(c);
                    setPage(1);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--line)' }} />

            {/* Bộ lọc kết luận */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted)',
                }}
              >
                KẾT LUẬN:
              </span>
              {['Tất cả', 'Giả mạo', 'An toàn', 'Đang chờ'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`filter-btn ${verdictFilter === v ? 'active' : ''}`}
                  onClick={() => {
                    setVerdictFilter(v);
                    setPage(1);
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Ô tìm kiếm theo URL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="input-search mono"
              placeholder="Tìm theo URL…"
              value={searchUrl}
              onChange={(e) => {
                setSearchUrl(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Hàng tiêu đề cột */}
        <table className="console-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>URL</th>
              <th style={{ width: '12%' }}>KÊNH</th>
              <th style={{ width: '16%' }}>KẾT LUẬN</th>
              <th style={{ width: '16%' }}>RỦI RO</th>
              <th style={{ width: '16%' }}>THỜI GIAN</th>
            </tr>
          </thead>
          <tbody>
            {/* 4. Trạng thái đang tải: 5 dòng skeleton phẳng, không animation lòe loẹt */}
            {isLoading && (
              <>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={`skeleton-${idx}`} style={{ height: '48px' }}>
                    <td>
                      <div className="skeleton-bar" style={{ width: `${60 + (idx % 3) * 15}%` }} />
                    </td>
                    <td>
                      <div className="skeleton-bar" style={{ width: '32px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bar" style={{ width: '56px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bar" style={{ width: '40px' }} />
                    </td>
                    <td>
                      <div className="skeleton-bar" style={{ width: '70px' }} />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Dữ liệu thật khi đã tải xong */}
            {!isLoading && !error && paginatedData.length > 0 && (
              <>
                {paginatedData.map((item) => {
                  const isPhishing = item.verdict === 'PHISHING';
                  const isSafe = item.verdict === 'SAFE';

                  const dotColor = isPhishing
                    ? 'var(--danger)'
                    : isSafe
                    ? 'var(--safe)'
                    : 'var(--warn)';

                  return (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer', height: '48px' }}
                      onClick={() => setSelectedItem(item)}
                      title="Bấm để xem chi tiết bản ghi"
                    >
                      <td>
                        <span className="mono" style={{ fontSize: '13px', color: 'var(--text)' }}>
                          {item.url.length > 46 ? item.url.slice(0, 46) + '…' : item.url}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {item.channel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            className="status-dot"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span
                            style={{
                              fontSize: '13px',
                              color: isPhishing
                                ? 'var(--danger)'
                                : isSafe
                                ? 'var(--safe)'
                                : 'var(--warn)',
                            }}
                          >
                            {item.verdictLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.riskScore !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '54px',
                                height: '2px',
                                backgroundColor: 'var(--line)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.round(item.riskScore * 100)}%`,
                                  height: '100%',
                                  backgroundColor:
                                    item.riskScore > 0.5 ? 'var(--danger)' : 'var(--safe)',
                                }}
                              />
                            </div>
                            <span className="mono" style={{ fontSize: '12px' }}>
                              {Math.round(item.riskScore * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>

        {/* 5. Trạng thái lỗi */}
        {error && !isLoading && (
          <div
            style={{
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flex: 1,
            }}
          >
            <span style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchHistory}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 3. Trạng thái trống: ngay dưới hàng tiêu đề, canh giữa, một câu và nút vừa nội dung */}
        {!isLoading && !error && paginatedData.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              flex: 1,
              gap: '16px',
            }}
          >
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
              {searchUrl.trim() || channelFilter !== 'Tất cả' || verdictFilter !== 'Tất cả'
                ? 'Không tìm thấy liên kết nào khớp với tiêu chí tìm kiếm.'
                : 'Chưa có liên kết nào được gửi kiểm tra.'}
            </div>
            <NavLink
              to="/check"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                width: 'auto',
              }}
            >
              Kiểm tra liên kết đầu tiên
            </NavLink>
          </div>
        )}

        {/* Phân trang phía dưới: "Hiển thị 1-10 / tổng" */}
        {!isLoading && !error && totalItems > 0 && (
          <div
            style={{
              marginTop: 'auto',
              padding: '10px 16px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div>
              Hiển thị {displayFrom}-{displayTo} / {totalItems}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="filter-btn"
                disabled={page <= 1}
                style={{ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="filter-btn"
                disabled={page >= totalPages}
                style={{
                  opacity: page >= totalPages ? 0.4 : 1,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chi tiết bản ghi khi bấm vào dòng (480px Drawer) */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              width: '480px',
              height: '100%',
              backgroundColor: 'var(--panel)',
              borderLeft: '1px solid var(--line)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                Bản ghi #{selectedItem.id}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
                onClick={() => setSelectedItem(null)}
              >
                Đóng
              </button>
            </div>

            {/* URL đầy đủ */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: '2px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span className="mono" style={{ fontSize: '12px', wordBreak: 'break-all', color: 'var(--text)' }}>
                {selectedItem.url}
              </span>
              <button
                type="button"
                className="filter-btn"
                onClick={() => handleCopy(selectedItem.url)}
              >
                {copyNotification || 'Sao chép'}
              </button>
            </div>

            {/* Kết luận & Rủi ro */}
            <div
              className={`verdict-box ${
                selectedItem.verdict === 'PHISHING'
                  ? 'danger'
                  : selectedItem.verdict === 'SAFE'
                  ? 'safe'
                  : 'warn'
              }`}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span
                  className="mono"
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color:
                      selectedItem.verdict === 'PHISHING'
                        ? 'var(--danger)'
                        : selectedItem.verdict === 'SAFE'
                        ? 'var(--safe)'
                        : 'var(--warn)',
                  }}
                >
                  {selectedItem.verdictLabel.toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: '20px', fontWeight: 600 }}>
                  {selectedItem.riskScore !== null ? `${Math.round(selectedItem.riskScore * 100)}%` : '—'}
                </span>
              </div>
              <div className="risk-bar-slim">
                <div
                  className={`risk-bar-fill ${
                    selectedItem.verdict === 'PHISHING'
                      ? 'danger'
                      : selectedItem.verdict === 'SAFE'
                      ? 'safe'
                      : 'warn'
                  }`}
                  style={{
                    width: `${
                      selectedItem.riskScore !== null ? Math.round(selectedItem.riskScore * 100) : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Thông số kỹ thuật */}
            <table className="console-table">
              <tbody>
                <tr>
                  <td style={{ width: '130px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Kênh tiếp nhận
                  </td>
                  <td className="mono">{selectedItem.channel}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Người báo cáo
                  </td>
                  <td>{selectedItem.reporterContact || 'Ẩn danh'}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Thời gian tạo
                  </td>
                  <td className="mono">{selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').slice(0, 19) : '—'}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                    Trạng thái hệ thống
                  </td>
                  <td className="mono">{selectedItem.status || 'VERIFIED'}</td>
                </tr>
              </tbody>
            </table>

            {selectedItem.description && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Ghi chú mô tả
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedItem.description}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
