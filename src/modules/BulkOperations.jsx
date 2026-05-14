import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit3, Play, AlertTriangle, CheckCircle, RefreshCw, Layers, Clock, Pause, ShieldAlert, Terminal } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import FloatingConsole from '../components/FloatingConsole';

export default function BulkOperations() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('bulk-ops');
  
  const [appId, setAppId] = useState(activeAppId);
  const [operation, setOperation] = useState('delete'); // 'delete' or 'update'
  const [itemIdsRaw, setItemIdsRaw] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [newValue, setNewValue] = useState('');
  
  // Rate limiting & Throttling state
  const [delayMs, setDelayMs] = useState(250);
  const [rateLimit, setRateLimit] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const isPausedRef = useRef(isPaused);
  const rateLimitRef = useRef(rateLimit);

  // Keep refs synced for the async loop
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { rateLimitRef.current = rateLimit; }, [rateLimit]);

  useEffect(() => { setAppId(activeAppId); }, [activeAppId]);

  useEffect(() => {
    const handler = (e) => setRateLimit(e.detail);
    window.addEventListener('podioRateLimit', handler);
    return () => window.removeEventListener('podioRateLimit', handler);
  }, []);

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runBulkAction = async () => {
    const ids = itemIdsRaw.split(/[\s,]+/).filter(id => id.trim()).map(id => id.trim());
    if (!appId) { addLog('App ID is required.', 'error'); return; }
    if (ids.length === 0) { addLog('No Item IDs provided.', 'error'); return; }
    if (operation === 'update' && (!fieldId || !newValue)) { addLog('Field ID and New Value are required for updates.', 'error'); return; }

    const confirmMsg = operation === 'delete' 
      ? `Are you sure you want to PERMANENTLY DELETE ${ids.length} items?`
      : `Are you sure you want to update field "${fieldId}" to "${newValue}" for ${ids.length} items?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActiveAppId(appId);
    setLoading(true);
    setIsPaused(false);
    setProgress({ current: 0, total: ids.length });

    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      
      for (let i = 0; i < ids.length; i++) {
        // 1. Handle user pausing
        while (isPausedRef.current) {
          addLog('⏸️ Operation paused by user. Waiting...', 'warning');
          await wait(2000); // Check every 2 seconds if unpaused
        }

        // 2. Handle API Rate Limit auto-pause
        if (rateLimitRef.current && rateLimitRef.current.remaining < 20) {
          addLog(`🛑 CRITICAL: API Rate limit dangerously low (${rateLimitRef.current.remaining} left). Auto-pausing for 60 seconds to protect account...`, 'error');
          await wait(60000);
        }

        const id = ids[i];
        try {
          if (operation === 'delete') {
            await client.delete(`/item/${id}`);
            addLog(`🗑️ Deleted item ${id} (${i + 1}/${ids.length})`);
          } else {
            await client.put(`/item/${id}/value/${fieldId}`, { value: newValue });
            addLog(`📝 Updated item ${id} (${i + 1}/${ids.length})`);
          }
        } catch (e) {
          addLog(`❌ Failed for item ${id}: ${e.message}`, 'error');
        }
        
        setProgress({ current: i + 1, total: ids.length });
        
        // 3. Apply configurable delay
        if (delayMs > 0 && i < ids.length - 1) {
          await wait(delayMs);
        }
      }
      
      addLog(`✅ Bulk ${operation} complete.`, 'success');
    } catch (err) {
      addLog(`Bulk operation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setIsPaused(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '20px' }}>
        <h1 className="page-title">Bulk Operations</h1>
        <p className="page-sub">Perform rate-limit aware mass actions across multiple items.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px' }}>
        
        {/* Config Panel */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label className="label">Target App ID</label>
            <input className="input" value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 26202935" />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label">Operation Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'delete', label: 'Bulk Delete', icon: Trash2, color: 'var(--error)' },
                { id: 'update', label: 'Bulk Update Field', icon: Edit3, color: 'var(--accent)' }
              ].map(op => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  style={{
                    flex: 1, padding: '16px', borderRadius: 'var(--radius)', border: '1px solid',
                    borderColor: operation === op.id ? op.color : 'var(--border)',
                    background: operation === op.id ? `${op.color}10` : 'rgba(255,255,255,0.02)',
                    color: operation === op.id ? op.color : 'var(--text-2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    fontWeight: 700, transition: 'all 0.2s'
                  }}
                >
                  <op.icon size={18} /> {op.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label">Item IDs (space or comma separated)</label>
            <textarea
              value={itemIdsRaw}
              onChange={e => setItemIdsRaw(e.target.value)}
              placeholder="Paste IDs here: 2660490517, 2660490518, ..."
              style={{ height: '120px', width: '100%', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: '#e2e8f0', padding: '12px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {operation === 'update' && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="label">Field External ID</label>
                <input className="input" value={fieldId} onChange={e => setFieldId(e.target.value)} placeholder="e.g. status" />
              </div>
              <div>
                <label className="label">New Value</label>
                <input className="input" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="e.g. Completed" />
              </div>
            </div>
          )}

          {/* Throttling Config */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--accent)" /> Request Delay (Throttling)
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{delayMs} ms</span>
            </div>
            <input 
              type="range" 
              min="0" max="2000" step="50" 
              value={delayMs} 
              onChange={e => setDelayMs(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
              <span>Fast (Danger)</span>
              <span>Safe (250ms)</span>
              <span>Slow (2s)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary" 
              onClick={runBulkAction} 
              disabled={loading || !itemIdsRaw.trim()} 
              style={{ flex: 1, height: '52px', fontSize: '15px', background: operation === 'delete' ? 'var(--error)' : 'var(--accent)' }}
            >
              {loading ? <RefreshCw size={18} className="spin" /> : (operation === 'delete' ? <Trash2 size={18} /> : <Layers size={18} />)}
              {loading ? `Processing... (${progress.current}/${progress.total})` : `Start Bulk ${operation.charAt(0).toUpperCase() + operation.slice(1)}`}
            </button>
            
            {loading && (
              <button 
                onClick={() => setIsPaused(!isPaused)}
                style={{ width: '52px', height: '52px', borderRadius: 'var(--radius)', border: '1px solid var(--warning)', background: isPaused ? 'var(--warning)' : 'rgba(234,179,8,0.1)', color: isPaused ? '#000' : 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
            )}
          </div>

          {loading && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: isPaused ? 'var(--warning)' : (operation === 'delete' ? 'var(--error)' : 'var(--accent)'), 
                  width: `${(progress.current / progress.total) * 100}%`,
                  transition: 'width 0.3s ease, background 0.3s ease',
                  boxShadow: `0 0 10px ${isPaused ? 'var(--warning)' : (operation === 'delete' ? 'var(--error)' : 'var(--accent)')}80`
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Danger Zone & Logs */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldAlert size={20} color="var(--error)" style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ color: 'var(--error)', margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800 }}>DANGER ZONE</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                  Bulk operations are irreversible. 
                  {operation === 'delete' ? ' Items will be permanently removed from Podio.' : ' Values will be overwritten immediately.'}
                  <br/><br/>
                  <strong style={{ color: 'var(--warning)' }}>Auto-Pause:</strong> If your API rate limit drops below 20, this tool will automatically pause for 60 seconds to protect your account.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <FloatingConsole logs={logs} onClear={clearLogs} title="Operation Logs" />
          </div>
        </div>

      </div>
    </div>
  );
}
