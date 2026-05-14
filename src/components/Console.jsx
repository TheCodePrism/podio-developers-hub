import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, Search as SearchIcon, Copy, CheckCheck } from 'lucide-react';

export default function Console({ logs = [], onClear }) {
  const endRef = useRef(null);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = filter
    ? logs.filter(log => String(log.message).toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const copyAll = () => {
    const text = filteredLogs.map(l =>
      `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`
    ).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  function logColor(type) {
    if (type === 'error')   return '#f87171';
    if (type === 'success') return '#34d399';
    if (type === 'warn')    return '#fbbf24';
    return '#cbd5e1';
  }

  const logCount = {
    error:   logs.filter(l => l.type === 'error').length,
    success: logs.filter(l => l.type === 'success').length,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '320px',
      marginTop: '20px',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      background: 'rgba(4, 8, 18, 0.85)',
    }}>
      {/* Header */}
      <div style={{
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        {/* Terminal dots */}
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
          <Terminal size={12} />
          CONSOLE
          {logCount.error > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '1px 6px', borderRadius: '999px', fontSize: '10px' }}>
              {logCount.error} ERR
            </span>
          )}
          {logCount.success > 0 && (
            <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '999px', fontSize: '10px' }}>
              {logCount.success} OK
            </span>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
          <SearchIcon size={11} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter output..."
            style={{
              padding: '4px 9px 4px 27px',
              fontSize: '11px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '6px',
              height: '26px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          <button onClick={copyAll} title="Copy all logs" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: copied ? 'var(--success)' : 'var(--text-3)', borderRadius: '6px',
            cursor: 'pointer', padding: '4px 9px', display: 'flex', alignItems: 'center',
            gap: '4px', fontSize: '11px', transition: 'color 0.2s'
          }}>
            {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
          </button>
          <button onClick={onClear} title="Clear" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-3)', borderRadius: '6px',
            cursor: 'pointer', padding: '4px 9px', display: 'flex', alignItems: 'center',
            gap: '4px', fontSize: '11px'
          }}>
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Output */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: '12.5px',
        lineHeight: '1.7',
      }}>
        {filteredLogs.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '12px', marginTop: '4px' }}>
            {filter ? 'No logs match your filter...' : 'Output will appear here when you run a request.'}
          </div>
        )}
        {filteredLogs.map((log, i) => (
          <div
            key={log.id || i}
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '2px',
              animation: `fadeIn 0.2s ${Math.min(i * 30, 300)}ms both`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            <span style={{ color: 'var(--text-3)', flexShrink: 0, userSelect: 'none', fontSize: '11px', marginTop: '2px' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ color: logColor(log.type) }}>
              {typeof log.message === 'string' ? log.message : JSON.stringify(log.message, null, 2)}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
