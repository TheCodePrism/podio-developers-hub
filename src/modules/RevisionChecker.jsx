import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function RevisionChecker() {
  const { creds, trackRequest, activeAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('revision-checker');
  const [itemId, setItemId]     = useState('');
  const [fieldExtId, setFieldExtId] = useState('');
  const [loading, setLoading]   = useState(false);

  const extractFieldValue = (fields, externalId) => {
    if (!Array.isArray(fields)) return null;
    const field = fields.find(f => f.external_id === externalId);
    if (!field || !Array.isArray(field.values) || !field.values.length) return null;
    const v = field.values[0];
    return v.value ?? v.text ?? JSON.stringify(v);
  };

  const run = async () => {
    if (!itemId) { addLog('Item ID is required.', 'error'); return; }
    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data   = await client.get(`/item/${itemId}/revision/`);
      addLog(`📊 ${data.length} revision(s) found.`, 'success');
      for (const rev of data) {
        const ts     = rev.created_on || 'unknown';
        const revNum = rev.revision ?? '?';
        if (!rev.fields) { addLog(`[${ts}] Rev ${revNum}: (no field data)`); continue; }
        if (fieldExtId.trim()) {
          const val = extractFieldValue(rev.fields, fieldExtId.trim());
          addLog(`[${ts}] Rev ${revNum}: ${val !== null ? `"${val}"` : '(no value)'}`);
        } else {
          addLog(`[${ts}] Rev ${revNum}: ${JSON.stringify(rev.fields, null, 2)}`);
        }
      }
      addLog('Done.', 'success');
    } catch (err) {
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Revision Checker</h1>
      <p className="page-sub">Trace every field change across an item's full history.</p>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="label">Item ID</label>
            <input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="e.g. 2660490517" onKeyDown={e => e.key === 'Enter' && run()} />
          </div>
          <div>
            <label className="label">Field External ID
              <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>optional — blank for all</span>
            </label>
            <input value={fieldExtId} onChange={e => setFieldExtId(e.target.value)} placeholder="e.g. h-user-type-2" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading} style={{ width: '100%' }}>
          <History size={14} /> {loading ? 'Fetching History...' : 'Run Analysis'}
        </button>
      </div>
      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
