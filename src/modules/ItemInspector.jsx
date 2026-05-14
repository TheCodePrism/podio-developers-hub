import React, { useState, useEffect } from 'react';
import { Search, Edit3, Save, X, RefreshCw, ChevronDown, ChevronRight, Copy, Check, ExternalLink, Tag, Clock, User } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

/* ── Value renderer ──────────────────────────────── */
function FieldValue({ field }) {
  const v = field.values?.[0];
  if (!v) return <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>empty</span>;

  const raw = v.value ?? v;
  if (typeof raw === 'object') {
    const label = raw.text ?? raw.label ?? raw.title ?? raw.name ?? null;
    if (label) return <span>{label}</span>;
    return <code style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: '"JetBrains Mono", monospace' }}>{JSON.stringify(raw)}</code>;
  }
  return <span>{String(raw)}</span>;
}

/* ── Editable inline field ───────────────────────── */
function EditableField({ field, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    const v = field.values?.[0];
    const raw = v?.value ?? v?.text ?? '';
    setVal(typeof raw === 'object' ? JSON.stringify(raw) : String(raw ?? ''));
    setEditing(true);
  };

  const commit = async () => {
    setSaving(true);
    await onSave(field.external_id, val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      {editing ? (
        <>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
            style={{ flex: 1, fontSize: '13px', padding: '6px 10px' }}
          />
          <button onClick={commit} disabled={saving} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success)', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
            {saving ? <RefreshCw size={13} className="spin" /> : <Save size={13} />}
          </button>
          <button onClick={() => setEditing(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-1)' }}><FieldValue field={field} /></span>
          <button onClick={startEdit} style={{ opacity: 0, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: '6px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center', transition: 'var(--transition)' }}
            className="edit-btn"
          ><Edit3 size={12} /></button>
        </>
      )}
    </div>
  );
}

export default function ItemInspector() {
  const { creds, trackRequest } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('item-inspector');
  const [itemId, setItemId]   = useState('');
  const [item, setItem]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied]   = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  const fetchItem = async () => {
    if (!itemId.trim()) { addLog('Item ID is required.', 'error'); return; }
    setLoading(true);
    setItem(null);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.get(`/item/${itemId.trim()}`);
      setItem(data);
      addLog(`✅ Loaded item: "${data.title}"`, 'success');
    } catch (err) {
      addLog(`❌ ${err.message}`, 'error');
    } finally { setLoading(false); }
  };

  const updateField = async (externalId, value) => {
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      await client.put(`/item/${item.item_id}/value/${externalId}`, { value });
      addLog(`✅ Updated field "${externalId}" → "${value}"`, 'success');
    } catch (err) {
      addLog(`❌ Update failed: ${err.message}`, 'error');
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(item.item_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const FIELD_TYPE_COLORS = {
    text: '#38bdf8', number: '#a78bfa', date: '#fb923c',
    category: '#34d399', contact: '#f472b6', relationship: '#facc15',
    money: '#4ade80', progress: '#38bdf8', image: '#e879f9',
  };

  return (
    <div className="fade-in">
      <style>{`.item-row:hover .edit-btn { opacity: 1 !important; }`}</style>
      <h1 className="page-title">Item Inspector</h1>
      <p className="page-sub">Fetch, inspect, and inline-edit any Podio item by ID.</p>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchItem()}
              placeholder="Enter Item ID..."
              style={{ paddingLeft: '42px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={fetchItem} disabled={loading} style={{ height: '42px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
            {loading ? 'Fetching...' : 'Inspect'}
          </button>
        </div>
      </div>

      {item && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>{item.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="tag"><Tag size={11} /> App {item.app?.app_id}</span>
                  <span className="tag"><Clock size={11} /> Created {new Date(item.created_on).toLocaleDateString()}</span>
                  <span className="tag"><User size={11} /> {item.created_by?.name || 'Unknown'}</span>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="tag" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      <ExternalLink size={11} /> Open in Podio
                    </a>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={copyId} className="btn btn-secondary" style={{ padding: '8px 12px', gap: '6px', fontSize: '12px' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : `ID: ${item.item_id}`}
                </button>
                <button onClick={() => setRawOpen(p => !p)} className="btn btn-secondary" style={{ padding: '8px 12px', gap: '6px', fontSize: '12px' }}>
                  {rawOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Raw JSON
                </button>
              </div>
            </div>

            {rawOpen && (
              <div className="fade-in" style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', overflow: 'auto', maxHeight: '300px' }}>
                <pre style={{ margin: 0, fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-2)' }}>
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Fields card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {item.fields?.length || 0} Fields
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(item.fields || []).map(field => (
                <div
                  key={field.field_id}
                  className="item-row"
                  style={{ display: 'grid', gridTemplateColumns: '200px 80px 1fr', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius)', transition: 'var(--transition)', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>{field.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: '"JetBrains Mono", monospace' }}>{field.external_id}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: FIELD_TYPE_COLORS[field.type] || 'var(--text-3)', background: `${FIELD_TYPE_COLORS[field.type] || 'var(--text-3)'}18`, padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {field.type}
                  </span>
                  <EditableField field={field} onSave={updateField} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <Console logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
}
