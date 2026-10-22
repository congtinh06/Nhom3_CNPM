import React from 'react';
import { LocateFixed } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { t, NATIVE_LANG_NAMES } from '../../content/nearbyI18n';

export { NATIVE_LANG_NAMES };

interface ToolbarControlsProps {
  myLocationBtnText?: string;
  autoNarrationText?: string;
  isAutoEnabled: boolean;
  onToggleAuto: () => void;
  onRequestGps: () => void;
  isLocatingGps?: boolean;
  currentLang: SupportedLanguage;
  statusMessage?: React.ReactNode;
}

export const ToolbarControls: React.FC<ToolbarControlsProps> = ({
  myLocationBtnText,
  autoNarrationText,
  isAutoEnabled,
  onToggleAuto,
  onRequestGps,
  isLocatingGps = false,
  currentLang,
  statusMessage,
}) => {
  const locAutoText = autoNarrationText || t(currentLang, 'autoNarration');
  const locMyLocText = myLocationBtnText || t(currentLang, 'myLocation');

  return (
    <nav className="nearby-sticky-controlbar" aria-label={t(currentLang, 'toolbarAriaLabel')}>
      <div className="nearby-controlbar-inner">
        {/* Left: Auto Narration Toggle + One-line Status */}
        <div className="controlbar-auto-cluster">
          <button
            type="button"
            role="switch"
            aria-checked={isAutoEnabled}
            className={`nearby-toggle-switch ${isAutoEnabled ? 'is-on' : ''}`}
            id="chkAuto"
            onClick={onToggleAuto}
            aria-label={locAutoText}
          >
            <span className="toggle-track" aria-hidden="true">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-text">{locAutoText}</span>
          </button>

          {statusMessage && (
            <div className="controlbar-status-line" role="status" aria-live="polite">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right: GPS Location */}
        <div className="controlbar-action-cluster">
          <button
            className="nearby-action-btn btn-gps"
            id="btnGps"
            type="button"
            onClick={onRequestGps}
            disabled={isLocatingGps}
            aria-busy={isLocatingGps}
            aria-label={locMyLocText}
            title={locMyLocText}
          >
            <LocateFixed size={16} aria-hidden="true" />
            <span>{isLocatingGps ? t(currentLang, 'myLocationLocating') : locMyLocText}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
