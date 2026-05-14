import React, { useState } from 'react';
import { Search, Globe, RefreshCw, Copy, Check, ExternalLink, Briefcase } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function AppSearch() {
  const { creds, trackRequest, setActiveAppId, activeAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('app-search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const searchApps = async () => {
    if (!query.trim()) { addLog('Search query is required.', 'error'); return; }
    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog(`🔍 Searching for apps matching "${query}"...`);
      
      // Podio search apps endpoint
      const data = await client.get(`/app/search?query=${encodeURIComponent(query)}&limit=20`);
      
      setResults(data);
      addLog(`✅ Found ${data.length} matching app(s).`, 'success');
    } catch (err) {
      addLog(`Search failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectApp = (id) => {
    setActiveAppId(id);
    addLog(`📍 Active App ID set to ${id}`, 'info');
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Global App Search</h1>
      <p className="page-sub">Find applications by name across all organizations and workspaces.</p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Enter app name (e.g. 'Project Management')..." 
              style={{ paddingLeft: '44px' }}
              onKeyDown={e => e.key === 'Enter' && searchApps()}
            />
          </div>
          <button className="btn btn-primary" onClick={searchApps} disabled={loading} style={{ height: '42px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.length === 0 && !loading && query && (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
            <p>No applications found matching "{query}"</p>
          </div>
        )}

        {results.map(app => {
          const isActive = String(activeAppId) === String(app.app_id);
          return (
            <div 
              key={app.app_id} 
              className="card" 
              onClick={() => selectApp(app.app_id)}
              style={{ 
                padding: '16px', 
                background: isActive ? 'rgba(56,189,248,0.05)' : 'rgba(0,0,0,0.2)', 
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                transition: 'var(--transition)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ 
                width: '40px', height: '40px', background: isActive ? 'var(--accent-dim)' : 'var(--surface-2)', 
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <Globe size={20} color={isActive ? 'var(--accent)' : 'var(--text-3)'} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isActive ? 'var(--text-1)' : 'var(--text-2)' }}>
                    {app.config.name}
                  </h3>
                  {isActive && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Briefcase size={12} /> {app.space_name || 'Unknown Workspace'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: '"JetBrains Mono", monospace' }}>{app.app_id}</code>
                  <button 
                    onClick={(e) => copyId(e, app.app_id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === app.app_id ? 'var(--success)' : 'var(--text-3)', padding: '2px', display: 'flex' }}
                  >
                    {copiedId === app.app_id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <a 
                  href={app.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'var(--text-3)', padding: '8px', borderRadius: '8px', transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
