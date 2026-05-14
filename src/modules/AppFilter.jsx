import React, { useState, useEffect } from 'react';
import { Filter, Plus, Trash2, RefreshCw, Calendar, Hash, Type, List as ListIcon, Database, Clock, Terminal, ChevronDown } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

const TYPE_ICONS = {
  text: Type, number: Hash, date: Calendar, category: ListIcon,
  app: Database, calculation: Hash, money: Hash, duration: Clock
};

export default function AppFilter() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('app-filter');
  
  const [appId, setAppId] = useState(activeAppId);
  const [appSchema, setAppSchema] = useState(null);
  const [filters, setFilters] = useState([]);
  const [limit, setLimit] = useState('30');
  const [loading, setLoading] = useState(false);
  const [fetchingSchema, setFetchingSchema] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => { setAppId(activeAppId); setResults([]); setTotal(0); }, [activeAppId]);

  const loadSchema = async () => {
    if (!appId) { addLog('App ID is required to load schema.', 'error'); return; }
    setActiveAppId(appId);
    setFetchingSchema(true);
    setFilters([]);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.get(`/app/${appId}`);
      setAppSchema(data);
      addLog(`✅ Loaded schema for App: ${data.config.name}`, 'success');
    } catch (err) {
      addLog(`Failed to load schema: ${err.message}`, 'error');
    } finally {
      setFetchingSchema(false);
    }
  };

  const addFilter = () => {
    if (!appSchema || appSchema.fields.length === 0) return;
    const firstField = appSchema.fields[0];
    setFilters(prev => [...prev, { 
      field_id: firstField.field_id, 
      external_id: firstField.external_id,
      type: firstField.type,
      value: getInitialValueForType(firstField.type)
    }]);
  };

  const removeFilter = idx => setFilters(prev => prev.filter((_, i) => i !== idx));

  const changeFilterField = (idx, fieldIdStr) => {
    const fieldId = parseInt(fieldIdStr, 10);
    const field = appSchema.fields.find(f => f.field_id === fieldId);
    if (!field) return;
    
    setFilters(prev => prev.map((f, i) => i === idx ? {
      field_id: field.field_id,
      external_id: field.external_id,
      type: field.type,
      value: getInitialValueForType(field.type)
    } : f));
  };

  const updateFilterValue = (idx, val) => {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, value: val } : f));
  };

  const getInitialValueForType = (type) => {
    if (type === 'number' || type === 'money' || type === 'calculation' || type === 'progress') return { from: '', to: '' };
    if (type === 'date') return { from: '', to: '' };
    if (type === 'category' || type === 'app') return [];
    return ''; // text, default
  };

  const runFilter = async (append = false) => {
    if (!appId) { addLog('App ID is required.', 'error'); return; }
    
    // Build filter map according to Podio API format
    const filterMap = {};
    for (const f of filters) {
      if (f.type === 'number' || f.type === 'money' || f.type === 'calculation' || f.type === 'progress') {
        if (f.value.from || f.value.to) {
          filterMap[f.external_id] = {};
          if (f.value.from) filterMap[f.external_id].from = Number(f.value.from);
          if (f.value.to) filterMap[f.external_id].to = Number(f.value.to);
        }
      } else if (f.type === 'date') {
        if (f.value.from || f.value.to) {
          filterMap[f.external_id] = {};
          if (f.value.from) filterMap[f.external_id].from = f.value.from;
          if (f.value.to) filterMap[f.external_id].to = f.value.to;
        }
      } else if (f.type === 'category' || f.type === 'app') {
        if (Array.isArray(f.value) && f.value.length > 0) {
          filterMap[f.external_id] = f.value.map(Number);
        } else if (typeof f.value === 'string' && f.value.trim()) {
          filterMap[f.external_id] = f.value.split(',').map(v => Number(v.trim())).filter(n => !isNaN(n));
        }
      } else {
        if (f.value.trim()) {
          filterMap[f.external_id] = f.value.trim();
        }
      }
    }

    setLoading(true);
    if (!append) {
      addLog(`Running fresh query with ${Object.keys(filterMap).length} filter(s)...`);
      setResults([]);
    } else {
      addLog(`Fetching next page (offset: ${results.length})...`);
    }
    
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const curLimit = parseInt(limit, 10) || 30;
      const data = await client.post(`/item/app/${appId}/filter/`, { 
        filters: filterMap, 
        limit: curLimit,
        offset: append ? results.length : 0
      });
      
      const newItems = data.items.map(i => ({ item_id: i.item_id, title: i.title, link: i.link }));
      setResults(prev => append ? [...prev, ...newItems] : newItems);
      setTotal(data.total);
      
      addLog(`✅ ${append ? 'Page loaded' : 'SUCCESS'}: ${data.total} total match(es). Showing ${append ? results.length + data.items.length : data.items.length}.`, 'success');
      
    } catch (err) {
      addLog(`❌ Query failed: ${err.message}`, 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const renderFilterInput = (f, idx) => {
    const fieldDef = appSchema.fields.find(schemaField => schemaField.field_id === f.field_id);
    
    if (f.type === 'number' || f.type === 'money' || f.type === 'calculation' || f.type === 'progress') {
      return (
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input type="number" className="input" placeholder="Min" value={f.value.from} onChange={e => updateFilterValue(idx, { ...f.value, from: e.target.value })} style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>-</span>
          <input type="number" className="input" placeholder="Max" value={f.value.to} onChange={e => updateFilterValue(idx, { ...f.value, to: e.target.value })} style={{ flex: 1 }} />
        </div>
      );
    }
    
    if (f.type === 'date') {
      return (
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input type="date" className="input" value={f.value.from} onChange={e => updateFilterValue(idx, { ...f.value, from: e.target.value })} style={{ flex: 1 }} />
          <span style={{ color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>-</span>
          <input type="date" className="input" value={f.value.to} onChange={e => updateFilterValue(idx, { ...f.value, to: e.target.value })} style={{ flex: 1 }} />
        </div>
      );
    }
    
    if (f.type === 'category') {
      const options = fieldDef?.config?.settings?.options || [];
      return (
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', maxHeight: '80px', overflowY: 'auto' }}>
          {options.map(opt => {
            const isSelected = f.value.includes(opt.id);
            return (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: isSelected ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)', color: isSelected ? 'var(--accent)' : 'var(--text-2)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}` }}>
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) updateFilterValue(idx, [...f.value, opt.id]);
                    else updateFilterValue(idx, f.value.filter(id => id !== opt.id));
                  }}
                  style={{ display: 'none' }}
                />
                {opt.text}
              </label>
            );
          })}
          {options.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>No options found</span>}
        </div>
      );
    }
    
    // Default Text
    return (
      <input className="input" style={{ flex: 1 }} placeholder="Contains text..." value={f.value} onChange={e => updateFilterValue(idx, e.target.value)} />
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '20px' }}>
        <h1 className="page-title">Smart App Filter</h1>
        <p className="page-sub">Build type-aware queries with intelligent structured formatting for the `/filter/` endpoint.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px' }}>
        
        {/* Left Column: Filter Builder */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label className="label">App ID</label>
              <input className="input" value={appId} onChange={e => setAppId(e.target.value)} placeholder="e.g. 26202935" onKeyDown={e => e.key === 'Enter' && loadSchema()} />
            </div>
            <div>
              <label className="label">&nbsp;</label>
              <button className="btn btn-secondary" onClick={loadSchema} disabled={fetchingSchema || !appId} style={{ height: '42px' }}>
                <RefreshCw size={14} className={fetchingSchema ? 'spin' : ''} /> {appSchema ? 'Reload Schema' : 'Load Schema'}
              </button>
            </div>
          </div>

          {!appSchema ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '40px' }}>
              <Database size={32} opacity={0.3} style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>Load an App Schema to build filters.</p>
            </div>
          ) : (
            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label className="label" style={{ margin: 0 }}>Active Filters</label>
                <button className="btn btn-secondary" onClick={addFilter} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={13} /> Add Rule
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', marginBottom: '24px' }}>
                {filters.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
                    No filters applied. Running query will fetch all items.
                  </div>
                ) : (
                  filters.map((f, i) => {
                    const FieldIcon = TYPE_ICONS[f.type] || Type;
                    return (
                      <div key={i} className="fade-in" style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                        
                        {/* Field Selector */}
                        <div style={{ width: '220px', position: 'relative' }}>
                          <select 
                            className="input" 
                            value={f.field_id} 
                            onChange={e => changeFilterField(i, e.target.value)}
                            style={{ paddingLeft: '32px', cursor: 'pointer', appearance: 'none' }}
                          >
                            {appSchema.fields.map(schemaField => (
                              <option key={schemaField.field_id} value={schemaField.field_id}>
                                {schemaField.config.label} ({schemaField.type})
                              </option>
                            ))}
                          </select>
                          <FieldIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                        </div>

                        {/* Smart Input */}
                        {renderFilterInput(f, i)}

                        {/* Remove */}
                        <button onClick={() => removeFilter(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', borderRadius: 'var(--radius)', cursor: 'pointer', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Limit Results</label>
                  <input className="input" type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="30" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={() => runFilter(false)} disabled={loading} style={{ width: '100%', height: '42px', fontSize: '14px' }}>
                    {loading ? <RefreshCw size={16} className="spin" /> : <Filter size={16} />}
                    {loading ? 'Querying...' : 'Execute Filter Query'}
                  </button>
                </div>
              </div>

              {results.length > 0 && (
                <div className="fade-in" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="label" style={{ margin: 0 }}>Results Preview ({results.length} of {total})</label>
                    {results.length < total && (
                      <button className="btn btn-secondary" onClick={() => runFilter(true)} disabled={loading} style={{ padding: '4px 12px', fontSize: '11px' }}>
                        {loading ? <RefreshCw size={12} className="spin" /> : <Plus size={12} />} Load More
                      </button>
                    )}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto' }}>
                    {results.map(item => (
                      <div key={item.item_id} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.title}</span>
                        <span style={{ color: 'var(--text-3)', fontSize: '11px', fontFamily: 'monospace' }}>#{item.item_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Console */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
            <Terminal size={14} /> Query Results Logs
          </div>
          <div style={{ flex: 1, height: '100%', minHeight: 0 }}>
             <Console logs={logs} onClear={clearLogs} />
          </div>
        </div>

      </div>
    </div>
  );
}
