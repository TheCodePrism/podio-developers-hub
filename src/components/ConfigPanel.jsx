import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, KeyRound, User, Link2, ShieldAlert, Wifi, WifiOff, LogOut, CheckCircle, Loader } from 'lucide-react';
import { getPodioAccessToken } from '../utils/podioAuth';

const STORAGE_KEY = 'podio_hub_credentials';

export function loadCreds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

const AUTH_METHODS = [
  { id: 'app',      label: 'App Auth',    icon: KeyRound, desc: 'App ID + App Token. Scoped, best for single-app scripts.' },
  { id: 'password', label: 'User Auth',   icon: User,     desc: 'Username & password. Full account access.' },
  { id: 'oauth2',   label: 'OAuth2',      icon: Link2,    desc: 'Authorization code flow via browser redirect.' },
];

const APP_FIELDS      = [{ key: 'appId', label: 'App ID', placeholder: 'e.g. 26202935' }, { key: 'appToken', label: 'App Token', placeholder: '32-char token', secret: true }];
const PASSWORD_FIELDS = [{ key: 'username', label: 'Podio Username / Email', placeholder: 'you@example.com' }, { key: 'password', label: 'Password', placeholder: '••••••••', secret: true }];
const OAUTH2_FIELDS   = [{ key: 'oauthRedirectUri', label: 'Redirect URI', placeholder: 'https://localhost' }, { key: 'oauthCode', label: 'Authorization Code', placeholder: 'Paste code after redirect', secret: true }];
const COMMON_FIELDS   = [{ key: 'clientId', label: 'Client ID', placeholder: 'e.g. my-client-id' }, { key: 'clientSecret', label: 'Client Secret', placeholder: '64-char secret', secret: true }];

export default function ConfigPanel({ isOpen, onClose, onSave }) {
  const [creds, setCreds] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [authMethod, setAuthMethod] = useState('app');
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = loadCreds();
      setCreds(saved);
      setAuthMethod(saved.authMethod || 'app');
      setTestStatus(null);
      setTestMessage('');
    }
  }, [isOpen]);

  const update = (key, val) => setCreds(prev => ({ ...prev, [key]: val }));
  const toggleSecret = key => setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    const toSave = { ...creds, authMethod };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    localStorage.removeItem('podio_access_token'); // Clear cache to ensure new settings apply
    onSave(toSave);
    onClose();
  };

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('podio_access_token');
    localStorage.removeItem('podio_access_token_app');
    localStorage.removeItem('podio_access_token_password');
    localStorage.removeItem('podio_access_token_oauth2');
    setCreds({});
    setTestStatus(null);
    setTestMessage('');
    onSave({});
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const token = await getPodioAccessToken({ ...creds, authMethod });
      
      // Select endpoint based on auth method
      // App Auth cannot access /user, it only has access to its own app
      const testUrl = authMethod === 'app' 
        ? `https://api.podio.com/app/${creds.appId}` 
        : 'https://api.podio.com/user';

      const res = await fetch(testUrl, {
        headers: { Authorization: `OAuth2 ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error_description || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTestStatus('ok');
      
      if (authMethod === 'app') {
        setTestMessage(`Connected to App: "${data.config?.name || creds.appId}"`);
      } else {
        setTestMessage(`Connected as ${data.name || data.mail || 'Podio User'}`);
      }
    } catch (err) {
      setTestStatus('fail');
      setTestMessage(err.message);
    }
  };

  if (!isOpen) return null;

  const extraFields = authMethod === 'app' ? APP_FIELDS : authMethod === 'password' ? PASSWORD_FIELDS : OAUTH2_FIELDS;

  const renderField = ({ key, label, placeholder, secret }) => (
    <div key={key}>
      <label className="label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={secret && !showSecrets[key] ? 'password' : 'text'}
          placeholder={placeholder}
          value={creds[key] || ''}
          onChange={e => update(key, e.target.value)}
          style={{ paddingRight: secret ? '44px' : '14px' }}
        />
        {secret && (
          <button
            onClick={() => toggleSecret(key)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
          >
            {showSecrets[key] ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.15s ease both' }}
      onClick={onClose}
    >
      <div
        style={{ width: '520px', background: 'rgba(10, 18, 38, 0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-xl)', padding: '28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>API Credentials</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldAlert size={12} /> Stored locally. Never sent to any server.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-2)', padding: '8px', display: 'flex', transition: 'var(--transition)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Auth method selector */}
        <div style={{ marginBottom: '24px' }}>
          <label className="label">Authentication Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
            {AUTH_METHODS.map(({ id, label, icon: Icon }) => {
              const active = authMethod === id;
              return (
                <button
                  key={id}
                  onClick={() => { setAuthMethod(id); update('authMethod', id); setTestStatus(null); }}
                  style={{
                    padding: '12px 8px', borderRadius: 'var(--radius)', border: '1px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    background: active ? 'var(--accent-dim)' : 'rgba(255,255,255,0.02)',
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px',
                    fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'var(--transition)',
                  }}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px', paddingLeft: '2px' }}>
            {AUTH_METHODS.find(m => m.id === authMethod)?.desc}
          </p>
        </div>

        {/* Common fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {COMMON_FIELDS.map(renderField)}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            {AUTH_METHODS.find(m => m.id === authMethod)?.label}
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Auth-specific fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {extraFields.map(renderField)}

          {authMethod === 'oauth2' && (
            <div>
              <label className="label">Launch Authorization</label>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  const url = `https://podio.com/oauth/authorize?client_id=${creds.clientId || ''}&redirect_uri=${encodeURIComponent(creds.oauthRedirectUri || 'https://localhost')}&response_type=code`;
                  window.open(url, '_blank');
                }}
              >
                <Link2 size={14} /> Open Podio Auth Page →
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                Copy the <code style={{ color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: '4px' }}>code</code> parameter from the redirect URL and paste it above.
              </p>
            </div>
          )}
        </div>

        {/* Test Connection Result */}
        {testStatus && testStatus !== 'testing' && (
          <div className="fade-in" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: '20px',
            background: testStatus === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${testStatus === 'ok' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            {testStatus === 'ok'
              ? <CheckCircle size={16} color="var(--success)" />
              : <WifiOff size={16} color="var(--error)" />}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: testStatus === 'ok' ? 'var(--success)' : 'var(--error)' }}>
                {testStatus === 'ok' ? 'Connection Successful' : 'Connection Failed'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{testMessage}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {/* Left: Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)', borderRadius: 'var(--radius)', cursor: 'pointer',
              padding: '9px 16px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
              transition: 'var(--transition)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <LogOut size={14} /> Sign Out
          </button>

          {/* Right: Test + Save */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
            >
              {testStatus === 'testing'
                ? <Loader size={14} className="spin" />
                : <Wifi size={14} />}
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={14} /> Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
