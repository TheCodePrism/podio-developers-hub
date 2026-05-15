import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, Download, Upload, RefreshCw, Database, FileJson, Layers, Palette, Check } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { keys, clear as clearIdb, del as delIdb } from 'idb-keyval';

const THEMES = [
  { id: 'theme-default',     label: 'Default Hub',   bg: '#080f1e', accent: '#38bdf8' },
  { id: 'theme-vscode',      label: 'VS Code Dark',  bg: '#1e1e1e', accent: '#007acc' },
  { id: 'theme-monokai',     label: 'Monokai Pro',   bg: '#272822', accent: '#a6e22e' },
  { id: 'theme-nord',        label: 'Nordic Blue',   bg: '#2e3440', accent: '#88c0d0' },
  { id: 'theme-github-dark', label: 'GitHub Dark',   bg: '#0d1117', accent: '#58a6ff' },
];

export default function StorageManager() {
  const { 
    creds, updateCreds, 
    theme, setTheme, 
    storageHistory, trackStorageActivity 
  } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('storage-manager');

  const [idbKeys, setIdbKeys] = useState([]);
  const [localKeys, setLocalKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem('podio_hub_custom_accent') || '');

  useEffect(() => {
    refreshStorageState();
    if (customAccent) {
      document.documentElement.style.setProperty('--accent', customAccent);
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    trackStorageActivity({ type: 'write', store: 'LocalStorage', key: 'podio_hub_theme', size: newTheme.length });
  };

  const handleAccentChange = (color) => {
    setCustomAccent(color);
    localStorage.setItem('podio_hub_custom_accent', color);
    document.documentElement.style.setProperty('--accent', color);
    trackStorageActivity({ type: 'write', store: 'LocalStorage', key: 'podio_hub_custom_accent', size: color.length });
    addLog(`Accent color updated to ${color}`, 'success');
  };

  const resetAccent = () => {
    setCustomAccent('');
    localStorage.removeItem('podio_hub_custom_accent');
    document.documentElement.style.removeProperty('--accent');
    addLog('Accent color reset to theme default.', 'info');
  };

  const refreshStorageState = async () => {
    setLoading(true);
    try {
      // LocalStorage
      const lsKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('podio_') || key.startsWith('macro_')) {
          let size = new Blob([localStorage.getItem(key)]).size;
          lsKeys.push({ key, size });
        }
      }
      setLocalKeys(lsKeys.sort((a, b) => b.size - a.size));

      // IndexedDB
      const iks = await keys();
      const mappedIks = iks.map(k => ({ key: k, size: 'Cached API Response' }));
      setIdbKeys(mappedIks);
    } catch (e) {
      addLog(`Failed to read storage: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSchemas = async () => {
    try {
      addLog('Clearing cached schemas from IndexedDB...', 'info');
      const iks = await keys();
      const schemaKeys = iks.filter(k => typeof k === 'string' && k.startsWith('podio_schema_'));
      for (const k of schemaKeys) {
        await delIdb(k);
      }
      addLog(`✅ Cleared ${schemaKeys.length} cached schemas!`, 'success');
      refreshStorageState();
    } catch (e) {
      addLog(`❌ Failed: ${e.message}`, 'error');
    }
  };

  const factoryReset = async () => {
    if (!window.confirm('CRITICAL: Are you sure you want to completely wipe ALL local data? This will clear your credentials, themes, and caches. The app will reload.')) return;
    try {
      addLog('☢️ Factory reset initiated. Wiping all data...', 'warning');
      await clearIdb();
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      addLog(`❌ Failed: ${e.message}`, 'error');
    }
  };

  const exportMacros = () => {
    const macros = localStorage.getItem('macro_presets') || '{}';
    const blob = new Blob([macros], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podio_hub_macros_${Date.now()}.json`;
    a.click();
    addLog('✅ Macros exported successfully.', 'success');
  };

  const importMacros = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        localStorage.setItem('macro_presets', JSON.stringify(data));
        addLog('✅ Macros imported successfully.', 'success');
        refreshStorageState();
      } catch (err) {
        addLog(`❌ Import failed: Invalid JSON.`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const clearCredentials = () => {
    if (!window.confirm('Are you sure you want to delete your saved credentials? You will be logged out.')) return;
    localStorage.removeItem('podio_hub_credentials');
    localStorage.removeItem('podio_access_token');
    localStorage.removeItem('podio_access_token_app');
    localStorage.removeItem('podio_access_token_password');
    localStorage.removeItem('podio_access_token_oauth2');
    trackStorageActivity({ type: 'delete', store: 'LocalStorage', key: 'CREDENTIALS', size: 0 });
    updateCreds({});
    addLog('✅ Credentials wiped.', 'success');
    setTimeout(refreshStorageState, 100); // Small delay to ensure state updates
  };


  const formatSize = (bytes) => {
    if (typeof bytes !== 'number') return bytes;
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const SettingRow = ({ icon: Icon, title, desc, action, danger, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          padding: '12px', 
          background: danger ? 'rgba(239,68,68,0.08)' : 'var(--accent-dim)', 
          borderRadius: '12px', 
          color: danger ? 'var(--error)' : 'var(--accent)',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)'}`
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>{title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.4, maxWidth: '280px' }}>{desc}</div>
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: '20px' }}>{action}</div>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-sub">Customize your workspace and manage local data.</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshStorageState} disabled={loading} style={{ padding: '8px 16px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px', overflowY: 'auto' }}>
        
        {/* Appearance Settings */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', marginLeft: '4px' }}>
            Appearance
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Palette size={18} color="var(--accent)" />
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-1)' }}>Interface Theme</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Select a predefined color palette for the application.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    background: t.bg,
                    border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'var(--transition)',
                    transform: theme === t.id ? 'translateY(-2px)' : 'none',
                    boxShadow: theme === t.id ? '0 12px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
                    {theme === t.id && <Check size={16} color="var(--accent)" />}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{t.label}</div>
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>Custom Accent Color</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Override the theme's primary color with your own choice.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="color" 
                  value={customAccent || '#38bdf8'} 
                  onChange={e => handleAccentChange(e.target.value)}
                  style={{ width: '44px', height: '44px', padding: '0', cursor: 'pointer', border: 'none', background: 'transparent', borderRadius: '8px', overflow: 'hidden' }}
                  title="Pick custom color"
                />
                {customAccent && (
                  <button className="btn btn-secondary" onClick={resetAccent} style={{ fontSize: '12px' }}>
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data & Cache Management */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', marginLeft: '4px' }}>
            Data & Cache Management
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            
            <SettingRow 
              icon={FileJson} 
              title="Macro Engine Presets" 
              desc={`You have ${Object.keys(JSON.parse(localStorage.getItem('macro_presets') || '{}')).length} scripts saved locally. Export them to backup or share.`}
              action={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={exportMacros}>
                    <Download size={14} /> Export
                  </button>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Import
                    <input type="file" accept=".json" onChange={importMacros} style={{ display: 'none' }} />
                  </label>
                </div>
              }
            />

            <SettingRow 
              icon={Layers} 
              title="App Schema Cache" 
              desc="We cache API definitions to make the app load instantly and save your rate limits."
              action={
                <button className="btn btn-secondary" onClick={clearSchemas}>
                  Clear Cache
                </button>
              }
            />

            <SettingRow 
              icon={HardDrive} 
              title="API Credentials" 
              desc={creds.clientId ? "Your credentials are securely stored in your browser." : "No credentials found in local storage."}
              danger={true}
              action={
                <button className="btn btn-secondary" onClick={clearCredentials} disabled={!creds.clientId} style={{ color: creds.clientId ? 'var(--error)' : 'var(--text-3)', borderColor: creds.clientId ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
                  <Trash2 size={14} /> Wipe Credentials
                </button>
              }
            />

            <SettingRow 
              icon={Database} 
              title="Factory Reset" 
              desc="Completely wipe all IndexedDB caches, stored requests, and local settings. This action cannot be undone."
              danger={true}
              last={true}
              action={
                <button className="btn btn-secondary" onClick={factoryReset} style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  <Trash2 size={14} /> Wipe Everything
                </button>
              }
            />

          </div>
        </section>

        {/* Developer Inspector */}
        <section>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', marginLeft: '4px' }}>
            Developer Inspector
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '400px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-1)' }}>
                <span>LocalStorage Raw Keys</span>
                <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{localKeys.length} Items</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px' }}>
                {localKeys.map(k => (
                  <div key={k.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.key}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0, marginLeft: '10px' }}>{formatSize(k.size)}</span>
                  </div>
                ))}
                {localKeys.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-3)', padding: '10px' }}>No internal keys found.</div>}
              </div>
            </div>
            
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '400px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-1)' }}>
                <span>IndexedDB Raw Keys</span>
                <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{idbKeys.length} Items</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px' }}>
                {idbKeys.map(k => (
                  <div key={k.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.key}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0, marginLeft: '10px' }}>{k.size}</span>
                  </div>
                ))}
                {idbKeys.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-3)', padding: '10px' }}>Cache is currently empty.</div>}
              </div>
            </div>
          </div>
        </section>

        {/* Live Storage Monitor */}
        <section style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', marginLeft: '4px' }}>
            Live Storage Monitor
          </div>
          <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '300px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontSize: '12px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>Activity Stream</span>
              <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>Last 100 operations</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {storageHistory.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                  No storage activity recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {storageHistory.map(item => (
                    <div key={item.id} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '80px 100px 1fr 80px', 
                      gap: '12px', 
                      padding: '8px 12px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '6px',
                      fontSize: '11px',
                      alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      <span style={{ 
                        fontWeight: 900, 
                        color: item.type === 'write' ? 'var(--success)' : item.type === 'read' ? 'var(--accent)' : 'var(--error)',
                        textTransform: 'uppercase'
                      }}>
                        {item.type}
                      </span>
                      <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{item.store}</span>
                      <span style={{ color: 'var(--text-3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.key}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text-3)' }}>{formatSize(item.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
