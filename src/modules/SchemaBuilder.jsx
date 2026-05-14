import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, ServerCog, AlertTriangle, Layers, List, Code2, GripVertical, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

const FIELD_TYPE_COLORS = {
  text: '#38bdf8', number: '#a78bfa', date: '#fb923c',
  app: '#34d399', category: '#f472b6', image: '#fbbf24',
  money: '#4ade80', duration: '#60a5fa', calculation: '#f87171',
  embed: '#c084fc', location: '#2dd4bf', contact: '#f97316',
};

function FieldRow({ field, index, onUpdate, onDelete, onMoveUp, onMoveDown, total }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = FIELD_TYPE_COLORS[field.type] || '#94a3b8';
  const isRequired = field.config?.required;
  const isHidden = field.config?.hidden;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
        {/* Drag handle / order */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => onMoveUp(index)} disabled={index === 0}
            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? 'var(--text-3)' : 'var(--text-2)', padding: '1px', lineHeight: 1 }}>
            <ChevronUp size={12} />
          </button>
          <button onClick={() => onMoveDown(index)} disabled={index === total - 1}
            style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'not-allowed' : 'pointer', color: index === total - 1 ? 'var(--text-3)' : 'var(--text-2)', padding: '1px', lineHeight: 1 }}>
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Type badge */}
        <span style={{
          fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px',
          background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}30`,
          flexShrink: 0, fontFamily: 'monospace', letterSpacing: '0.02em'
        }}>{field.type}</span>

        {/* Label */}
        <input
          value={field.config?.label || ''}
          onChange={(e) => onUpdate(index, 'config.label', e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#e2e8f0', fontWeight: 600, fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          placeholder="Field label..."
        />

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => onUpdate(index, 'config.required', !isRequired)}
            title="Toggle Required"
            style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid',
              background: isRequired ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: isRequired ? 'rgba(248,113,113,0.3)' : 'var(--border)',
              color: isRequired ? '#f87171' : 'var(--text-3)',
            }}>REQ</button>
          <button
            onClick={() => onUpdate(index, 'config.hidden', !isHidden)}
            title="Toggle Hidden"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isHidden ? 'var(--warning)' : 'var(--text-3)'
            }}>
            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onDelete(index)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)' }}
            title="Delete field">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded detail row */}
      {expanded && (
        <div style={{ padding: '0 14px 12px 14px', borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label className="label" style={{ marginBottom: '4px', fontSize: '10px' }}>External ID</label>
            <input className="input" value={field.external_id || ''} readOnly style={{ fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', cursor: 'not-allowed' }} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label className="label" style={{ marginBottom: '4px', fontSize: '10px' }}>Field ID</label>
            <input className="input" value={field.field_id || ''} readOnly style={{ fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', cursor: 'not-allowed' }} />
          </div>
          {field.type === 'category' && (
            <div style={{ flex: '1 1 100%' }}>
              <label className="label" style={{ marginBottom: '4px', fontSize: '10px' }}>Category Options (one per line)</label>
              <textarea
                rows={4}
                value={(field.config?.settings?.options || []).map(o => o.text).join('\n')}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter(Boolean).map((text, i) => ({ id: i + 1, text, status: 'active', color: 'DCEEFB' }));
                  onUpdate(index, 'config.settings.options', options);
                }}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: '#e2e8f0', padding: '8px', outline: 'none' }}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchemaBuilder() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('schema-builder');

  const [appId, setAppId] = useState(activeAppId);
  const [appMeta, setAppMeta] = useState(null);
  const [fields, setFields] = useState([]);
  const [mode, setMode] = useState('visual'); // 'visual' | 'json'
  const [schemaJson, setSchemaJson] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (activeAppId && !appId) setAppId(activeAppId); }, [activeAppId]);

  // Sync visual → JSON whenever fields or appMeta changes
  useEffect(() => {
    if (!appMeta) return;
    const payload = { config: appMeta, fields };
    setSchemaJson(JSON.stringify(payload, null, 2));
    setJsonError(null);
  }, [fields, appMeta]);

  const fetchSchema = async () => {
    if (!appId) { addLog('App ID is required.', 'error'); return; }
    setActiveAppId(appId);
    setLoading(true);
    setAppMeta(null);
    setFields([]);

    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog(`Fetching schema for App ${appId}...`, 'info');
      const data = await client.get(`/app/${appId}`);

      setAppMeta({ name: data.config.name, item_name: data.config.item_name, description: data.config.description, icon_id: data.config.icon_id });
      setFields(data.fields.map(f => ({ field_id: f.field_id, type: f.type, external_id: f.external_id, config: f.config })));
      addLog(`✅ Schema loaded — ${data.fields.length} fields.`, 'success');
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback((index, path, value) => {
    setFields(prev => {
      const next = prev.map((f, i) => {
        if (i !== index) return f;
        const clone = JSON.parse(JSON.stringify(f));
        const parts = path.split('.');
        let cur = clone;
        for (let p = 0; p < parts.length - 1; p++) cur = cur[parts[p]];
        cur[parts[parts.length - 1]] = value;
        return clone;
      });
      return next;
    });
  }, []);

  const deleteField = useCallback((index) => {
    if (!window.confirm('Delete this field from the schema? This action will take effect when you deploy.')) return;
    setFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveField = useCallback((index, dir) => {
    setFields(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleJsonChange = (e) => {
    setSchemaJson(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setAppMeta(parsed.config);
      setFields(parsed.fields);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const deploySchema = async () => {
    if (jsonError) { addLog('Cannot deploy: JSON is invalid.', 'error'); return; }
    if (!window.confirm('Deploy these schema changes to the live app?')) return;

    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog(`🚀 Deploying schema to App ${appId}...`, 'info');
      await client.put(`/app/${appId}`, { config: appMeta, fields });
      addLog('✅ Schema deployed successfully!', 'success');
      await fetchSchema();
    } catch (err) {
      addLog(`Deployment Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart, end = e.target.selectionEnd;
      const v = schemaJson.substring(0, s) + '  ' + schemaJson.substring(end);
      setSchemaJson(v);
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; }, 0);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h1 className="page-title">Schema Builder & Deployer</h1>
        <p className="page-sub">Visually edit field configurations and deploy schema changes to any Podio App.</p>
      </div>

      {/* Control Bar */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
        <label className="label" style={{ margin: 0, flexShrink: 0 }}>App ID</label>
        <input
          className="input" value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="e.g. 26202935"
          style={{ width: '140px', height: '36px' }}
          onKeyDown={e => e.key === 'Enter' && fetchSchema()}
        />
        <button className="btn btn-secondary" onClick={fetchSchema} disabled={loading} style={{ height: '36px' }}>
          <RefreshCw size={13} className={loading && !appMeta ? 'spin' : ''} /> Pull Schema
        </button>

        <div style={{ width: '1px', height: '22px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', padding: '3px', gap: '2px' }}>
          {[{ id: 'visual', icon: List }, { id: 'json', icon: Code2 }].map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              style={{ height: '28px', padding: '0 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
                background: mode === id ? 'rgba(56,189,248,0.15)' : 'transparent',
                color: mode === id ? 'var(--accent)' : 'var(--text-3)' }}>
              <Icon size={12} /> {id.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-primary"
          onClick={deploySchema}
          disabled={loading || !appMeta || !!jsonError}
          style={{ height: '36px', background: 'rgba(234,179,8,0.85)', color: '#000', border: 'none', fontWeight: 700 }}>
          {loading && appMeta ? <RefreshCw size={13} className="spin" /> : <ServerCog size={13} />}
          {loading && appMeta ? 'Deploying...' : 'Deploy Changes'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Editor Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* App Meta */}
          {appMeta && (
            <div className="card fade-in" style={{ padding: '14px', marginBottom: '12px', display: 'flex', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label className="label" style={{ fontSize: '10px', marginBottom: '4px' }}>App Name</label>
                <input className="input" value={appMeta.name || ''} onChange={e => setAppMeta(p => ({ ...p, name: e.target.value }))} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label className="label" style={{ fontSize: '10px', marginBottom: '4px' }}>Item Name</label>
                <input className="input" value={appMeta.item_name || ''} onChange={e => setAppMeta(p => ({ ...p, item_name: e.target.value }))} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div style={{ flex: '2 1 260px' }}>
                <label className="label" style={{ fontSize: '10px', marginBottom: '4px' }}>Description</label>
                <input className="input" value={appMeta.description || ''} onChange={e => setAppMeta(p => ({ ...p, description: e.target.value }))} style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>
          )}

          {/* Visual or JSON Mode */}
          {mode === 'visual' ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!appMeta && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
                  <Database size={32} opacity={0.3} />
                  Enter an App ID and click Pull Schema to start editing.
                </div>
              )}
              {fields.map((field, index) => (
                <FieldRow
                  key={field.field_id || index}
                  field={field}
                  index={index}
                  total={fields.length}
                  onUpdate={updateField}
                  onDelete={deleteField}
                  onMoveUp={(i) => moveField(i, -1)}
                  onMoveDown={(i) => moveField(i, 1)}
                />
              ))}
              {appMeta && (
                <div style={{ paddingTop: '4px', paddingBottom: '8px' }}>
                  <div style={{ height: '1px', background: 'var(--border)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={12} /> Field type cannot be changed after creation. Delete and recreate to change type.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: jsonError ? '1px solid rgba(239,68,68,0.5)' : '' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>
                <span>Raw JSON Editor</span>
                {jsonError && <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={11} /> {jsonError}</span>}
              </div>
              <textarea
                value={schemaJson} onChange={handleJsonChange} onKeyDown={handleKeyDown}
                spellCheck="false" disabled={!appMeta}
                style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace', fontSize: '12.5px', lineHeight: '1.6', padding: '16px', outline: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Console */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
            <ServerCog size={13} /> Deployment Logs
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Console logs={logs} onClear={clearLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
