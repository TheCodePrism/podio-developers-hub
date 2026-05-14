import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, X, Minus, Maximize2, GripHorizontal, Trash2, Pin, PinOff } from 'lucide-react';

/**
 * FloatingConsole
 * Props:
 *   logs       - array of { text, type, ts } from useModuleLogger
 *   onClear    - function to clear logs
 *   title      - string label shown in the titlebar (default: 'Console')
 *   defaultDocked - boolean, start docked (default: true)
 */
export default function FloatingConsole({ logs = [], onClear, title = 'Console', defaultDocked = true }) {
  const [docked, setDocked] = useState(defaultDocked);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 440, y: 80 });
  const [size, setSize] = useState({ w: 400, h: 380 });

  const panelRef = useRef(null);
  const dragState = useRef(null); // { startX, startY, origX, origY }
  const resizeState = useRef(null); // { startX, startY, origW, origH, edge }

  // ── DRAG ───────────────────────────────────────────────────────
  const onDragStart = useCallback((e) => {
    if (docked) return;
    e.preventDefault();
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

    const onMove = (me) => {
      if (!dragState.current) return;
      const dx = me.clientX - dragState.current.startX;
      const dy = me.clientY - dragState.current.startY;
      setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const onUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [docked, pos]);

  // ── RESIZE ─────────────────────────────────────────────────────
  const onResizeStart = useCallback((e, edge) => {
    if (docked) return;
    e.preventDefault();
    e.stopPropagation();
    resizeState.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h, origX: pos.x, origY: pos.y, edge };

    const onMove = (me) => {
      if (!resizeState.current) return;
      const { startX, startY, origW, origH, origX, origY, edge: ed } = resizeState.current;
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      let newW = origW, newH = origH, newX = origX, newY = origY;

      if (ed.includes('e')) newW = Math.max(280, origW + dx);
      if (ed.includes('w')) { newW = Math.max(280, origW - dx); newX = origX + (origW - newW); }
      if (ed.includes('s')) newH = Math.max(160, origH + dy);
      if (ed.includes('n')) { newH = Math.max(160, origH - dy); newY = origY + (origH - newH); }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      resizeState.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [docked, size, pos]);

  // Undock: position near current right panel area
  const undock = () => {
    setPos({ x: window.innerWidth - size.w - 20, y: 80 });
    setDocked(false);
    setMinimized(false);
  };

  // ── LOG COLOR ──────────────────────────────────────────────────
  const logColor = (type) => {
    if (type === 'error') return '#f87171';
    if (type === 'success') return '#4ade80';
    if (type === 'warn') return '#fbbf24';
    if (type === 'info') return '#60a5fa';
    return 'rgba(255,255,255,0.7)';
  };

  // ── RESIZE HANDLE STYLE ────────────────────────────────────────
  const rh = (cursor, style) => ({
    position: 'absolute', zIndex: 10, ...style,
    cursor,
    background: 'transparent',
  });

  // ── SHARED CONTENT ─────────────────────────────────────────────
  const titleBar = (
    <div
      onMouseDown={onDragStart}
      style={{
        padding: '8px 10px',
        background: 'rgba(10,18,38,0.98)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        cursor: docked ? 'default' : 'grab',
        userSelect: 'none',
        borderRadius: docked ? 0 : 'var(--radius) var(--radius) 0 0',
        flexShrink: 0,
      }}
    >
      {!docked && <GripHorizontal size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />}
      <Terminal size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', flex: 1 }}>{title}</span>

      {/* Log count badge */}
      {logs.length > 0 && (
        <span style={{ fontSize: '10px', background: 'rgba(56,189,248,0.15)', color: 'var(--accent)', borderRadius: '20px', padding: '1px 7px', border: '1px solid rgba(56,189,248,0.2)' }}>
          {logs.length}
        </span>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={onClear} title="Clear logs" style={btnStyle}>
          <Trash2 size={11} />
        </button>
        {docked ? (
          <button onClick={undock} title="Float console" style={btnStyle}>
            <PinOff size={11} />
          </button>
        ) : (
          <>
            <button onClick={() => setMinimized(m => !m)} title="Minimize" style={btnStyle}>
              <Minus size={11} />
            </button>
            <button onClick={() => { setDocked(true); setMinimized(false); }} title="Dock to panel" style={btnStyle}>
              <Pin size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const logBody = (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '10px 12px',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '11px', lineHeight: '1.7',
      background: 'rgba(5, 10, 24, 0.97)',
    }}>
      {logs.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '20px', fontSize: '11px' }}>No logs yet.</div>
      ) : (
        logs.map((log, i) => (
          <div key={log.id || i} style={{ color: logColor(log.type), marginBottom: '2px', wordBreak: 'break-word', display: 'flex', gap: '8px' }}>
            <span style={{ opacity: 0.4, flexShrink: 0, fontSize: '10px', userSelect: 'none' }}>
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span>{typeof log.message === 'string' ? log.message : JSON.stringify(log.message, null, 2)}</span>
          </div>
        ))
      )}
    </div>
  );

  // ── DOCKED MODE ────────────────────────────────────────────────
  if (docked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {titleBar}
        {logBody}
      </div>
    );
  }

  // ── FLOATING MODE ──────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        width: size.w, height: minimized ? 'auto' : size.h,
        zIndex: 9999,
        background: 'rgba(5,10,24,0.97)',
        border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        minWidth: '280px',
      }}
    >
      {/* Resize handles (only when not minimized) */}
      {!minimized && <>
        <div onMouseDown={e => onResizeStart(e, 'n')}  style={rh('n-resize',  { top: 0, left: 4, right: 4, height: 4 })} />
        <div onMouseDown={e => onResizeStart(e, 's')}  style={rh('s-resize',  { bottom: 0, left: 4, right: 4, height: 4 })} />
        <div onMouseDown={e => onResizeStart(e, 'w')}  style={rh('w-resize',  { left: 0, top: 4, bottom: 4, width: 4 })} />
        <div onMouseDown={e => onResizeStart(e, 'e')}  style={rh('e-resize',  { right: 0, top: 4, bottom: 4, width: 4 })} />
        <div onMouseDown={e => onResizeStart(e, 'nw')} style={rh('nw-resize', { top: 0, left: 0, width: 10, height: 10 })} />
        <div onMouseDown={e => onResizeStart(e, 'ne')} style={rh('ne-resize', { top: 0, right: 0, width: 10, height: 10 })} />
        <div onMouseDown={e => onResizeStart(e, 'sw')} style={rh('sw-resize', { bottom: 0, left: 0, width: 10, height: 10 })} />
        <div onMouseDown={e => onResizeStart(e, 'se')} style={rh('se-resize', { bottom: 0, right: 0, width: 10, height: 10 })} />
      </>}

      {titleBar}
      {!minimized && logBody}
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '4px',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  padding: '3px 5px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
};
