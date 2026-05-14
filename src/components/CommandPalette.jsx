import React, { useState, useEffect } from 'react';
import { Search, Command, ChevronRight, Hash } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, tools, onSelect }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = tools.filter(t =>
    t.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) { setQuery(''); setSelectedIdx(0); }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { setSelectedIdx(i => (i + 1) % filtered.length); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setSelectedIdx(i => (i - 1 + filtered.length) % filtered.length); e.preventDefault(); }
    else if (e.key === 'Enter' && filtered[selectedIdx]) { onSelect(filtered[selectedIdx].id); onClose(); }
    else if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease both',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px',
          background: 'rgba(12, 20, 40, 0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        {/* Search row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <Search size={17} color="var(--text-3)" style={{ flexShrink: 0 }} />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search tools..."
            style={{
              border: 'none', background: 'none', flex: 1,
              fontSize: '15px', fontWeight: 500, outline: 'none',
              color: 'var(--text-1)',
            }}
          />
          <kbd style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', padding: '3px 8px', fontSize: '11px',
            color: 'var(--text-3)', fontFamily: 'inherit', flexShrink: 0
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
              <Hash size={24} style={{ opacity: 0.2, marginBottom: '8px' }} />
              <p>No tools match</p>
            </div>
          ) : (
            filtered.map((tool, i) => {
              const isSelected = selectedIdx === i;
              return (
                <div
                  key={tool.id}
                  onClick={() => { onSelect(tool.id); onClose(); }}
                  onMouseEnter={() => setSelectedIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56,189,248,0.1)' : 'transparent',
                    transition: 'background 0.12s ease',
                    marginBottom: '2px',
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                    transition: 'background 0.12s',
                    flexShrink: 0
                  }}>
                    <tool.icon size={14} color={isSelected ? 'var(--accent)' : 'var(--text-2)'} />
                  </div>
                  <span style={{
                    flex: 1, fontSize: '14px', fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--text-1)' : 'var(--text-2)',
                    transition: 'color 0.12s'
                  }}>
                    {tool.label}
                  </span>
                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <kbd style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', color: 'var(--accent)', fontFamily: 'inherit' }}>↵</kbd>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '16px',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Dismiss']].map(([key, hint]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 7px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'inherit' }}>{key}</kbd>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{hint}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
