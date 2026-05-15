import React, { useState, useEffect } from 'react';
import { Send, Terminal, Play, Save, History, Trash2, Copy, Check, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';

export default function ApiSandbox() {
  const { creds, trackRequest, trackStorageActivity } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('api-sandbox');
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/item/app/');
  const [body, setBody] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [authOverride, setAuthOverride] = useState(creds.authMethod || 'app');
  const [headers, setHeaders] = useState(null);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('podio_sandbox_history') || '[]'));

  useEffect(() => {
    localStorage.setItem('podio_sandbox_history', JSON.stringify(history));
  }, [history]);

  const executeRequest = async () => {
    if (!endpoint) return;
    setLoading(true);
    setResponse(null);
    setHeaders(null);
    
    const startTime = Date.now();
    addLog(`Executing ${method} ${endpoint}...`, 'info');

    try {
      let parsedBody = null;
      if (['POST', 'PUT'].includes(method)) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          addLog('Invalid JSON body.', 'error');
          setLoading(false);
          return;
        }
      }
      
      addLog(`Using auth method: ${authOverride}`, 'info');
      const client = await createPodioClient(creds, addLog, trackRequest, authOverride, trackStorageActivity);
      
      let res;
      if (method === 'GET') res = await client.get(endpoint);
      else if (method === 'POST') res = await client.post(endpoint, parsedBody);
      else if (method === 'PUT') res = await client.put(endpoint, parsedBody);
      else if (method === 'DELETE') res = await client.delete(endpoint);

      const duration = Date.now() - startTime;
      setResponse(res);
      addLog(`Request completed in ${duration}ms`, 'success');

      // Add to history
      const historyItem = {
        id: Date.now(),
        method,
        endpoint,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));

    } catch (err) {
      addLog(`Request failed: ${err.message}`, 'error');
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    addLog('Copied to clipboard', 'info');
  };

  const clearHistory = () => {
    setHistory([]);
    addLog('History cleared', 'info');
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', height: '100%' }}>
      
      {/* Left Column: Request Builder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--accent-dim)', padding: '8px', borderRadius: '8px' }}>
              <Play size={18} color="var(--accent)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Request Sandbox</h2>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Auth:</span>
              <select 
                value={authOverride}
                onChange={e => setAuthOverride(e.target.value)}
                style={{ width: 'auto', fontSize: '11px', padding: '4px 8px', height: '28px', background: 'var(--surface-2)' }}
              >
                <option value="app">App Auth</option>
                <option value="password">User Auth</option>
                <option value="oauth2">OAuth2</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <select 
              value={method} 
              onChange={e => setMethod(e.target.value)}
              style={{ width: '120px', fontWeight: 800, color: 'var(--accent)' }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input 
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="/endpoint/path..."
              style={{ flex: 1, fontFamily: 'monospace' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={executeRequest} 
              disabled={loading}
              style={{ minWidth: '120px' }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              Execute
            </button>
          </div>

          {['POST', 'PUT'].includes(method) && (
            <div style={{ marginBottom: '20px' }}>
              <div className="label">Request Body (JSON)</div>
              <textarea 
                value={body}
                onChange={e => setBody(e.target.value)}
                style={{ height: '200px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <div className="label">Response Payload</div>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', 
                height: '400px', 
                overflow: 'auto',
                padding: '16px',
                position: 'relative'
              }}>
                {response ? (
                  <>
                    <button 
                      onClick={() => copyToClipboard(response)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Copy JSON"
                    >
                      <Copy size={14} />
                    </button>
                    <pre style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                    {loading ? 'Executing request...' : 'No response data yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: History & Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={18} color="var(--violet)" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Recent History</h3>
            </div>
            <button className="btn btn-ghost" onClick={clearHistory} style={{ padding: '4px' }}>
              <Trash2 size={14} color="var(--error)" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: '13px' }}>
                No recent sandbox requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map(item => (
                  <div 
                    key={item.id} 
                    className="glass" 
                    onClick={() => { setMethod(item.method); setEndpoint(item.endpoint); }}
                    style={{ 
                      padding: '12px', 
                      cursor: 'pointer', 
                      transition: 'var(--transition)',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', background: 'var(--accent-dim)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.method}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.endpoint}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800 }}>Security Notice</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '10px' }}>All requests are executed in the context of your currently authenticated user.</p>
            <p>Destructive actions (DELETE, PUT) will permanently modify your Podio data. Use with caution.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

