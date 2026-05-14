import React, { useState } from 'react';
import { Activity, Clock, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { usePodio } from '../context/PodioContext';

function StatusBadge({ status }) {
  const isOk = status < 300;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
      background: isOk ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color: isOk ? 'var(--success)' : 'var(--error)',
      fontFamily: '"JetBrains Mono", monospace',
      flexShrink: 0,
    }}>
      {status}
    </span>
  );
}

function MethodBadge({ method }) {
  const colors = {
    GET:    { bg: 'rgba(56,189,248,0.12)',  c: 'var(--accent)' },
    POST:   { bg: 'rgba(129,140,248,0.12)', c: 'var(--violet)' },
    PUT:    { bg: 'rgba(245,158,11,0.12)',  c: 'var(--warning)' },
    DELETE: { bg: 'rgba(239,68,68,0.12)',   c: 'var(--error)' },
  };
  const s = colors[method] || { bg: 'rgba(255,255,255,0.1)', c: 'var(--text-2)' };
  return (
    <span style={{ fontSize: '10px', fontWeight: 900, padding: '3px 7px', borderRadius: '5px', background: s.bg, color: s.c, fontFamily: '"JetBrains Mono", monospace', flexShrink: 0 }}>
      {method}
    </span>
  );
}

function RequestDetail({ req }) {
  const [tab, setTab] = useState('response');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <MethodBadge method={req.method} />
          <StatusBadge status={req.status} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>{req.duration}ms</span>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: 'var(--text-2)', wordBreak: 'break-all' }}>
          {req.path}
        </div>
      </div>

      <div className="tabs" style={{ flexShrink: 0 }}>
        {['response', 'meta'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-btn ${tab === t ? 'active' : ''}`} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {tab === 'response' && (
          <pre style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"JetBrains Mono", monospace' }}>
            {JSON.stringify(req.response, null, 2)}
          </pre>
        )}
        {tab === 'meta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              ['Timestamp', new Date(req.timestamp).toLocaleString()],
              ['Duration', `${req.duration} ms`],
              ['Status', req.status],
              ['Method', req.method],
              ['Endpoint', req.path],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', fontSize: '13px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{k}</span>
                <span style={{ wordBreak: 'break-all', fontFamily: typeof v === 'string' && v.startsWith('/') ? '"JetBrains Mono", monospace' : 'inherit', fontSize: '12px' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetworkInspector() {
  const { requestHistory } = usePodio();
  const [selectedId, setSelectedId] = useState(null);

  const selected = requestHistory.find(r => r.id === selectedId);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <h1 className="page-title">Network Inspector</h1>
      <p className="page-sub">Real-time API traffic monitor with full request and response introspection.</p>

      {requestHistory.length === 0 ? (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '24px', borderRadius: '20px' }}>
            <Activity size={48} color="var(--text-3)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>No requests yet</p>
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>API traffic will appear here as you use the tools.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '16px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Request list */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {requestHistory.length} request{requestHistory.length !== 1 ? 's' : ''}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {requestHistory.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedId === req.id ? 'rgba(56,189,248,0.07)' : 'transparent',
                    borderLeft: selectedId === req.id ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                  onMouseEnter={e => { if (selectedId !== req.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (selectedId !== req.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={req.status} />
                    <MethodBadge method={req.method} />
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {req.duration}ms
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"JetBrains Mono", monospace' }}>
                    {req.path}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    {new Date(req.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail pane */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selected ? (
              <RequestDetail req={selected} />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-3)' }}>
                <ExternalLink size={32} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: '14px' }}>Select a request to inspect</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
