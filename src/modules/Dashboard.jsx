import React, { useState, useEffect } from 'react';
import { Activity, Zap, CheckCircle, Clock, ArrowRight, Shield, Terminal, Settings, ExternalLink, Search, ChevronUp, ChevronDown, Filter, Gauge, AlertTriangle, TrendingDown } from 'lucide-react';
import { usePodio } from '../context/PodioContext';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}18` }}>
      <Icon size={22} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div className="label" style={{ margin: 0, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{sub}</div>
    </div>
  </div>
);

const QuickTip = ({ title, desc }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Zap size={14} /> {title}
    </div>
    <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.5' }}>{desc}</div>
  </div>
);

function RateLimitPanel({ rateLimit }) {
  const pct = rateLimit ? Math.round((rateLimit.remaining / rateLimit.limit) * 100) : null;
  const color = pct === null ? 'var(--text-3)' : pct < 20 ? 'var(--error)' : pct < 50 ? 'var(--warning)' : 'var(--success)';
  const label = pct === null ? 'No data yet' : pct < 20 ? 'Critical' : pct < 50 ? 'Warning' : 'Healthy';

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Gauge size={18} color="var(--warning)" />
        <h3 style={{ fontSize: '16px', fontWeight: 800 }}>API Rate Limit</h3>
        {pct !== null && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', background: `${color}18`, color, border: `1px solid ${color}30` }}>
            {label}
          </span>
        )}
      </div>

      {pct === null ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: '13px' }}>
          <Gauge size={28} style={{ opacity: 0.2, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
          Make an API call to see rate limit data.
          
          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'left', fontSize: '11px', lineHeight: '1.4', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={12} /> Browser Security Note
            </div>
            Podio's API restricts these headers in browsers by default. To see live limits, use a <b>CORS Bypass</b> extension for Chrome/Edge.
          </div>
        </div>
      ) : (
        <>
          {/* Big gauge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{rateLimit.remaining}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>of {rateLimit.limit} remaining</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-3)', opacity: 0.5 }}>{pct}%</div>
          </div>

          {/* Progress bar */}
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              width: `${pct}%`,
              background: pct < 20 ? 'var(--error)' : pct < 50 ? 'var(--warning)' : 'var(--success)',
              transition: 'width 0.5s ease, background 0.3s ease',
              boxShadow: `0 0 8px ${color}60`
            }} />
          </div>

          {/* Thresholds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Total Limit', value: rateLimit.limit, color: 'var(--text-2)' },
              { label: 'Used', value: rateLimit.limit - rateLimit.remaining, color: pct < 50 ? 'var(--warning)' : 'var(--text-3)' },
              { label: 'Remaining', value: rateLimit.remaining, color },
            ].map(({ label, value, color: c }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-3)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: c }}>{value}</span>
              </div>
            ))}
          </div>

          {pct < 20 && (
            <div className="fade-in" style={{ marginTop: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--error)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>Rate limit critically low. Slow down or pause bulk operations to avoid being throttled.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { requestHistory, creds, activeAppId, activeSpaceId, rateLimit } = usePodio();
  const [filterQuery, setFilterQuery] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');


  const successCount = requestHistory.filter(r => r.status >= 200 && r.status < 300).length;
  const avgLatency = requestHistory.length > 0 
    ? Math.round(requestHistory.reduce((acc, r) => acc + r.duration, 0) / requestHistory.length) 
    : 0;
  const successRate = requestHistory.length > 0 
    ? Math.round((successCount / requestHistory.length) * 100) 
    : 100;

  const filteredHistory = requestHistory
    .filter(req => 
      req.path.toLowerCase().includes(filterQuery.toLowerCase()) || 
      req.method.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortDir === 'desc') return valB > valA ? 1 : -1;
      return valA > valB ? 1 : -1;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Platform Dashboard</h1>
        <p className="page-sub">Real-time system health and developer activity overview.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard icon={Activity} label="API Success Rate" value={`${successRate}%`} sub={`${successCount} successful requests`} color="var(--success)" />
        <StatCard icon={Clock} label="Average Latency" value={`${avgLatency}ms`} sub="Based on recent traffic" color="var(--accent)" />
        <StatCard icon={Shield} label="Auth Status" value={creds.clientId ? 'Connected' : 'Setup Needed'} sub={creds.authMethod?.toUpperCase() || 'Not Configured'} color={creds.clientId ? 'var(--violet)' : 'var(--warning)'} />
      </div>

      <div className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Rate Limit and Context Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Rate Limit Panel */}
        <RateLimitPanel rateLimit={rateLimit} />

        {/* Active Context */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Settings size={18} color="var(--violet)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Active Context</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(129,140,248,0.05)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid rgba(129,140,248,0.2)' }}>
              <div className="label">Active Space</div>
              <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{activeSpaceId || 'None Selected'}</div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.05)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div className="label">Active App</div>
              <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{activeAppId || 'None Selected'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stream */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '653px' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-dim)', padding: '8px', borderRadius: '8px' }}>
                <Terminal size={18} color="var(--accent)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Activity Stream</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input 
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter path/method..." 
                  style={{ width: '200px', height: '36px', fontSize: '12px', paddingLeft: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}
                />
              </div>
            </div>
          </div>

          {/* Sort Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px', gap: '16px', padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div onClick={() => toggleSort('status')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Status {sortField === 'status' && (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)}</div>
            <div>Endpoint</div>
            <div onClick={() => toggleSort('duration')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Latency {sortField === 'duration' && (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)}</div>
            <div onClick={() => toggleSort('timestamp')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Time {sortField === 'timestamp' && (sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>)}</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '700px' }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                <Activity size={32} style={{ opacity: 0.1, marginBottom: '12px' }} />
                <p>No matching activity detected.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredHistory.map(req => (
                  <div key={req.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px', gap: '16px', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ 
                      width: '40px', height: '24px', borderRadius: '6px', 
                      background: req.status < 300 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 800, color: req.status < 300 ? 'var(--success)' : 'var(--error)',
                      border: `1px solid ${req.status < 300 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {req.status}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', background: 'var(--accent-dim)', padding: '2px 6px', borderRadius: '4px' }}>{req.method}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.path}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: req.duration > 800 ? 'var(--warning)' : 'var(--text-3)', fontWeight: 600 }}>{req.duration}ms</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


          {/* Developer Tips */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px' }}>Developer Tips</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <QuickTip title="Command Palette" desc="Press Ctrl+K from anywhere to instantly switch between diagnostic tools." />
              <QuickTip title="Bulk Operations" desc="Use the Bulk tool to delete test items or update fields across multiple IDs at once." />
              <QuickTip title="Network Inspector" desc="Open the Network tool to see full request/response payloads in real-time." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
