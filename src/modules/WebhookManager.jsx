import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Globe, Trash2 } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

const HOOK_TYPES = ['item.create','item.update','item.delete','comment.create','file.create','app.update'];

export default function WebhookManager() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('webhook-manager');
  const [appId, setAppId]     = useState(activeAppId);
  const [webhooks, setWebhooks] = useState([]);
  const [newUrl, setNewUrl]   = useState('');
  const [newType, setNewType] = useState('item.create');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setAppId(activeAppId); }, [activeAppId]);

  const getClient = () => createPodioClient(creds, addLog, trackRequest);

  const listWebhooks = async () => {
    if (!appId) { addLog('App ID is required.', 'error'); return; }
    setActiveAppId(appId);
    setLoading(true);
    try {
      const client = await getClient();
      const data   = await client.get(`/hook/app/${appId}/`);
      setWebhooks(data);
      addLog(`✅ ${data.length} webhook(s) found.`, 'success');
    } catch (err) {} finally { setLoading(false); }
  };

  const createWebhook = async () => {
    if (!newUrl) { addLog('URL is required.', 'error'); return; }
    setLoading(true);
    try {
      const client = await getClient();
      const data   = await client.post(`/hook/app/${appId}/`, { url: newUrl, type: newType });
      addLog(`✅ Hook created: ID ${data.hook_id}`, 'success');
      setNewUrl('');
      await listWebhooks();
    } catch (err) {} finally { setLoading(false); }
  };

  const deleteWebhook = async (hookId) => {
    setLoading(true);
    try {
      const client = await getClient();
      await client.delete(`/hook/${hookId}`);
      addLog(`✅ Deleted ${hookId}.`, 'success');
      setWebhooks(prev => prev.filter(w => w.hook_id !== hookId));
    } catch (err) {} finally { setLoading(false); }
  };

  const verifyWebhook = async (hookId) => {
    setLoading(true);
    try {
      const client = await getClient();
      await client.post(`/hook/${hookId}/verify/request`);
      addLog('✅ Verification sent. Your endpoint will receive a code.', 'success');
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Webhook Manager</h1>
      <p className="page-sub">Create, inspect, verify, and remove Podio automation hooks.</p>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <label className="label">App ID</label>
            <input value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 26202935" onKeyDown={e => e.key === 'Enter' && listWebhooks()} />
          </div>
          <button className="btn btn-secondary" onClick={listWebhooks} disabled={loading} style={{ height: '42px' }}>
            <RefreshCw size={14} /> List Hooks
          </button>
        </div>

        <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <label className="label" style={{ marginBottom: '12px', display: 'block' }}>Create New Hook</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label className="label">Endpoint URL</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Event</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}>
                {HOOK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={createWebhook} disabled={loading} style={{ height: '42px' }}>
              <Plus size={14} /> Create
            </button>
          </div>
        </div>
      </div>

      {webhooks.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            {webhooks.length} hook{webhooks.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {webhooks.map(wh => (
              <div key={wh.hook_id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)' }}>
                <Globe size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{wh.url}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="tag">{wh.type}</span>
                    <span style={{ fontSize: '11px', color: wh.status === 'active' ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{wh.status}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>#{wh.hook_id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => verifyWebhook(wh.hook_id)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px' }}>Verify</button>
                  <button onClick={() => deleteWebhook(wh.hook_id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  ><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
