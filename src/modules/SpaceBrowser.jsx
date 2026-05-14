import React, { useState } from 'react';
import { Layout, Globe, Search, RefreshCw, Copy, Check, ChevronRight, Briefcase, ExternalLink } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function SpaceBrowser() {
  const { creds, trackRequest, activeSpaceId, setActiveSpaceId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('space-browser');
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog('🔍 Fetching organizations...');
      const data = await client.get('/org/');
      
      const orgsWithSpaces = await Promise.all(data.map(async (org) => {
        try {
          const spaces = await client.get(`/org/${org.org_id}/space/`);
          return { ...org, spaces };
        } catch (e) {
          return { ...org, spaces: [] };
        }
      }));

      setOrgs(orgsWithSpaces);
      addLog(`✅ Loaded ${orgsWithSpaces.length} organizations.`, 'success');
    } catch (err) {
      addLog(`Failed to load spaces: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrgs = orgs.map(org => ({
    ...org,
    spaces: org.spaces.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      String(s.space_id).includes(search)
    )
  })).filter(org => org.spaces.length > 0 || org.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      <h1 className="page-title">Space Browser</h1>
      <p className="page-sub">Discover and explore organizations and workspaces across your Podio account.</p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name or ID..." 
              style={{ paddingLeft: '44px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={fetchOrgs} disabled={loading} style={{ height: '42px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
            {loading ? 'Fetching...' : 'Reload All'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {orgs.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
            <Globe size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-2)', marginBottom: '8px' }}>No spaces loaded</p>
            <p style={{ fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>Reload to fetch all organizations and workspaces linked to your account.</p>
          </div>
        )}

        {filteredOrgs.map(org => (
          <div key={org.org_id} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '4px' }}>
              <Briefcase size={16} color="var(--violet)" />
              <h2 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{org.name}</h2>
              <span className="tag" style={{ fontSize: '10px' }}>ORG {org.org_id}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {org.spaces.map(space => {
                const isActive = String(activeSpaceId) === String(space.space_id);
                return (
                  <div 
                    key={space.space_id} 
                    className="card" 
                    onClick={() => setActiveSpaceId(space.space_id)}
                    style={{ 
                      padding: '16px', 
                      background: isActive ? 'rgba(56,189,248,0.05)' : 'rgba(0,0,0,0.2)', 
                      borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                      transition: 'var(--transition)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: isActive ? 'var(--accent-dim)' : 'var(--surface-2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Layout size={16} color={isActive ? 'var(--accent)' : 'var(--text-3)'} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: isActive ? 'var(--text-1)' : 'var(--text-2)' }}>{space.name}</div>
                          {isActive && <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Selected</div>}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                      <code style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: '"JetBrains Mono", monospace' }}>ID: {space.space_id}</code>
                      <button 
                        onClick={(e) => copyToClipboard(e, space.space_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === space.space_id ? 'var(--success)' : 'var(--text-3)', padding: '4px', display: 'flex', transition: 'var(--transition)' }}
                      >
                        {copiedId === space.space_id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
