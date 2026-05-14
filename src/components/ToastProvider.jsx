import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ── Context ─────────────────────────────────────── */
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: 'var(--success)' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: 'var(--error)' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: 'var(--warning)' },
  info:    { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', icon: 'var(--accent)' },
};

function Toast({ id, type = 'info', title, message, onDismiss }) {
  const Icon   = ICONS[type] || Info;
  const colors = COLORS[type] || COLORS.info;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        minWidth: '300px', maxWidth: '420px',
        animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1) both',
        cursor: 'default',
      }}
    >
      <Icon size={18} color={colors.icon} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)', marginBottom: message ? '2px' : 0 }}>{title}</div>}
        {message && <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.5' }}>{message}</div>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '2px', display: 'flex', flexShrink: 0, transition: 'var(--transition)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Provider ─────────────────────────────────────── */
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    setToasts(p => [...p, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toasts container */}
      <div
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          zIndex: 9999, pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
