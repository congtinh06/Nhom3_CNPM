import React from 'react';
import { Play, Pause } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { LANG_DISPLAY_NAMES } from '../../hooks/useNearbyAudio';

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
  showTranscript: boolean;
  notice: string;
  noticeWarn: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onChangeSpeed: (spd: number) => void;
  onToggleTranscript: () => void;
  resolveAudio: (poi: GeoPoi) => {
    hasAudioInLang: boolean;
    actualLang: SupportedLanguage;
    actualTxLang: SupportedLanguage;
    text: string;
  };
  getPoiName: (poi: GeoPoi) => string;
  noPoiSelectedText: string;
  playingInLangText: (langName: string) => string;
  pausedStatusText: string;
  clickToStartText: string;
  speedLabelText: string;
  viewTextBtnText: string;
  hideTextBtnText: string;
  fallbackTxNoticeText: (langName: string) => string;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  activePoi,
  currentLang,
  isPlaying,
  currentTime,
  duration,
  speed,
  showTranscript,
  notice,
  noticeWarn,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
  onToggleTranscript,
  resolveAudio,
  getPoiName,
  noPoiSelectedText,
  playingInLangText,
  pausedStatusText,
  clickToStartText,
  speedLabelText,
  viewTextBtnText,
  hideTextBtnText,
  fallbackTxNoticeText,
}) => {
  // Hide if no POI has been chosen yet
  if (!activePoi) {
    return null;
  }

  const audioInfo = resolveAudio(activePoi);
  const poiName = getPoiName(activePoi);
  const currentLangDisplayName = LANG_DISPLAY_NAMES[currentLang]?.[currentLang] || currentLang;

  const statusSubText =
    notice ||
    (isPlaying
      ? playingInLangText(currentLangDisplayName)
      : currentTime > 0
      ? pausedStatusText
      : clickToStartText);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <footer className="player sticky-mini-player" aria-label="Trình phát thuyết minh du lịch">
      <div className="p-in player-inner">
        {/* Transcript drawer */}
        {showTranscript && (
          <div className="tx transcript-box" id="tx" role="region" aria-label="Văn bản thuyết minh">
            <p className="transcript-content">{audioInfo.text}</p>
            {audioInfo.actualTxLang !== currentLang && (
              <small className="transcript-fallback-notice">
                {fallbackTxNoticeText(currentLangDisplayName)}
              </small>
            )}
          </div>
        )}

        <div className="p-row player-row">
          {/* Info: POI Title & Substatus */}
          <div className="player-meta-block">
            <div className="p-title player-poi-title" id="pTitle">
              {poiName || noPoiSelectedText}
            </div>
            <div
              className={`p-sub player-status-sub ${noticeWarn ? 'warn is-warning' : ''}`}
              id="pSub"
            >
              {statusSubText}
            </div>
          </div>

          {/* Controls: Play/Pause, Progress Bar, Duration */}
          <div className="p-mid player-controls-mid">
            <button
              className="pp player-play-btn"
              id="pPlay"
              type="button"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={onTogglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </button>

            <div
              className="bar player-progress-bar"
              id="pBar"
              role="progressbar"
              aria-label="Tiến trình phát âm thanh"
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
              <i
                id="pFill"
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="time player-time-display" id="pTime">
              {formatMmSs(currentTime)} / {formatMmSs(duration)}
            </span>
          </div>

          {/* Right Controls: Speed and Transcript */}
          <div className="p-r player-extra-controls">
            <label htmlFor="selSpeed" className="sr-only">
              {speedLabelText}
            </label>
            <select
              className="sel player-speed-select"
              id="selSpeed"
              value={speed}
              aria-label={speedLabelText}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
            </select>

            <button
              className="btn btn-transcript"
              id="btnTx"
              type="button"
              aria-pressed={showTranscript}
              onClick={onToggleTranscript}
            >
              {showTranscript ? hideTextBtnText : viewTextBtnText}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
