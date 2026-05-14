import React, { useState } from 'react';
import { Columns, ArrowRight, Minus, Plus } from 'lucide-react';
import Console from '../components/Console';

export default function DiffTool() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState(null);

  const compare = () => {
    try {
      const left = JSON.parse(leftJson);
      const right = JSON.parse(rightJson);
      setDiffResult(calculateDiff(left, right));
    } catch (e) {
      alert('Invalid JSON. Please ensure both fields contain valid JSON objects.');
    }
  };

  const calculateDiff = (obj1, obj2) => {
    const diff = {};
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    keys.forEach(key => {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff[key] = {
          before: obj1[key],
          after: obj2[key]
        };
      }
    });
    return diff;
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">JSON Diff Tool</h1>
      <p className="page-sub">Side-by-side object comparison for state tracking.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <label className="label">Base Revision (A)</label>
          <textarea 
            className="fade-in"
            value={leftJson} 
            onChange={e => setLeftJson(e.target.value)} 
            placeholder='{"status": "active"}'
            style={{ width: '100%', height: '240px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
          />
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <label className="label">Compare Revision (B)</label>
          <textarea 
            className="fade-in"
            value={rightJson} 
            onChange={e => setRightJson(e.target.value)} 
            placeholder='{"status": "completed"}'
            style={{ width: '100%', height: '240px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={compare} style={{ width: '100%', justifyContent: 'center', marginBottom: '24px', height: '48px' }}>
        <Columns size={16} /> Compare Revisions
      </button>

      {diffResult && (
        <div className="card fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--accent-dim)', padding: '6px', borderRadius: '8px' }}>
              <Columns size={16} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Comparison Results</h3>
          </div>

          {Object.keys(diffResult).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius)' }}>
              Objects are identical. No changes detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(diffResult).map(([key, val]) => (
                <div key={key} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-1)' }}>{key}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--error)', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '-8px', left: '8px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '0 6px', borderRadius: '4px' }}>OLD</span>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(val.before, null, 2)}</pre>
                    </div>
                    <ArrowRight size={16} color="var(--text-3)" />
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--success)', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '-8px', left: '8px', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '0 6px', borderRadius: '4px' }}>NEW</span>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(val.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
