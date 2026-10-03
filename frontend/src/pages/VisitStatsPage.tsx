import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { VisitStats } from '../types/poi';
import {
  Headphones,
  Globe,
  TrendingUp,
  RefreshCw,
  Award,
  BarChart3,
  Layers,
} from 'lucide-react';

const LANGUAGE_LABELS: Record<string, { label: string; flag: string; color: string }> = {
  vi: { label: 'Tiếng Việt', flag: '🇻🇳', color: '#38bdf8' },
  en: { label: 'English', flag: '🇬🇧', color: '#3fb950' },
  ko: { label: '한국어', flag: '🇰🇷', color: '#c084fc' },
  ja: { label: '日本語', flag: '🇯🇵', color: '#fbbf24' },
  zh: { label: '中文', flag: '🇨🇳', color: '#f87171' },
};

export const VisitStatsPage: React.FC = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getVisitStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối đến máy chủ thống kê lượt nghe.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitStats();
  }, [fetchVisitStats]);

  // Tìm ngôn ngữ có lượt nghe cao nhất
  const getTopLanguage = () => {
    if (!stats || !stats.byLang) return null;
    const entries = Object.entries(stats.byLang);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    const pct = stats.total > 0 ? ((top[1] / stats.total) * 100).toFixed(1) : '0';
    return {
      code: top[0],
      count: top[1],
      percentage: pct,
      info: LANGUAGE_LABELS[top[0]] || { label: top[0].toUpperCase(), flag: '🌐', color: '#38bdf8' },
    };
  };

  const topLang = getTopLanguage();
  const topPoi = stats?.topPois && stats.topPois.length > 0 ? stats.topPois[0] : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 0 48px 0' }}>
      {/* Header trang */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Headphones size={28} style={{ color: '#38bdf8' }} />
            <h1 className="page-title" style={{ margin: 0, fontSize: '26px' }}>
              Thống kê lượt nghe POI
            </h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Giám sát thời gian thực số lượt du khách và người dân nghe thuyết minh tại các điểm giao dịch ngân hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchVisitStats}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Trạng thái Đang tải */}
      {isLoading && (
        <div
          className="panel"
          style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: '24px',
            borderRadius: '12px',
          }}
        >
          <RefreshCw size={24} style={{ color: '#38bdf8', margin: '0 auto 12px auto' }} className="spin-animation" />
          <div>Đang tải số liệu thống kê lượt nghe POI…</div>
        </div>
      )}

      {/* Trạng thái Lỗi */}
      {error && !isLoading && (
        <div
          className="panel"
          style={{
            padding: '20px',
            backgroundColor: 'rgba(229, 72, 77, 0.1)',
            border: '1px solid rgba(229, 72, 77, 0.3)',
            color: 'var(--danger)',
            marginBottom: '24px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchVisitStats}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(229, 72, 77, 0.2)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 1. Các thẻ chỉ số tổng quan (KPI Cards) */}
      {!isLoading && !error && stats && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            {/* Card 1: Tổng lượt nghe */}
            <div
              className="panel"
              style={{
                padding: '20px 24px',
                borderRadius: '10px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Tổng lượt nghe thuyết minh
                </span>
                <Headphones size={18} style={{ color: '#38bdf8' }} />
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text)',
                }}
              >
                {stats.total.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--safe)', marginTop: '4px' }}>
                ↑ Ghi nhận từ visit-log-service
              </div>
            </div>

            {/* Card 2: Ngôn ngữ dẫn đầu */}
            <div
              className="panel"
              style={{
                padding: '20px 24px',
                borderRadius: '10px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Ngôn ngữ phổ biến nhất
                </span>
                <Globe size={18} style={{ color: '#3fb950' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: topLang?.info.color || 'var(--text)',
                  }}
                >
                  {topLang?.info.flag} {topLang?.info.label}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {topLang?.count.toLocaleString()} lượt ({topLang?.percentage}% tổng số)
              </div>
            </div>

            {/* Card 3: Điểm nghe nhiều nhất */}
            <div
              className="panel"
              style={{
                padding: '20px 24px',
                borderRadius: '10px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Điểm được quan tâm nhất (#1)
                </span>
                <Award size={18} style={{ color: '#fbbf24' }} />
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={topPoi?.name}
              >
                {topPoi ? topPoi.name : 'Chưa có'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {topPoi ? `${topPoi.count.toLocaleString()} lượt ghé thăm` : '0 lượt'}
              </div>
            </div>

            {/* Card 4: Đa dạng ngôn ngữ */}
            <div
              className="panel"
              style={{
                padding: '20px 24px',
                borderRadius: '10px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Đa dạng ngôn ngữ
                </span>
                <Layers size={18} style={{ color: '#c084fc' }} />
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text)',
                }}
              >
                {Object.keys(stats.byLang).length} <span style={{ fontSize: '16px', fontWeight: 500 }}>ngôn ngữ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Hỗ trợ: VI, EN, KO, JA, ZH
              </div>
            </div>
          </div>

          {/* 2. Grid 2 cột: Bar Chart theo ngôn ngữ & Bảng Top 5 POI */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
              gap: '24px',
              alignItems: 'stretch',
            }}
          >
            {/* Cột 1: Phân bổ theo ngôn ngữ (CSS Bar Chart) */}
            <div
              className="panel"
              style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <BarChart3 size={18} style={{ color: '#38bdf8' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  Lượt nghe theo ngôn ngữ
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {Object.entries(stats.byLang)
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, count]) => {
                    const info = LANGUAGE_LABELS[code] || {
                      label: code.toUpperCase(),
                      flag: '🌐',
                      color: '#38bdf8',
                    };
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;

                    return (
                      <div key={code}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                            marginBottom: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                            <span>{info.flag}</span>
                            <span>{info.label}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                              ({code})
                            </span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            <strong>{count.toLocaleString()}</strong>{' '}
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              ({pct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Thanh Bar CSS */}
                        <div
                          style={{
                            width: '100%',
                            height: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: info.color,
                              borderRadius: '9999px',
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Dữ liệu phân tích đa ngôn ngữ</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>TTS Engine: Web Speech API</span>
              </div>
            </div>

            {/* Cột 2: Bảng Top 5 POI */}
            <div
              className="panel"
              style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <TrendingUp size={18} style={{ color: '#fbbf24' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  Top 5 điểm được nghe nhiều nhất
                </h2>
              </div>

              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: '45px' }}>Hạng</th>
                      <th style={{ padding: '8px 10px' }}>Địa điểm POI</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Lượt nghe</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPois.map((item, index) => {
                      const pct = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;

                      return (
                        <tr
                          key={item.poiId}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '12px 10px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isTop1
                                  ? 'rgba(251, 191, 36, 0.2)'
                                  : isTop2
                                  ? 'rgba(192, 132, 252, 0.2)'
                                  : isTop3
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                color: isTop1
                                  ? '#fbbf24'
                                  : isTop2
                                  ? '#c084fc'
                                  : isTop3
                                  ? '#38bdf8'
                                  : 'var(--text-muted)',
                              }}
                            >
                              {index + 1}
                            </span>
                          </td>

                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              Mã POI: #{item.poiId}
                            </div>
                          </td>

                          <td
                            style={{
                              padding: '12px 10px',
                              textAlign: 'right',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              color: 'var(--text)',
                            }}
                          >
                            {item.count.toLocaleString()}
                          </td>

                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {pct.toFixed(1)}%
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '2px',
                                marginTop: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  backgroundColor: isTop1 ? '#fbbf24' : '#38bdf8',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
