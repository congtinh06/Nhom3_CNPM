import React from 'react';
import { Play, Pause } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { t, NATIVE_LANG_NAMES, LANG_DISPLAY_NAMES } from '../../content/nearbyI18n';

function formatMmSs(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface AudioPlayerBarProps {
  activePoi: GeoPoi | null;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  showTranscript?: boolean;
  notice: string;
  noticeWarn: boolean;
  isHtml5Audio: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onChangeSpeed: (spd: number) => void;
  onViewChapterTranscript: (poiId: string) => void;
  resolveAudio?: (poi: GeoPoi) => {
    hasAudioInLang: boolean;
    actualLang: SupportedLanguage;
    actualTxLang: SupportedLanguage;
    text: string;
  };
  getPoiName: (poi: GeoPoi) => string;
  noPoiSelectedText?: string;
  playingInLangText?: (langName: string) => string;
  pausedStatusText?: string;
  clickToStartText?: string;
  speedLabelText?: string;
  viewTextBtnText?: string;
  hideTextBtnText?: string;
  fallbackTxNoticeText?: (langName: string) => string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  activePoi,
  currentLang,
  isPlaying,
  currentTime,
  duration,
  speed,
  notice,
  noticeWarn,
  isHtml5Audio,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
  onViewChapterTranscript,
  getPoiName,
  noPoiSelectedText,
  playingInLangText,
  pausedStatusText,
  clickToStartText,
  speedLabelText,
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

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isPaused = !isPlaying && currentTime > 0 && !notice;
  const locSpeedLabel = speedLabelText || t(currentLang, 'speedLabel');
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

          {/* 2. Middle Controls: Adapts to Audio Source */}
          <div className="player-controls-mid">
            {/* Play/Pause Button */}
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

            {/* Capabilities Adapt to Source: */}
            {isHtml5Audio ? (
              /* Real Interactive Progress Bar with accurate timestamps */
              <div className="player-progress-container">
                <div
                  className="player-progress-bar"
                  id="pBar"
                  role="progressbar"
                  aria-label={t(currentLang, 'playerProgressBarAria')}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progressPercent)}
                  tabIndex={0}
                  onClick={(e) => {
                    if (!duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    onSeek(fraction * duration);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      onSeek(Math.min(duration, currentTime + 5));
                    } else if (e.key === 'ArrowLeft') {
                      onSeek(Math.max(0, currentTime - 5));
                    }
                  }}
                >
                  <span
                    id="pFill"
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="player-time-display" id="pTime">
                  {formatMmSs(currentTime)} / {formatMmSs(duration)}
                </span>
              </div>
            ) : (
              /* SpeechSynthesis: Hide seek & +/-15s, show non-interactive progress indicator */
              <div
                className="player-speech-indicator"
                role="status"
                aria-label={t(currentLang, 'speechEngineAria')}
              >
                <div className="speech-pulse-track">
                  <span
                    className={`speech-pulse-bar ${isPlaying ? 'is-animating' : ''} ${
                      isPaused ? 'is-paused' : ''
                    }`}
                    style={{ width: isPlaying || isPaused ? '100%' : '0%' }}
                  />
                </div>
                <span className="speech-engine-tag">{t(currentLang, 'speechEngineTag')}</span>
              </div>
            )}
          </div>

          {/* 3. Right: Speed Selector & "Xem lời thuyết minh" Link */}
          <div className="player-extra-controls">
            <label htmlFor="selSpeed" className="sr-only">
              {locSpeedLabel}
            </label>
            <select
              className="player-speed-select"
              id="selSpeed"
              value={speed}
              aria-label={locSpeedLabel}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            >
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>

            {/* "Xem lời thuyết minh" link that scrolls to the active chapter's transcript */}
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
