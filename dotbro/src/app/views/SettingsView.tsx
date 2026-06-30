import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settings.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Moon, Sun } from '../../components/ui/Icons';
import '../../styles/views/settings.css';

export const SettingsView: React.FC = () => {
  const {
    ollamaStatus,
    availableModels,
    isLoading,
    loadSettings,
    updateSetting,
    checkOllamaStatus,
    loadModels,
    getOllamaUrl,
    getOllamaModel,
    getTheme,
    getFontSize,
    getSenderName,
    getEmergencyPsk,
    getEmergencyPort,
    getEmergencyPeers,
  } = useSettingsStore();

  const [urlInput, setUrlInput] = useState('');
  const [senderName, setSenderName] = useState('');
  const [emergencyPsk, setEmergencyPsk] = useState('');
  const [emergencyPort, setEmergencyPort] = useState('');
  const [emergencyPeers, setEmergencyPeers] = useState('');

  useEffect(() => {
    loadSettings().then(() => {
      setUrlInput(getOllamaUrl());
      setSenderName(getSenderName());
      setEmergencyPsk(getEmergencyPsk());
      setEmergencyPort(getEmergencyPort());
      setEmergencyPeers(getEmergencyPeers());
      checkOllamaStatus();
      loadModels();
    });
  }, [
    loadSettings,
    getOllamaUrl,
    getSenderName,
    getEmergencyPsk,
    getEmergencyPort,
    getEmergencyPeers,
    checkOllamaStatus,
    loadModels,
  ]);

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return;
    await updateSetting('ollama_url', urlInput.trim());
    await checkOllamaStatus();
    await loadModels();
  };

  const handleSenderNameSave = async () => {
    await updateSetting('sender_name', senderName.trim());
  };

  const handleEmergencySave = async () => {
    await updateSetting('emergency_psk', emergencyPsk.trim());
    await updateSetting('emergency_port', emergencyPort.trim());
    await updateSetting('emergency_peers', emergencyPeers.trim());
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateSetting('ollama_model', e.target.value);
  };

  const handleThemeChange = async (theme: 'dark' | 'light') => {
    await updateSetting('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleFontSizeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateSetting('font_size', e.target.value);
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2 className="settings-header__title">Settings</h2>
      </div>

      <div className="settings-content">
        {isLoading ? (
          <div>Loading settings...</div>
        ) : (
          <>
            {/* AI Setup */}
            <div className="settings-section">
              <h3 className="settings-section__title">AI Configuration</h3>
              <div className="settings-row">
                <span className="settings-row__label">Ollama URL</span>
                <span className="settings-row__desc">Local endpoint of your running Ollama server</span>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <Input
                    placeholder="http://localhost:11434"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleUrlSave}>
                    Save
                  </Button>
                </div>
              </div>

              <div className="settings-row">
                <span className="settings-row__label">Status</span>
                <div className="ollama-status-indicator" style={{ marginTop: 'var(--space-1)' }}>
                  <span
                    className={`status-dot ${
                      ollamaStatus?.available ? 'status-dot--success' : 'status-dot--error'
                    }`}
                  />
                  <span>
                    {ollamaStatus?.available
                      ? `Connected (Ollama Version: ${ollamaStatus.version || 'unknown'})`
                      : 'Offline. Make sure Ollama app is launched locally.'}
                  </span>
                </div>
              </div>

              <div className="settings-row">
                <span className="settings-row__label">Active Model</span>
                <span className="settings-row__desc">Select one of the models pulled in Ollama</span>
                <select
                  className="settings-select"
                  value={getOllamaModel()}
                  onChange={handleModelChange}
                  style={{ marginTop: 'var(--space-2)' }}
                  disabled={!ollamaStatus?.available}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB)
                      </option>
                    ))
                  ) : (
                    <option value={getOllamaModel()}>{getOllamaModel()}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Appearance */}
            <div className="settings-section">
              <h3 className="settings-section__title">Appearance</h3>
              <div className="settings-row">
                <span className="settings-row__label">Theme</span>
                <div className="theme-selector" style={{ marginTop: 'var(--space-2)' }}>
                  <button
                    className={`theme-btn ${getTheme() === 'dark' ? 'theme-btn--active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={16} />
                    Dark
                  </button>
                  <button
                    className={`theme-btn ${getTheme() === 'light' ? 'theme-btn--active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={16} />
                    Light
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <span className="settings-row__label">Font Size (px)</span>
                <select
                  className="settings-select"
                  value={getFontSize()}
                  onChange={handleFontSizeChange}
                  style={{ marginTop: 'var(--space-2)', maxWidth: '150px' }}
                >
                  <option value="12">12</option>
                  <option value="13">13</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                  <option value="16">16</option>
                </select>
              </div>
            </div>

            {/* Emergency Secure Line */}
            <div className="settings-section">
              <h3 className="settings-section__title">Emergency Secure Protocol (P2P)</h3>
              
              <div className="settings-row">
                <span className="settings-row__label">Sender Name (Local Identity)</span>
                <span className="settings-row__desc">The name other peers will see when you send messages</span>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <Input
                    placeholder="Ron"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleSenderNameSave}>
                    Save
                  </Button>
                </div>
              </div>

              <div className="settings-row">
                <span className="settings-row__label">Secure Network Key (PSK)</span>
                <span className="settings-row__desc">Shared passphrase for AES-like military end-to-end encrypted packet lines</span>
                <Input
                  type="password"
                  placeholder="Shared secret key..."
                  value={emergencyPsk}
                  onChange={(e) => setEmergencyPsk(e.target.value)}
                  style={{ marginTop: 'var(--space-1)' }}
                />
              </div>

              <div className="settings-row" style={{ marginTop: 'var(--space-2)' }}>
                <span className="settings-row__label">Listener Port</span>
                <span className="settings-row__desc">TCP port local background daemon binds to (requires restart if changed)</span>
                <Input
                  type="number"
                  placeholder="8765"
                  value={emergencyPort}
                  onChange={(e) => setEmergencyPort(e.target.value)}
                  style={{ marginTop: 'var(--space-1)', maxWidth: '120px' }}
                />
              </div>

              <div className="settings-row" style={{ marginTop: 'var(--space-2)' }}>
                <span className="settings-row__label">Peer IP Addresses</span>
                <span className="settings-row__desc">Comma-separated network target list (e.g. 192.168.1.5, 10.0.0.12)</span>
                <Input
                  placeholder="127.0.0.1"
                  value={emergencyPeers}
                  onChange={(e) => setEmergencyPeers(e.target.value)}
                  style={{ marginTop: 'var(--space-1)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <Button variant="primary" onClick={handleEmergencySave}>
                  Save Protocol Configuration
                </Button>
              </div>
            </div>

            {/* About */}
            <div className="settings-section">
              <h3 className="settings-section__title">About</h3>
              <div className="about-info">
                <span className="about-title">DOTBRO / RONVEY</span>
                <span className="about-desc">Privacy-first, offline-first, local-first AI ecosystem</span>
                <span className="about-tech">Built on Tauri 2.0 • React 19 • Rust • SQLite</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SettingsView;
