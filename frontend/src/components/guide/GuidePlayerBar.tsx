import React from 'react';
import { NearbyResponse } from '../../types/poi';
import { SpeechRate } from '../../context/PreferencesContext';
import { CreditCard, Building2, ArrowRightLeft, Square, Play, RefreshCw, AlertCircle, MapPin, RotateCcw } from 'lucide-react';

interface GuidePlayerBarProps {
  nearbyResult: NearbyResponse | null;
  isLoading: boolean;
  hasSearched: boolean;
  apiError: string | null;
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  ttsNotice: string | null;
  rate?: SpeechRate;
  onToggleRate?: () => void;
  onReplay?: () => void;
  sentences?: string[];
  currentSentenceIndex?: number;
  onPlayFallbackAudio?: () => void;
}

export const GuidePlayerBar: React.FC<GuidePlayerBarProps> = ({
  nearbyResult,
  isLoading,
  hasSearched,
  apiError,
  isSpeaking,
  onToggleSpeak,
  ttsNotice,
  rate,
  onToggleRate,
  onReplay,
  sentences,
  currentSentenceIndex,
  onPlayFallbackAudio,
}) => {
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'ATM':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
            }}
          >
            <CreditCard size={13} />
            ATM
          </span>
        );
      case 'BRANCH':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#7c3aed',
              color: '#ffffff',
            }}
          >
            <Building2 size={13} />
            Chi nhánh
          </span>
        );
      case 'FX_EXCHANGE':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'var(--warning)',
              color: '#ffffff',
            }}
          >
            <ArrowRightLeft size={13} />
            Ngoại tệ
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#475569',
              color: '#ffffff',
            }}
          >
            {type}
          </span>
        );
    }
  };

  return (
    <div
      className="guide-player-bar"
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderTop: 'none',
        borderRadius: '0 0 4px 4px',
        padding: '18px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Loading State */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '16px 0',
            color: 'var(--text-muted)',
            fontSize: '15px',
          }}
        >
          <RefreshCw size={18} className="spin-animation" style={{ color: 'var(--primary)' }} />
          <span>Đang quét tìm điểm trong bán kính 200m…</span>
        </div>
      )}

      {/* 2. API Error */}
      {apiError && !isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '4px',
            backgroundColor: 'rgba(158, 31, 24, 0.08)',
            color: 'var(--danger)',
            border: '1.5px solid var(--danger)',
            fontSize: '15px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {/* 3. HTTP 204: Không có điểm gần */}
      {!isLoading && hasSearched && !nearbyResult && !apiError && (
        <div
          style={{
            padding: '12px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '6px',
              backgroundColor: 'rgba(122, 74, 0, 0.1)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
              Chưa có điểm nào trong bán kính 200m
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Không tìm thấy ATM, chi nhánh hoặc quầy ngoại tệ nào gần tọa độ này. Hãy chạm vào một điểm khác trên bản đồ để khám phá.
            </div>
          </div>
        </div>
      )}

      {/* 4. Trạng thái ban đầu */}
      {!isLoading && !hasSearched && !nearbyResult && !apiError && (
        <div
          style={{
            padding: '12px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-muted)',
            fontSize: '16px',
          }}
        >
          <MapPin size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>Chạm vào bất kỳ điểm nào trên bản đồ hoặc dùng GPS để bắt đầu nghe thuyết minh tự động.</span>
        </div>
      )}

      {/* 5. POI result & Audio Controls */}
      {!isLoading && nearbyResult && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Cột trái: Tên điểm, khoảng cách, thuyết minh */}
            <div style={{ flex: '1 1 380px', minWidth: 0 }}>
              {/* Header: Badge, Name, Distance */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '4px',
                }}
              >
                {renderTypeBadge(nearbyResult.poi.type)}
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--text)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {nearbyResult.poi.name}
                </h2>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--safe)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(20, 89, 47, 0.1)',
                  }}
                >
                  Cách bạn {nearbyResult.distanceMeters}m
                </span>
              </div>

              {/* Ngân hàng & Địa chỉ */}
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nearbyResult.poi.bankName} · {nearbyResult.poi.address}
              </div>

              {/* Đoạn text thuyết minh cuộn được & Tô sáng từng câu */}
              <div
                style={{
                  maxHeight: '84px',
                  overflowY: 'auto',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'var(--text)',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '10px 14px',
                }}
              >
                {isSpeaking && sentences && sentences.length > 0 ? (
                  <div>
                    {sentences.map((sent, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: currentSentenceIndex === idx ? 'rgba(255, 230, 0, 0.4)' : 'transparent',
                          fontWeight: currentSentenceIndex === idx ? 800 : 400,
                          padding: '1px 3px',
                          borderRadius: '3px',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {sent}{' '}
                      </span>
                    ))}
                  </div>
                ) : (
                  nearbyResult.narration.text
                )}
              </div>
            </div>

            {/* Cột phải: Bộ điều khiển âm thanh nâng cấp */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'center',
                flexShrink: 0,
                gap: '8px',
                alignSelf: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onToggleSpeak}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '52px',
                    minWidth: '120px',
                    padding: '0 20px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: isSpeaking ? 'var(--danger)' : 'var(--primary)',
                    color: '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {isSpeaking ? (
                    <>
                      <Square size={16} fill="currentColor" />
                      <span>Dừng</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>Phát</span>
                    </>
                  )}
                </button>

                {isSpeaking && onReplay && (
                  <button
                    type="button"
                    onClick={onReplay}
                    title="Phát lại từ đầu"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '52px',
                      width: '52px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1.5px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={18} />
                  </button>
                )}

                {rate !== undefined && onToggleRate && (
                  <button
                    type="button"
                    onClick={onToggleRate}
                    title="Đổi tốc độ đọc"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '52px',
                      padding: '0 12px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      border: '1.5px solid var(--border)',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {rate}x
                  </button>
                )}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: isSpeaking ? 'var(--safe)' : 'var(--text-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {isSpeaking ? (
                  <>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--safe)',
                        display: 'inline-block',
                      }}
                    />
                    Đang phát ({nearbyResult.narration.locale.toUpperCase()})
                  </>
                ) : (
                  <span>Giọng: {nearbyResult.narration.ttsLang}</span>
                )}
              </div>
            </div>
          </div>

          {/* Thông báo giọng đọc nhỏ nếu có */}
          {ttsNotice && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: 'rgba(122, 74, 0, 0.1)',
                color: 'var(--warning)',
                border: '1px solid rgba(122, 74, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{ttsNotice}</span>
              </div>
              {onPlayFallbackAudio && (
                <button
                  type="button"
                  onClick={onPlayFallbackAudio}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    minHeight: '36px',
                  }}
                >
                  Nghe bằng âm thanh máy chủ (Audio dự phòng)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
