import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../api/client';
import { Report } from '../types/report';
import { useTranslation } from '../locales/i18n';
import { Inbox, ArrowRight, Search, X, Copy, Check } from 'lucide-react';

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
  const { t } = useTranslation();
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
  const [copied, setCopied] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
        setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const displayFrom = totalItems > 0 ? startIndex + 1 : 0;
  const displayTo = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="app-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '18px' }}>
        <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
          {t.history.title}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          {t.history.subtitle}
        </p>
      </div>

      {/* 2. Search & Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 12px',
            height: '42px',
            maxWidth: '480px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm theo URL hoặc tên miền…"
            value={searchUrl}
            onChange={(e) => {
              setSearchUrl(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontFamily: 'inherit',
              backgroundColor: 'transparent',
              color: 'var(--text)',
            }}
          />
          {searchUrl && (
            <button
              type="button"
              onClick={() => {
                setSearchUrl('');
                setPage(1);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Chips (Kênh & Kết luận) — High Contrast WCAG AA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Channel Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Kênh:</span>
            {['Tất cả', 'Web', 'SMS'].map((c) => {
              const isSelected = channelFilter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setChannelFilter(c);
                    setPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

          {/* Verdict Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Kết luận:</span>
            {['Tất cả', 'Giả mạo', 'An toàn', 'Đang chờ'].map((v) => {
              const isSelected = verdictFilter === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setVerdictFilter(v);
                    setPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Data Container */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div style={{ padding: '16px' }}>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={`sk-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: idx < 5 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ width: `${50 + (idx % 3) * 15}%`, height: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }} />
                <div style={{ width: '40px', height: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', marginLeft: 'auto' }} />
                <div style={{ width: '60px', height: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && paginatedData.length === 0 && (
          <div style={{ padding: '56px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '14px',
              }}
            >
              <Inbox size={28} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px 0' }}>
              Bạn chưa kiểm tra link nào
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0', maxWidth: '360px', lineHeight: 1.5 }}>
              {searchUrl.trim() || channelFilter !== 'Tất cả' || verdictFilter !== 'Tất cả'
                ? 'Không tìm thấy liên kết nào khớp với tiêu chí tìm kiếm.'
                : 'Mọi liên kết và tin nhắn bạn kiểm tra sẽ được lưu tại đây để tiện theo dõi.'}
            </p>
            <NavLink
              to="/check"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '40px',
                padding: '0 18px',
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <span>Kiểm tra link ngay</span>
              <ArrowRight size={15} />
            </NavLink>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
            <button type="button" className="btn-secondary" onClick={fetchHistory} style={{ fontSize: '13px' }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Data List: Desktop Table vs Mobile Cards */}
        {!isLoading && !error && paginatedData.length > 0 && (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="desktop-only" style={{ overflowX: 'auto' }}>
              <table className="flat-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Đường link (URL)</th>
                    <th style={{ width: '12%' }}>Kênh</th>
                    <th style={{ width: '18%' }}>Kết luận</th>
                    <th style={{ width: '12%' }}>Mức rủi ro</th>
                    <th style={{ width: '13%' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const isPhishing = item.verdict === 'PHISHING';
                    const isSafe = item.verdict === 'SAFE';

                    return (
                      <tr
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedItem(item)}
                        title="Bấm để xem chi tiết"
                      >
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                            {item.url.length > 50 ? item.url.slice(0, 50) + '…' : item.url}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.channel}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isPhishing ? 'var(--danger)' : isSafe ? 'var(--safe)' : 'var(--warning)',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: isPhishing ? 'var(--danger)' : isSafe ? 'var(--safe)' : 'var(--warning)',
                              }}
                            />
                            <span>{item.verdictLabel}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                            {item.riskScore !== null ? `${Math.round(item.riskScore * 100)}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< 768px) */}
            <div className="mobile-only" style={{ padding: '10px' }}>
              {paginatedData.map((item) => {
                const isPhishing = item.verdict === 'PHISHING';
                const isSafe = item.verdict === 'SAFE';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: isPhishing ? 'var(--danger)' : isSafe ? 'var(--safe)' : 'var(--warning)',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isPhishing ? 'var(--danger)' : isSafe ? 'var(--safe)' : 'var(--warning)',
                          }}
                        />
                        <span>{item.verdictLabel}</span>
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '6px',
                      }}
                    >
                      {item.url}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Kênh: {item.channel}</span>
                      {item.riskScore !== null && <span>· Rủi ro: {Math.round(item.riskScore * 100)}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              <div>
                Hiển thị {displayFrom}-{displayTo} / {totalItems}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page <= 1}
                  style={{ padding: '4px 10px', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= totalPages}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    opacity: page >= totalPages ? 0.4 : 1,
                    cursor: page >= totalPages ? 'default' : 'pointer',
                  }}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Drawer Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 2000,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                Chi tiết bản ghi #{selectedItem.id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* URL full box */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '13px', wordBreak: 'break-all', color: 'var(--text)' }}>
                {selectedItem.url}
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCopy(selectedItem.url)}
                style={{ flexShrink: 0, padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
            </div>

            {/* Verdict Card */}
            <div
              style={{
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                backgroundColor:
                  selectedItem.verdict === 'PHISHING'
                    ? 'rgba(179,38,30,0.06)'
                    : selectedItem.verdict === 'SAFE'
                    ? 'rgba(26,107,58,0.06)'
                    : 'rgba(122,82,0,0.06)',
                border: `1px solid ${
                  selectedItem.verdict === 'PHISHING'
                    ? 'rgba(179,38,30,0.25)'
                    : selectedItem.verdict === 'SAFE'
                    ? 'rgba(26,107,58,0.25)'
                    : 'rgba(122,82,0,0.25)'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color:
                      selectedItem.verdict === 'PHISHING'
                        ? 'var(--danger)'
                        : selectedItem.verdict === 'SAFE'
                        ? 'var(--safe)'
                        : 'var(--warning)',
                  }}
                >
                  {selectedItem.verdictLabel}
                </span>
                {selectedItem.riskScore !== null && (
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>
                    Mức rủi ro: {Math.round(selectedItem.riskScore * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Info Table */}
            <div className="kv-list">
              <div className="kv-row">
                <div className="kv-key">Kênh tiếp nhận</div>
                <div className="kv-value">{selectedItem.channel}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Người gửi</div>
                <div className="kv-value">{selectedItem.reporterContact || 'Ẩn danh'}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Thời gian kiểm tra</div>
                <div className="kv-value">{selectedItem.createdAt ? selectedItem.createdAt.replace('T', ' ').slice(0, 19) : '—'}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Trạng thái</div>
                <div className="kv-value">{selectedItem.status || 'Đã kiểm tra'}</div>
              </div>
            </div>

            {selectedItem.description && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                  Ghi chú mô tả:
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {selectedItem.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
