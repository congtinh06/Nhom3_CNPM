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
  const autoStateText = isAutoEnabled
    ? t(currentLang, 'autoStateOn')
    : t(currentLang, 'autoStateOff');

  return (
    <nav className="nearby-sticky-controlbar" aria-label={t(currentLang, 'toolbarAriaLabel')}>
      <div className="nearby-controlbar-inner nearby-controlbar-pill">
        {/* Auto narration is a single switch: label + state indicator + track */}
        <button
          type="button"
          role="switch"
          aria-checked={isAutoEnabled}
          aria-label={`${locAutoText}: ${autoStateText}`}
          className={`nearby-toggle-switch ${isAutoEnabled ? 'is-on' : ''}`}
          id="chkAuto"
          onClick={onToggleAuto}
        >
          <span className="toggle-track" aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">{locAutoText}</span>
          <span className={`toggle-state ${isAutoEnabled ? 'is-on' : ''}`} aria-hidden="true">
            {autoStateText}
          </span>
        </button>

        <span className="nearby-controlbar-divider" aria-hidden="true" />

        {/* GPS location */}
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
          <LocateFixed size={15} aria-hidden="true" />
          <span>{isLocatingGps ? t(currentLang, 'myLocationLocating') : locMyLocText}</span>
        </button>
      </div>
      {statusMessage && (
        <div className="chapters-status-notice nearby-map-status-line nearby-controlbar-notice" id="status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}
    </nav>
  );
};
