import React, { useState, useRef, useEffect } from 'react';
import { LocateFixed, Settings } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../content/languages';

interface ToolbarControlsProps {
  myLocationBtnText: string;
  autoNarrationText: string;
  languageLabelText: string;
  radiusLabelText: string;
  isAutoEnabled: boolean;
  onToggleAuto: () => void;
  onRequestGps: () => void;
  currentLang: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  radius: number;
  onChangeRadius: (radius: number) => void;
}

export const ToolbarControls: React.FC<ToolbarControlsProps> = ({
  myLocationBtnText,
  autoNarrationText,
  languageLabelText,
  radiusLabelText,
  isAutoEnabled,
  onToggleAuto,
  onRequestGps,
  currentLang,
  onChangeLanguage,
  radius,
  onChangeRadius,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className="toolbar-one-row" aria-label="Điều khiển vị trí và thuyết minh">
      <div className="toolbar-content">
        {/* Vị trí của tôi */}
        <button
          className="btn btn-gps"
          id="btnGps"
          type="button"
          onClick={onRequestGps}
          aria-label={myLocationBtnText}
        >
          <LocateFixed size={18} aria-hidden="true" />
          <span>{myLocationBtnText}</span>
        </button>

        {/* Thuyết minh tự động switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isAutoEnabled}
          className={`switch ${isAutoEnabled ? 'on' : ''}`}
          id="chkAuto"
          onClick={onToggleAuto}
          aria-label={autoNarrationText}
        >
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span className="switch-label">{autoNarrationText}</span>
        </button>

        <span className="toolbar-spacer" aria-hidden="true" />

        {/* Ngôn ngữ dropdown */}
        <div className="field-group">
          <label className="field-label" htmlFor="selLang">
            {languageLabelText}
          </label>
          <select
            className="sel"
            id="selLang"
            aria-label={languageLabelText}
            value={currentLang}
            onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
          >
            {SUPPORTED_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Settings Button (Bán kính) */}
        <div className="settings-wrapper" ref={settingsRef}>
          <button
            type="button"
            className={`btn btn-icon ${showSettings ? 'active' : ''}`}
            aria-label="Cài đặt bán kính tìm kiếm"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((prev) => !prev)}
            title="Cài đặt bán kính"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <div className="settings-popover" role="dialog" aria-label="Cài đặt bán kính">
              <label className="popover-field" htmlFor="selRadius">
                <span>{radiusLabelText}</span>
                <select
                  className="sel"
                  id="selRadius"
                  value={radius}
                  onChange={(e) => {
                    onChangeRadius(parseInt(e.target.value, 10));
                    setShowSettings(false);
                  }}
                >
                  <option value={500}>500 m</option>
                  <option value={1000}>1.000 m (1 km)</option>
                  <option value={2000}>2.000 m (2 km)</option>
                  <option value={5000}>5.000 m (5 km)</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
