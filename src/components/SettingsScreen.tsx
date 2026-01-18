import { memo } from 'react';

interface SettingsScreenProps {
  visible: boolean;
  sfxMuted: boolean;
  bgmMuted: boolean;
  bgmVolume: number;
  onSFXToggle: () => void;
  onBGMToggle: () => void;
  onBGMVolumeChange: (volume: number) => void;
  onClose: () => void;
}

/**
 * Settings screen with audio controls
 */
export const SettingsScreen = memo(function SettingsScreen({
  visible,
  sfxMuted,
  bgmMuted,
  bgmVolume,
  onSFXToggle,
  onBGMToggle,
  onBGMVolumeChange,
  onClose,
}: SettingsScreenProps) {
  if (!visible) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-screen">
        <h2 className="settings-title">⚙️ Settings</h2>

        <div className="settings-section">
          <h3>Audio</h3>

          {/* SFX Control */}
          <div className="setting-item">
            <label htmlFor="sfx-toggle">
              <span className="setting-icon">🔊</span>
              <span className="setting-label">Sound Effects</span>
            </label>
            <button
              id="sfx-toggle"
              className={`toggle-btn ${sfxMuted ? 'off' : 'on'}`}
              onClick={onSFXToggle}
              aria-label={sfxMuted ? 'Enable SFX' : 'Disable SFX'}
            >
              {sfxMuted ? 'OFF' : 'ON'}
            </button>
          </div>

          {/* BGM Control */}
          <div className="setting-item">
            <label htmlFor="bgm-toggle">
              <span className="setting-icon">🎵</span>
              <span className="setting-label">Background Music</span>
            </label>
            <button
              id="bgm-toggle"
              className={`toggle-btn ${bgmMuted ? 'off' : 'on'}`}
              onClick={onBGMToggle}
              aria-label={bgmMuted ? 'Enable Music' : 'Disable Music'}
            >
              {bgmMuted ? 'OFF' : 'ON'}
            </button>
          </div>

          {/* BGM Volume */}
          <div className="setting-item volume-setting">
            <label htmlFor="bgm-volume-slider">
              <span className="setting-icon">🎚️</span>
              <span className="setting-label">Music Volume</span>
              <span className="volume-value">{Math.round(bgmVolume * 100)}%</span>
            </label>
            <div className="volume-slider-container">
              <input
                id="bgm-volume-slider"
                type="range"
                min="0"
                max="100"
                value={bgmVolume * 100}
                onChange={e => onBGMVolumeChange(parseFloat(e.target.value) / 100)}
                className="volume-slider"
                aria-label="Music Volume"
              />
            </div>
          </div>
        </div>

        <button className="settings-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
});
