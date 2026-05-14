import React, { useState, useEffect } from 'react';
import { Plus, Play, Trash2, Edit3, Save } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function ItemCreator() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('item-create');
  const [appId, setAppId] = useState(activeAppId);
  const [itemId, setItemId] = useState('');
  const [operation, setOperation] = useState('create'); // 'create' or 'update'
  const [fields, setFields] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAppId(activeAppId);
  }, [activeAppId]);

  const addField = () => setFields(prev => [...prev, { key: '', value: '' }]);
  const removeField = idx => setFields(prev => prev.filter((_, i) => i !== idx));
  const updateField = (idx, prop, val) =>
    setFields(prev => prev.map((f, i) => (i === idx ? { ...f, [prop]: val } : f)));

  const run = async () => {
    if (operation === 'create' && !appId) { addLog('App ID is required for creation.', 'error'); return; }
    if (operation === 'update' && !itemId) { addLog('Item ID is required for update.', 'error'); return; }
    
    if (appId) setActiveAppId(appId);
    setLoading(true);
    
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const fieldMap = {};
      fields.forEach(({ key, value }) => { if (key.trim()) fieldMap[key.trim()] = value; });

      if (operation === 'create') {
        const data = await client.post(`/item/app/${appId}/`, { fields: fieldMap });
        addLog(`✅ Item created! ID: ${data.item_id}`, 'success');
        setItemId(String(data.item_id));
      } else {
        await client.put(`/item/${itemId}`, { fields: fieldMap });
        addLog(`✅ Item ${itemId} updated successfully.`, 'success');
      }
    } catch (err) {
      addLog(`❌ Operation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">{operation === 'create' ? 'Create Item' : 'Update Item'}</h1>
      <p className="page-sub">
        {operation === 'create' 
          ? 'POST a new item to a Podio app with dynamic field mapping.' 
          : 'PUT updates to an existing Podio item using its ID.'}
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          onClick={() => setOperation('create')}
          className={`btn ${operation === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, height: '40px' }}
        >
          <Plus size={14} /> Create Mode
        </button>
        <button 
          onClick={() => setOperation('update')}
          className={`btn ${operation === 'update' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, height: '40px' }}
        >
          <Edit3 size={14} /> Update Mode
        </button>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: operation === 'update' ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="label">App ID {operation === 'update' && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>}</label>
            <input value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 26202935" onKeyDown={e => e.key === 'Enter' && run()} />
          </div>
          {operation === 'update' && (
            <div className="fade-in">
              <label className="label">Item ID</label>
              <input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="e.g. 2660490517" onKeyDown={e => e.key === 'Enter' && run()} />
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="label" style={{ margin: 0 }}>Fields to {operation === 'create' ? 'Set' : 'Update'}</label>
            <button className="btn btn-secondary" onClick={addField} style={{ padding: '5px 12px', fontSize: '12px' }}>
              <Plus size={13} /> Add Field
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {fields.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                <input value={f.key} onChange={e => updateField(i, 'key', e.target.value)} placeholder="external_id" />
                <input value={f.value} onChange={e => updateField(i, 'value', e.target.value)} placeholder="value" />
                <button
                  onClick={() => removeField(i)}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    color: 'var(--error)', borderRadius: 'var(--radius)', cursor: 'pointer',
                    padding: '0 12px', display: 'flex', alignItems: 'center', transition: 'var(--transition)'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={run} disabled={loading} style={{ width: '100%', height: '48px', fontSize: '15px' }}>
            {operation === 'create' ? <Play size={16} /> : <Save size={16} />}
            {loading ? 'Executing...' : `${operation === 'create' ? 'Create' : 'Update'} Item`}
          </button>
        </div>
      </div>

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
