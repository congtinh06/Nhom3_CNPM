import React, { useState, useRef, useEffect } from 'react';
import { LocateFixed, Settings, Navigation, RotateCcw } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { t, formatDistance, NATIVE_LANG_NAMES } from '../../content/nearbyI18n';

export { NATIVE_LANG_NAMES };

export interface SimStop {
  id: string;
  name: string;
}

interface ToolbarControlsProps {
  myLocationBtnText?: string;
  autoNarrationText?: string;
  radiusLabelText?: string;
  isAutoEnabled: boolean;
  onToggleAuto: () => void;
  onRequestGps: () => void;
  isLocatingGps?: boolean;
  currentLang: SupportedLanguage;
  radius: number;
  overrideRadius?: number | null;
  onChangeOverrideRadius?: (radius: number | null) => void;
  onChangeRadius: (radius: number) => void;
  isSimMode?: boolean;
  simStops?: SimStop[];
  activeSimStopId?: string | null;
  onPickSimStop?: (id: string) => void;
  onApplySimCoords?: (lat: number, lng: number) => void;
  onStopSim?: () => void;
  listenedCount?: number;
  stopsCount?: number;
  onResetProgress?: () => void;
  statusMessage?: React.ReactNode;
}

export const ToolbarControls: React.FC<ToolbarControlsProps> = ({
  myLocationBtnText,
  autoNarrationText,
  radiusLabelText,
  isAutoEnabled,
  onToggleAuto,
  onRequestGps,
  isLocatingGps = false,
  currentLang,
  radius: _radius,
  overrideRadius = null,
  onChangeOverrideRadius,
  onChangeRadius,
  isSimMode = false,
  simStops = [],
  activeSimStopId = null,
  onPickSimStop,
  onApplySimCoords,
  onStopSim,
  listenedCount = 0,
  stopsCount = 5,
  onResetProgress,
  statusMessage,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [simLat, setSimLat] = useState('');
  const [simLng, setSimLng] = useState('');
  const [simError, setSimError] = useState('');
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

  const locAutoText = autoNarrationText || t(currentLang, 'autoNarration');
  const locMyLocText = myLocationBtnText || t(currentLang, 'myLocation');
  const locRadiusLabel = radiusLabelText || t(currentLang, 'radiusLabel');

  const handleApplyCoords = () => {
    const lat = Number.parseFloat(simLat);
    const lng = Number.parseFloat(simLng);
    const latOk = Number.isFinite(lat) && lat >= -90 && lat <= 90;
    const lngOk = Number.isFinite(lng) && lng >= -180 && lng <= 180;
    if (!latOk || !lngOk) {
      setSimError(t(currentLang, 'simInvalidCoord'));
      return;
    }
    onApplySimCoords?.(lat, lng);
    setSimError('');
    setShowSim(false);
    setShowSettings(false);
  };

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

        {/* Right: GPS Location, Simulation Toggle & Settings */}
        <div className="controlbar-action-cluster">
          <button
            className={`nearby-action-btn btn-gps ${isSimMode ? 'is-disabled' : ''}`}
            id="btnGps"
            type="button"
            onClick={onRequestGps}
            disabled={isSimMode || isLocatingGps}
            aria-busy={isLocatingGps}
            aria-label={locMyLocText}
            title={
              isSimMode ? t(currentLang, 'gpsDisabledInSimTitle') : locMyLocText
            }
          >
            <LocateFixed size={16} aria-hidden="true" />
            <span>{isLocatingGps ? t(currentLang, 'myLocationLocating') : locMyLocText}</span>
          </button>

          <div className="settings-wrapper" ref={settingsRef}>
            <button
              type="button"
              className={`nearby-icon-btn ${showSettings ? 'is-active' : ''}`}
              aria-label={t(currentLang, 'settingsBtnTitle')}
              aria-expanded={showSettings}
              onClick={() => setShowSettings((prev) => !prev)}
              title={t(currentLang, 'settingsBtnTitle')}
            >
              <Settings size={17} />
            </button>

            {showSettings && (
              <div className="settings-popover" role="dialog" aria-label={t(currentLang, 'settingsDialogAriaLabel')}>
                <label className="popover-field" htmlFor="selRadius">
                  <span>{locRadiusLabel}</span>
                  <select
                    className="sel-radius-input"
                    id="selRadius"
                    value={overrideRadius !== null ? overrideRadius : 'default'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'default') {
                        onChangeOverrideRadius?.(null);
                        onChangeRadius(50);
                      } else {
                        const parsed = parseInt(val, 10);
                        onChangeOverrideRadius?.(parsed);
                        onChangeRadius(parsed);
                      }
                      setShowSettings(false);
                    }}
                  >
                    <option value="default">{t(currentLang, 'radiusOptionDefault')}</option>
                    <option value={50}>{t(currentLang, 'radiusOption50m')}</option>
                    <option value={100}>{formatDistance(100, currentLang)}</option>
                    <option value={200}>{formatDistance(200, currentLang)}</option>
                    <option value={500}>{formatDistance(500, currentLang)}</option>
                    <option value={1000}>{formatDistance(1000, currentLang)}</option>
                    <option value={2000}>{formatDistance(2000, currentLang)}</option>
                  </select>
                </label>

                {/* Demo tools: location simulation lives here, not in the main control bar */}
                {onPickSimStop && (
                  <div className="popover-demo-section">
                    <div className="popover-demo-title">{t(currentLang, 'demoSection')}</div>
                    <button
                      type="button"
                      className={`nearby-action-btn btn-sim ${isSimMode ? 'is-active' : ''}`}
                      id="btnSim"
                      onClick={() => setShowSim((prev) => !prev)}
                      aria-expanded={showSim}
                      aria-pressed={isSimMode}
                      title={
                        isSimMode
                          ? t(currentLang, 'simModeStopTitle')
                          : t(currentLang, 'simModeStartTitle')
                      }
                    >
                      <Navigation size={15} aria-hidden="true" />
                      <span>
                        {isSimMode ? t(currentLang, 'simModeActive') : t(currentLang, 'simMode')}
                      </span>
                    </button>

                    {showSim && (
                      <div
                        className="sim-popover-inline"
                        role="dialog"
                        aria-label={t(currentLang, 'simPanelTitle')}
                      >
                        {simStops.length > 0 && (
                          <div className="popover-field">
                            <span>{t(currentLang, 'simPickStopLabel')}</span>
                            <div className="sim-stop-list">
                              {simStops.map((stop) => (
                                <button
                                  key={stop.id}
                                  type="button"
                                  className={`sim-stop-item ${activeSimStopId === stop.id ? 'is-active' : ''}`}
                                  onClick={() => {
                                    onPickSimStop(stop.id);
                                    setShowSim(false);
                                    setShowSettings(false);
                                  }}
                                >
                                  {stop.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="popover-field">
                          <span>{t(currentLang, 'simManualLabel')}</span>
                          <div className="sim-coord-row">
                            <input
                              className="sel-radius-input sim-coord-input"
                              type="number"
                              step="any"
                              inputMode="decimal"
                              placeholder={t(currentLang, 'simLatLabel')}
                              aria-label={t(currentLang, 'simLatLabel')}
                              value={simLat}
                              onChange={(e) => {
                                setSimLat(e.target.value);
                                setSimError('');
                              }}
                            />
                            <input
                              className="sel-radius-input sim-coord-input"
                              type="number"
                              step="any"
                              inputMode="decimal"
                              placeholder={t(currentLang, 'simLngLabel')}
                              aria-label={t(currentLang, 'simLngLabel')}
                              value={simLng}
                              onChange={(e) => {
                                setSimLng(e.target.value);
                                setSimError('');
                              }}
                            />
                          </div>
                          {simError && (
                            <p className="sim-coord-error" role="alert">
                              {simError}
                            </p>
                          )}
                          <button
                            type="button"
                            className="btn-reset-progress sim-apply-btn"
                            onClick={handleApplyCoords}
                          >
                            {t(currentLang, 'simApplyBtn')}
                          </button>
                        </div>

                        {isSimMode && onStopSim && (
                          <button
                            type="button"
                            className="btn-reset-progress"
                            onClick={() => {
                              onStopSim();
                              setShowSim(false);
                              setShowSettings(false);
                            }}
                          >
                            {t(currentLang, 'simStopBtn')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress reset option */}
                {onResetProgress && (
                  <div className="popover-progress-section">
                    <div className="progress-info-line">
                      <span>{t(currentLang, 'progressSectionTitle')}</span>
                      <strong>
                        {listenedCount}/{stopsCount}
                      </strong>
                    </div>
                    {listenedCount > 0 && (
                      <button
                        type="button"
                        className="btn-reset-progress"
                        onClick={() => {
                          onResetProgress();
                          setShowSettings(false);
                        }}
                      >
                        <RotateCcw size={13} aria-hidden="true" />
                        <span>{t(currentLang, 'resetProgressBtn')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
