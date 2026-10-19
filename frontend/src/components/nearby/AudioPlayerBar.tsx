import React from 'react';
import { Play, Pause } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { t, NATIVE_LANG_NAMES, LANG_DISPLAY_NAMES } from '../../content/nearbyI18n';

interface AudioPlayerBarProps {
  activePoi: GeoPoi | null;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  currentTime: number;
  notice: string;
  noticeWarn: boolean;
  onTogglePlay: () => void;
  onViewChapterTranscript: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  noPoiSelectedText?: string;
  playingInLangText?: (langName: string) => string;
  pausedStatusText?: string;
  clickToStartText?: string;
  viewTextBtnText?: string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  activePoi,
  currentLang,
  isPlaying,
  currentTime,
  notice,
  noticeWarn,
  onTogglePlay,
  onViewChapterTranscript,
  getPoiName,
  noPoiSelectedText,
  playingInLangText,
  pausedStatusText,
  clickToStartText,
  viewTextBtnText,
}) => {
  // Show while something is playing, paused mid-track, or displaying a notice message
  if (!activePoi || (!isPlaying && currentTime === 0 && !notice)) {
    return null;
  }

  const poiName = getPoiName(activePoi);
  const currentLangDisplayName =
    LANG_DISPLAY_NAMES[currentLang]?.[currentLang] ||
    NATIVE_LANG_NAMES[currentLang] ||
    currentLang;

  const statusSubText =
    notice ||
    (isPlaying
      ? playingInLangText
        ? playingInLangText(currentLangDisplayName)
        : t(currentLang, 'playingInLang', { lang: currentLangDisplayName })
      : currentTime > 0
      ? pausedStatusText || t(currentLang, 'pausedStatus')
      : clickToStartText || t(currentLang, 'clickToStart'));

  const locViewTx = viewTextBtnText || t(currentLang, 'viewTranscriptBtn');

  return (
    <footer
      className="player nearby-sticky-player-bar"
      aria-label={t(currentLang, 'playerAriaLabel')}
    >
      <div className="player-inner">
        <div className="player-row">
          {/* 1. Left info: Stop Name, Language Badge & Substatus */}
          <div className="player-meta-block">
            <div className="player-title-row">
              <span className="player-poi-title" id="pTitle">
                {poiName || noPoiSelectedText || t(currentLang, 'noPoiSelected')}
              </span>
              <span
                className="player-lang-badge"
                title={`${t(currentLang, 'languageSelectLabel')}: ${currentLangDisplayName}`}
              >
                {currentLang.toUpperCase()}
              </span>
            </div>
            <div
              className={`player-status-sub ${noticeWarn ? 'warn is-warning' : ''}`}
              id="pSub"
            >
              {statusSubText}
            </div>
          </div>

          {/* 2. Middle: play/pause only */}
          <div className="player-controls-mid">
            <button
              className="player-play-btn"
              id="pPlay"
              type="button"
              aria-pressed={isPlaying}
              aria-label={isPlaying ? t(currentLang, 'pauseBtn') : t(currentLang, 'playBtn')}
              onClick={onTogglePlay}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
            </button>
          </div>

          {/* 3. Right: "Xem lời thuyết minh" link */}
          <div className="player-extra-controls">
            <button
              className="player-view-transcript-link"
              id="btnTx"
              type="button"
              onClick={() => onViewChapterTranscript(activePoi.id)}
            >
              {locViewTx}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
