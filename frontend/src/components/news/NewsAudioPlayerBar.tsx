import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { NewsItem } from '../../types/domain';

interface NewsAudioPlayerBarProps {
  currentArticle: NewsItem | null;
  onClose: () => void;
}

function formatMmSs(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export const NewsAudioPlayerBar: React.FC<NewsAudioPlayerBarProps> = ({
  currentArticle,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // When article changes, set up audio
  useEffect(() => {
    if (!currentArticle?.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = new Audio(currentArticle.audioUrl);
    audioRef.current = audio;
    audio.playbackRate = speed;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Explicitly play upon user action (never autoplay without user triggering the article)
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentArticle?.id, currentArticle?.audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = fraction * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  if (!currentArticle || !currentArticle.audioUrl) {
    return null;
  }

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <aside
      className="news-fixed-player"
      role="region"
      aria-label="Trình phát âm thanh bài viết"
    >
      <div className="news-fixed-player__inner">
        {/* Left: Article title & Voice badge */}
        <div className="news-fixed-player__meta">
          <div className="news-fixed-player__badge">
            <Volume2 size={14} className="news-fixed-player__icon" />
            <span>THUYẾT MINH BÀI VIẾT</span>
          </div>
          <p className="news-fixed-player__title" title={currentArticle.title}>
            {currentArticle.title}
          </p>
        </div>

        {/* Center: Play button & Progress bar */}
        <div className="news-fixed-player__controls">
          <button
            type="button"
            className="news-fixed-player__play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Tạm dừng đọc' : 'Tiếp tục đọc'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>

          <div className="news-fixed-player__progress-wrap">
            <div
              className="news-fixed-player__progress-bar"
              role="progressbar"
              aria-label="Tiến độ nghe bài viết"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onClick={handleSeek}
              onKeyDown={(e) => {
                if (!audioRef.current || !duration) return;
                if (e.key === 'ArrowRight') {
                  const t = Math.min(duration, currentTime + 5);
                  audioRef.current.currentTime = t;
                  setCurrentTime(t);
                } else if (e.key === 'ArrowLeft') {
                  const t = Math.max(0, currentTime - 5);
                  audioRef.current.currentTime = t;
                  setCurrentTime(t);
                }
              }}
            >
              <div
                className="news-fixed-player__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span className="news-fixed-player__time">
              {formatMmSs(currentTime)} / {formatMmSs(duration)}
            </span>
          </div>
        </div>

        {/* Right: Speed select & Close */}
        <div className="news-fixed-player__extra">
          <label htmlFor="news-player-speed" className="sr-only">
            Tốc độ đọc
          </label>
          <select
            id="news-player-speed"
            className="news-fixed-player__speed"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            aria-label="Chọn tốc độ đọc"
          >
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>

          <button
            type="button"
            className="news-fixed-player__close-btn"
            onClick={onClose}
            aria-label="Đóng trình phát âm thanh"
            title="Đóng trình phát"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
