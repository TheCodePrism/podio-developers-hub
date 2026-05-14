import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Info, Layout, List, Code } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

function FieldRow({ field }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <div style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-3)' }}><ChevronRight size={16} /></div>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>{field.label}</span>
        <code className="tag">{field.external_id}</code>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{field.type}</span>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop: '12px', marginLeft: '26px' }}>
          <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', padding: '12px', fontSize: '12px', overflowX: 'auto', color: 'var(--text-2)', fontFamily: '"JetBrains Mono", monospace' }}>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function AppExplorer() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('app-explorer');
  const [appId, setAppId] = useState(activeAppId);
  const [appData, setAppData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAppId(activeAppId);
  }, [activeAppId]);

  const run = async () => {
    if (!appId) { addLog('App ID is required.', 'error'); return; }
    setActiveAppId(appId);
    setLoading(true);
    setAppData(null);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const [app, views] = await Promise.all([
        client.get(`/app/${appId}`),
        client.get(`/view/app/${appId}/`).catch(() => [])
      ]);
      setAppData({ app, views });
      addLog(`✅ App loaded: "${app.config?.name}"`, 'success');
    } catch (err) {
      addLog(`❌ Load failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [{ id: 'overview', label: 'Overview', icon: Info }, { id: 'fields', label: 'Fields', icon: List }, { id: 'views', label: 'Views', icon: Layout }, { id: 'raw', label: 'Raw JSON', icon: Code }];

  return (
    <div className="fade-in">
      <h1 className="page-title">App Explorer</h1>
      <p className="page-sub">Comprehensive metadata inspection and schema analysis.</p>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label className="label">App ID</label>
            <input value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 26202935" onKeyDown={e => e.key === 'Enter' && run()} />
          </div>
          <button className="btn btn-primary" onClick={run} disabled={loading} style={{ height: '42px' }}>
            {loading ? <ChevronDown size={14} className="spin" /> : <Search size={14} />} 
            {loading ? 'Exploring...' : 'Load App Data'}
          </button>
        </div>
      </div>

      {appData && (
        <div className="card fade-in" style={{ padding: '0', marginBottom: '16px', overflow: 'hidden' }}>
          <div className="tabs">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '24px', maxHeight: '450px', overflowY: 'auto' }}>
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  ['App Name', appData.app.config?.name], ['App ID', appData.app.app_id], ['Item Name', appData.app.config?.item_name], ['Space ID', appData.app.space_id],
                  ['Total Fields', appData.app.fields?.length], ['Saved Views', appData.views?.length], ['Status', appData.app.status], ['Created On', new Date(appData.app.created_on).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>{k}</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-1)' }}>{v ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'fields' && <div className="fade-in">{appData.app.fields?.map(f => <FieldRow key={f.field_id} field={f} />) || <p>No fields defined.</p>}</div>}
            {activeTab === 'views' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {appData.views?.length === 0 && <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '20px' }}>No saved views found.</p>}
                {appData.views?.map(v => (
                  <div key={v.view_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{v.name}</div><div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Type: {v.type}</div></div>
                    <code className="tag">{v.view_id}</code>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'raw' && <pre className="fade-in" style={{ fontSize: '12px', color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"JetBrains Mono", monospace' }}>{JSON.stringify(appData.app, null, 2)}</pre>}
          </div>
        </div>
      )}
      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
