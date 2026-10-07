import React, { useEffect, useState, useRef } from 'react';
import { Pause, Volume2 } from 'lucide-react';
import { api } from '../../api/client';
import { normalizeApiError } from '../../api/errors';
import { PoiDetail, SupportedLanguage } from '../../types';

interface PlaceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  poiId: number | null;
  lang: SupportedLanguage;
  onLangChange: (lang: SupportedLanguage) => void;
  isPlaying: boolean;
  onToggleAudio: (detail: PoiDetail) => void;
  sampleTip?: string;
  sampleDetail?: { name: string; description: string; tip: string };
}

export const PlaceDetailDialog: React.FC<PlaceDetailDialogProps> = ({
  isOpen,
  onClose,
  poiId,
  lang,
  onLangChange,
  isPlaying,
  onToggleAudio,
  sampleTip,
  sampleDetail,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [detail, setDetail] = useState<PoiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !poiId) {
      setDetail(null);
      setErrorMessage(null);
      return;
    }

    if (sampleDetail) {
      const syntheticDetail: PoiDetail = {
        id: poiId,
        code: `SAMPLE_${poiId}`,
        qrToken: `sample_qr_${poiId}`,
        name: sampleDetail.name,
        latitude: 10.77,
        longitude: 106.69,
        triggerRadiusMeters: 50,
        zoneId: 1,
        zoneCode: 'D1',
        categoryCode: 'HISTORIC',
        languageCode: 'vi',
        title: sampleDetail.name,
        summary: sampleDetail.description,
        description: sampleDetail.description,
        audioStatus: 'PENDING',
        fallbackLanguage: false,
      };
      setDetail(syntheticDetail);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);
    setErrorMessage(null);

    api
      .getPoiDetail(poiId, lang, abortController.signal)
      .then((data) => {
        setDetail(data);
      })
      .catch((err: unknown) => {
        const normalized = normalizeApiError(err);
        if (!normalized.isAborted) {
          setErrorMessage(normalized.message);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [isOpen, poiId, lang, sampleDetail]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleRetry = () => {
    if (!poiId) return;
    setLoading(true);
    setErrorMessage(null);
    api
      .getPoiDetail(poiId, lang)
      .then((data) => setDetail(data))
      .catch((err: unknown) => {
        const norm = normalizeApiError(err);
        setErrorMessage(norm.message);
      })
      .finally(() => setLoading(false));
  };

  const hasTip = Boolean(sampleTip);

  return (
    <dialog
      id="dg"
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['vi', 'en', 'ja', 'ko'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className="tb"
              style={{
                padding: '3px 8px',
                fontSize: 12,
                background: lang === l ? 'var(--brown)' : 'transparent',
                color: lang === l ? 'var(--cream)' : 'var(--brown)',
              }}
              aria-pressed={lang === l}
              onClick={() => onLangChange(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Đang tải thông tin chi tiết...</p>}

      {errorMessage && (
        <div style={{ margin: '12px 0' }}>
          <p style={{ color: '#c0392b' }}>{errorMessage}</p>
          <button type="button" className="tb" onClick={handleRetry} style={{ marginTop: 8 }}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !errorMessage && detail && (
        <>
          <h3 id="dt">{detail.title || detail.name}</h3>
          <p id="dd">{detail.description || detail.summary || detail.historicalSignificance}</p>
          {hasTip && <p id="dp">Gợi ý: {sampleTip}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              id="ds"
              type="button"
              className="tb"
              style={{ color: 'var(--brown)' }}
              aria-pressed={isPlaying}
              onClick={() => onToggleAudio(detail)}
            >
              {isPlaying ? (
                <>
                  <Pause size={15} strokeWidth={1.75} aria-hidden="true" />
                  Dừng
                </>
              ) : (
                <>
                  <Volume2 size={15} strokeWidth={1.75} aria-hidden="true" />
                  Nghe
                </>
              )}
            </button>
            <button
              id="dx"
              type="button"
              className="tb"
              style={{ color: 'var(--brown)' }}
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </>
      )}

      {!loading && !errorMessage && !detail && (
        <div style={{ margin: '12px 0' }}>
          <p>Không tìm thấy thông tin địa điểm.</p>
          <button id="dx" type="button" className="tb" onClick={onClose} style={{ marginTop: 8 }}>
            Đóng
          </button>
        </div>
      )}
    </dialog>
  );
};
