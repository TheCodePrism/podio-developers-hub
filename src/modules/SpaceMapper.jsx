import React, { useState, useEffect } from 'react';
import { Share2, RefreshCw, Box, AlertCircle, Maximize2, ArrowRight } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

/* ... computeLayout, Defs, GraphCanvas (kept from previous implementation) ... */
function computeLayout(nodes) {
  const ids = Object.keys(nodes);
  const N = ids.length;
  const cx = 480, cy = 280;
  const r = Math.min(200, Math.max(100, N * 30));
  const positions = {};
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / N - Math.PI / 2;
    positions[id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return positions;
}

function Defs() {
  return (
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="rgba(129,140,248,0.7)" />
      </marker>
      <marker id="arrowhead-hover" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#818cf8" />
      </marker>
    </defs>
  );
}

function GraphCanvas({ graph }) {
  const NODE_R = 28;
  const [hovered, setHovered] = useState(null);
  const positions = computeLayout(graph.nodes);
  const shortenLine = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x1, y1, x2, y2 };
    const ratio = (len - NODE_R - 4) / len;
    return { x1: x1 + dx * (NODE_R / len), y1: y1 + dy * (NODE_R / len), x2: x1 + dx * ratio, y2: y1 + dy * ratio };
  };
  const hoveredLinks = hovered ? graph.links.filter(l => l.source === hovered || l.target === hovered) : [];
  const hoveredLinkSet = new Set(hoveredLinks.map(l => `${l.source}-${l.target}`));
  return (
    <div style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}>
      <svg viewBox="0 0 960 560" style={{ width: '100%', display: 'block' }}>
        <Defs />
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" /></pattern>
        <rect width="960" height="560" fill="url(#grid)" />
        {graph.links.map((link, i) => {
          const s = positions[link.source], t = positions[link.target];
          if (!s || !t) return null;
          const { x1, y1, x2, y2 } = shortenLine(s.x, s.y, t.x, t.y);
          const key = `${link.source}-${link.target}`, isHighlighted = hoveredLinkSet.has(key);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isHighlighted ? '#818cf8' : 'rgba(129,140,248,0.25)'} strokeWidth={isHighlighted ? 2 : 1} markerEnd={isHighlighted ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'} style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
              {isHighlighted && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="10" fill="#818cf8" fontFamily="JetBrains Mono, monospace">{link.field_label}</text>}
            </g>
          );
        })}
        {Object.values(graph.nodes).map(node => {
          const pos = positions[node.id];
          if (!pos) return null;
          const isHov = hovered === node.id;
          const outDegree = graph.links.filter(l => l.source === node.id).length;
          return (
            <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              {isHov && <circle cx={pos.x} cy={pos.y} r={NODE_R + 10} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.3)" strokeWidth="1" />}
              <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={isHov ? 'rgba(56,189,248,0.2)' : 'rgba(13,22,45,0.95)'} stroke={isHov ? 'var(--accent)' : 'rgba(255,255,255,0.15)'} strokeWidth={isHov ? 2 : 1} style={{ transition: 'all 0.2s' }} />
              <text x={pos.x} y={pos.y - 2} textAnchor="middle" fontSize="10" fontWeight="700" fill={isHov ? '#38bdf8' : '#cbd5e1'} fontFamily="Inter, sans-serif">{node.name.length > 10 ? node.name.slice(0, 9) + '…' : node.name}</text>
              <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize="8.5" fill="rgba(148,163,184,0.6)" fontFamily="JetBrains Mono, monospace">{node.id}</text>
              {outDegree > 0 && <g><circle cx={pos.x + NODE_R - 4} cy={pos.y - NODE_R + 4} r="9" fill="#818cf8" /><text x={pos.x + NODE_R - 4} y={pos.y - NODE_R + 8} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">{outDegree}</text></g>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function SpaceMapper() {
  const { creds, trackRequest, activeSpaceId, setActiveSpaceId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('space-mapper');
  const [spaceId, setSpaceId] = useState(activeSpaceId);
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    setSpaceId(activeSpaceId);
  }, [activeSpaceId]);

  const run = async () => {
    if (!spaceId) { addLog('Space ID is required.', 'error'); return; }
    setActiveSpaceId(spaceId);
    setLoading(true);
    setGraph(null);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog(`🔍 Fetching apps in space ${spaceId}...`);
      const apps = await client.get(`/app/space/${spaceId}/`);
      addLog(`📦 Found ${apps.length} apps. Analysing fields...`);

      const appDetails = await Promise.all(apps.map(app => client.get(`/app/${app.app_id}`)));
      const nodes = {};
      const links = [];

      appDetails.forEach(app => {
        nodes[app.app_id] = { id: app.app_id, name: app.config.name, item_name: app.config.item_name, fields: app.fields.length };
        app.fields.forEach(field => {
          if (field.type === 'app') {
            const refs = field.config?.settings?.referenced_apps || [];
            refs.forEach(ref => {
              if (ref.app_id && (nodes[ref.app_id] !== undefined || apps.find(a => a.app_id === ref.app_id))) {
                links.push({ source: app.app_id, target: ref.app_id, field_label: field.label, field_id: field.external_id });
              }
            });
          }
        });
      });
      setGraph({ nodes, links });
      addLog(`✅ Map generated — ${Object.keys(nodes).length} apps, ${links.length} link(s).`, 'success');
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Space Relationship Map</h1>
      <p className="page-sub">Visualize app-to-app reference dependencies across your workspace.</p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label className="label">Space ID</label>
            <input value={spaceId} onChange={e => setSpaceId(e.target.value)} placeholder="e.g. 4801234" onKeyDown={e => e.key === 'Enter' && run()} />
          </div>
          <button className="btn btn-primary" onClick={run} disabled={loading} style={{ height: '42px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Share2 size={14} />}
            {loading ? 'Mapping…' : 'Generate Map'}
          </button>
        </div>
      </div>

      {graph && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <GraphCanvas graph={graph} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Apps', value: Object.keys(graph.nodes).length, color: 'var(--accent)' },
              { label: 'App References', value: graph.links.length, color: 'var(--violet)' },
              { label: 'Isolated Apps', value: Object.keys(graph.nodes).filter(id => !graph.links.some(l => l.source === id || l.target === id)).length, color: 'var(--text-2)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon" style={{ background: `${color}18` }}><Box size={20} color={color} /></div>
                <div><div className="label" style={{ margin: 0, marginBottom: '4px' }}>{label}</div><div style={{ fontSize: '26px', fontWeight: 900 }}>{value}</div></div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>App Reference Table</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.values(graph.nodes).map(node => {
                const outgoing = graph.links.filter(l => l.source === node.id), incoming = graph.links.filter(l => l.target === node.id);
                return (
                  <div key={node.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{node.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{node.fields} fields · {node.item_name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {outgoing.length > 0 && <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(129,140,248,0.15)', color: 'var(--violet)', padding: '3px 9px', borderRadius: '999px' }}>↗ {outgoing.length} out</span>}
                      {incoming.length > 0 && <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(56,189,248,0.12)', color: 'var(--accent)', padding: '3px 9px', borderRadius: '999px' }}>↙ {incoming.length} in</span>}
                    </div>
                    <code className="tag">{node.id}</code>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
