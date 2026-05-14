import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, Filter, ChevronDown, Download, FileJson, FileSpreadsheet, RefreshCw, Database, Calendar, Hash, Type, List as ListIcon, Terminal } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import FloatingConsole from '../components/FloatingConsole';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not-equal', label: 'Not Equal' },
  { value: 'greater-than', label: 'Greater Than' },
  { value: 'less-than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
  { value: 'within', label: 'Within (array)' },
  { value: 'starts-with', label: 'Starts With' },
  { value: 'contains', label: 'Contains' },
  { value: 'is-set', label: 'Is Set' },
  { value: 'is-not-set', label: 'Is Not Set' },
];

const TYPE_ICONS = {
  text: Type, number: Hash, date: Calendar, category: ListIcon,
  app: Database, calculation: Hash, money: Hash,
};

function getInitialValue(type) {
  if (['number', 'money', 'calculation', 'progress', 'date'].includes(type)) return { from: '', to: '' };
  if (['category', 'app'].includes(type)) return [];
  return '';
}

function SmartFilterInput({ filter, fieldDef, onChange }) {
  const { type, value } = filter;

  if (type === 'date') return (
    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
      <input type="date" className="input" value={value.from || ''} onChange={e => onChange({ ...value, from: e.target.value })} style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-3)', alignSelf: 'center' }}>—</span>
      <input type="date" className="input" value={value.to || ''} onChange={e => onChange({ ...value, to: e.target.value })} style={{ flex: 1 }} />
    </div>
  );

  if (['number', 'money', 'calculation', 'progress'].includes(type)) return (
    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
      <input type="number" className="input" placeholder="Min" value={value.from || ''} onChange={e => onChange({ ...value, from: e.target.value })} style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-3)', alignSelf: 'center' }}>—</span>
      <input type="number" className="input" placeholder="Max" value={value.to || ''} onChange={e => onChange({ ...value, to: e.target.value })} style={{ flex: 1 }} />
    </div>
  );

  if (type === 'category') {
    const options = fieldDef?.config?.settings?.options || [];
    const selected = Array.isArray(value) ? value : [];
    return (
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', minHeight: '42px' }}>
        {options.map(opt => {
          const isOn = selected.includes(opt.id);
          return (
            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', fontSize: '11px', background: isOn ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)', color: isOn ? 'var(--accent)' : 'var(--text-2)', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${isOn ? 'var(--accent)' : 'transparent'}`, userSelect: 'none' }}>
              <input type="checkbox" checked={isOn} onChange={e => onChange(e.target.checked ? [...selected, opt.id] : selected.filter(id => id !== opt.id))} style={{ display: 'none' }} />
              {opt.text}
            </label>
          );
        })}
        {options.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>No options</span>}
      </div>
    );
  }

  // Default: text / operator-based
  const isNoValue = ['is-set', 'is-not-set'].includes(filter.operator);
  return (
    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
      {filter.useOperator ? (
        <div style={{ position: 'relative', width: '160px', flexShrink: 0 }}>
          <select className="input" value={filter.operator} onChange={e => onChange(value, e.target.value)} style={{ appearance: 'none', paddingRight: '28px', cursor: 'pointer' }}>
            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        </div>
      ) : null}
      <input className="input" style={{ flex: 1, opacity: isNoValue ? 0.4 : 1 }} disabled={isNoValue} placeholder={isNoValue ? '(no value)' : 'Filter value...'} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function buildFilterPayload(filters, schemaFields) {
  const map = {};
  for (const f of filters) {
    const ext = f.external_id || f.field;
    if (!ext) continue;
    const type = f.type || 'text';

    if (['number', 'money', 'calculation', 'progress'].includes(type)) {
      if (f.value?.from || f.value?.to) {
        map[ext] = {};
        if (f.value.from) map[ext].from = Number(f.value.from);
        if (f.value.to) map[ext].to = Number(f.value.to);
      }
    } else if (type === 'date') {
      if (f.value?.from || f.value?.to) {
        map[ext] = {};
        if (f.value.from) map[ext].from = f.value.from;
        if (f.value.to) map[ext].to = f.value.to;
      }
    } else if (['category', 'app'].includes(type)) {
      const arr = Array.isArray(f.value) ? f.value : (typeof f.value === 'string' && f.value ? f.value.split(',').map(v => v.trim()).filter(Boolean) : []);
      if (arr.length) map[ext] = arr.map(Number).filter(n => !isNaN(n));
    } else {
      const val = typeof f.value === 'string' ? f.value.trim() : '';
      if (!val && !['is-set', 'is-not-set'].includes(f.operator)) continue;
      if (f.operator === 'is-set') map[ext] = { from: 1 };
      else if (f.operator === 'is-not-set') map[ext] = { not: true };
      else if (f.operator === 'between') {
        const parts = val.split(',').map(s => s.trim());
        map[ext] = { from: parts[0], to: parts[1] || parts[0] };
      } else if (['within', 'not-within'].includes(f.operator)) {
        const vals = val.split(',').map(s => s.trim()).filter(Boolean);
        map[ext] = f.operator === 'within' ? vals : { not: vals };
      } else if (val) {
        map[ext] = val;
      }
    }
  }
  return map;
}

const extractFieldValue = (fields, externalId) => {
  if (!Array.isArray(fields)) return null;
  const field = fields.find(f => f.external_id === externalId);
  if (!field?.values?.length) return null;
  const v = field.values[0];
  const val = v.value ?? v.text ?? v.label ?? v;
  return typeof val === 'object' ? (val.text || val.label || val.title || JSON.stringify(val)) : val;
};

export default function ViewGetter() {
  const { creds, trackRequest, activeAppId, setActiveAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('view-getter');

  const [appId, setAppId] = useState(activeAppId);
  const [viewId, setViewId] = useState('');
  const [limit, setLimit] = useState('50');
  const [sortBy, setSortBy] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  const [filters, setFilters] = useState([]);
  const [extFields, setExtFields] = useState([]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => { setAppId(activeAppId); setResults(null); setSchema(null); setFilters([]); setDuplicates([]); }, [activeAppId]);

  const loadSchema = async () => {
    if (!appId) { addLog('App ID required.', 'error'); return; }
    setActiveAppId(appId);
    setSchemaLoading(true);
    setSchema(null);
    setFilters([]);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.get(`/app/${appId}`);
      setSchema(data);
      addLog(`✅ Schema loaded: ${data.config.name} (${data.fields.length} fields)`, 'success');
    } catch (e) {
      addLog(`Schema error: ${e.message}`, 'error');
    } finally {
      setSchemaLoading(false);
    }
  };

  const addFilter = () => {
    if (!schema?.fields?.length) return;
    const field = schema.fields[0];
    setFilters(p => [...p, { field_id: field.field_id, external_id: field.external_id, type: field.type, operator: 'equals', value: getInitialValue(field.type), useOperator: field.type === 'text' }]);
  };

  const addManualFilter = () => {
    setFilters(p => [...p, { field: '', type: 'text', operator: 'equals', value: '', useOperator: true }]);
  };

  const changeFilterField = (idx, fieldIdStr) => {
    const field = schema.fields.find(f => f.field_id === parseInt(fieldIdStr, 10));
    if (!field) return;
    setFilters(p => p.map((f, i) => i === idx ? { field_id: field.field_id, external_id: field.external_id, type: field.type, operator: 'equals', value: getInitialValue(field.type), useOperator: field.type === 'text' } : f));
  };

  const updateFilter = (idx, value, operator) => {
    setFilters(p => p.map((f, i) => i === idx ? { ...f, value, ...(operator !== undefined ? { operator } : {}) } : f));
  };

  const run = async (append = false) => {
    if (!appId) { addLog('App ID required.', 'error'); return; }
    setActiveAppId(appId);
    setLoading(true);
    if (!append) { setResults(null); addLog('Running query...'); }
    else addLog(`Loading next page (offset: ${results?.items?.length || 0})...`);

    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const baseUrl = viewId.trim() ? `/item/app/${appId}/filter/${viewId.trim()}/` : `/item/app/${appId}/filter/`;
      const lim = parseInt(limit, 10) || 50;
      const filterMap = buildFilterPayload(filters, schema?.fields || []);
      const body = {
        limit: lim,
        offset: append ? (results?.items?.length || 0) : 0,
        ...(Object.keys(filterMap).length > 0 ? { filters: filterMap } : {}),
        ...(sortBy.trim() ? { sort_by: sortBy.trim(), sort_desc: sortDesc } : {}),
      };

      const page = await client.post(baseUrl, body);
      const total = page.total || 0;
      const ids = extFields.filter(f => f.trim());

      const newItems = (page.items || []).map(item => {
        const row = { item_id: item.item_id, title: item.title };
        if (ids.length) ids.forEach(eid => { row[eid] = extractFieldValue(item.fields, eid); });
        return row;
      });

      const combined = append ? [...(results?.items || []), ...newItems] : newItems;
      setResults({ items: combined, total });
      setDuplicates([]); // Reset on new run
      addLog(`✅ ${append ? 'Page added' : 'Done'}: ${combined.length} of ${total} items.`, 'success');
    } catch (e) {
      addLog(`❌ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicates = () => {
    if (!results?.items?.length) return;
    addLog('Checking for duplicate Item IDs...');
    const counts = {};
    const dups = [];
    results.items.forEach(item => {
      counts[item.item_id] = (counts[item.item_id] || 0) + 1;
    });
    Object.keys(counts).forEach(id => {
      if (counts[id] > 1) dups.push({ id, count: counts[id] });
    });

    setDuplicates(dups);
    if (dups.length === 0) {
      addLog('✅ No duplicate Item IDs found.', 'success');
    } else {
      addLog(`⚠️ Found ${dups.length} duplicate IDs!`, 'warn');
    }
  };

  const toggleExtField = (extId) => {
    if (extFields.includes(extId)) setExtFields(p => p.filter(f => f !== extId));
    else setExtFields(p => [...p, extId]);
  };

  const exportJSON = () => {
    const data = results?.items || [];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `podio_${appId}_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const data = results?.items || [];
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `podio_${appId}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h1 className="page-title">View / Filter & Export</h1>
        <p className="page-sub">Smart schema-aware filtering with pagination, sorting, field extraction, and CSV/JSON export.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left Panel */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px', overflowY: 'auto' }}>

          {/* Target Row */}
          <div>
            <div className="label">Target</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: '10px' }}>
              <div>
                <label className="label" style={{ fontSize: '10px' }}>App ID</label>
                <input className="input" value={appId} onChange={e => setAppId(e.target.value)} placeholder="26202935" onKeyDown={e => e.key === 'Enter' && loadSchema()} />
              </div>
              <div>
                <label className="label" style={{ fontSize: '10px' }}>View ID <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-3)' }}>optional</span></label>
                <input className="input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="50265026" />
              </div>
              <div>
                <label className="label" style={{ fontSize: '10px' }}>Page Size</label>
                <input className="input" type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="50" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={loadSchema} disabled={schemaLoading || !appId} style={{ height: '42px', whiteSpace: 'nowrap' }}>
                  <RefreshCw size={13} className={schemaLoading ? 'spin' : ''} /> {schema ? 'Reload Schema' : 'Load Schema'}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Filter size={12} color="var(--accent)" /> Filters</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {schema && <button className="btn btn-secondary" onClick={addFilter} style={{ padding: '4px 10px', fontSize: '11px' }}><Plus size={12} /> Smart Rule</button>}
                <button className="btn btn-secondary" onClick={addManualFilter} style={{ padding: '4px 10px', fontSize: '11px' }}><Plus size={12} /> Manual Rule</button>
              </div>
            </div>

            {filters.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-3)', padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius)' }}>
                No filters — will fetch all items. {!schema && 'Load Schema for Smart Rules.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filters.map((f, i) => {
                  const FieldIcon = TYPE_ICONS[f.type] || Type;
                  const fieldDef = schema?.fields?.find(sf => sf.field_id === f.field_id);
                  return (
                    <div key={i} className="fade-in" style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                      {f.field_id && schema ? (
                        <div style={{ width: '200px', position: 'relative', flexShrink: 0 }}>
                          <select 
                            className="input" 
                            value={f.field_id} 
                            onChange={e => changeFilterField(i, e.target.value)} 
                            style={{ appearance: 'none', paddingLeft: '30px', cursor: 'pointer' }}
                            title={`Field ID: ${fieldDef?.field_id}\nExternal ID: ${fieldDef?.external_id}`}
                          >
                            {schema.fields.map(sf => (
                              <option key={sf.field_id} value={sf.field_id}>
                                {sf.config.label} ({sf.type})
                              </option>
                            ))}
                          </select>
                          <FieldIcon size={12} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                          <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                        </div>
                      ) : (
                        <input className="input" style={{ width: '200px', flexShrink: 0 }} placeholder="external_id" value={f.field || ''} onChange={e => setFilters(p => p.map((r, j) => j === i ? { ...r, field: e.target.value } : r))} />
                      )}
                      <SmartFilterInput filter={f} fieldDef={fieldDef} onChange={(val, op) => updateFilter(i, val, op)} />
                      <button onClick={() => setFilters(p => p.filter((_, j) => j !== i))} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--error)', borderRadius: 'var(--radius)', cursor: 'pointer', height: '42px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort + Extract */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div className="label">Sort</div>
              <input 
                className="input" 
                style={{ marginBottom: '8px' }} 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)} 
                placeholder="field external_id (optional)" 
                list="sort-options"
              />
              {schema && (
                <datalist id="sort-options">
                  {schema.fields.map(sf => (
                    <option key={sf.field_id} value={sf.external_id}>{sf.config.label}</option>
                  ))}
                </datalist>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[['↓ Desc', true], ['↑ Asc', false]].map(([lbl, val]) => (
                  <button key={String(val)} onClick={() => setSortDesc(val)} style={{ flex: 1, padding: '6px', borderRadius: 'var(--radius)', border: `1px solid ${sortDesc === val ? 'var(--accent)' : 'var(--border)'}`, background: sortDesc === val ? 'var(--accent-dim)' : 'transparent', color: sortDesc === val ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="label" style={{ margin: 0 }}>Extract Fields</div>
                {!schema && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      className="input" 
                      placeholder="external_id" 
                      style={{ height: '28px', fontSize: '11px', width: '120px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          toggleExtField(e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '42px', maxHeight: '150px', overflowY: 'auto' }}>
                {schema ? (
                  schema.fields.map(sf => {
                    const isSelected = extFields.includes(sf.external_id);
                    return (
                      <div 
                        key={sf.field_id} 
                        onClick={() => toggleExtField(sf.external_id)}
                        title={`Field ID: ${sf.field_id}\nExternal ID: ${sf.external_id}`}
                        style={{ 
                          fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                          background: isSelected ? 'var(--accent-dim)' : 'transparent',
                          color: isSelected ? 'var(--accent)' : 'var(--text-3)',
                          transition: 'var(--transition)'
                        }}
                      >
                        {sf.config.label}
                      </div>
                    )
                  })
                ) : (
                  extFields.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Type an external_id and press Enter to add.</span>
                  ) : (
                    extFields.map((f, i) => (
                      <div 
                        key={i} 
                        onClick={() => toggleExtField(f)}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {f} <Trash2 size={10} />
                      </div>
                    ))
                  )
                )}
                {schema && extFields.filter(f => !schema.fields.some(sf => sf.external_id === f)).map((f, i) => (
                  <div 
                    key={`manual-${i}`} 
                    onClick={() => toggleExtField(f)}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {f} <Trash2 size={10} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Run + Export */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => run(false)} disabled={loading} style={{ flex: 1, height: '44px', fontSize: '14px' }}>
              {loading && !results ? <RefreshCw size={15} className="spin" /> : <Eye size={15} />}
              {loading && !results ? 'Querying...' : 'Run Query'}
            </button>
            {results && (
              <div className="fade-in" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={exportJSON} style={{ height: '44px' }}><FileJson size={15} /> JSON</button>
                <button className="btn btn-secondary" onClick={exportCSV} style={{ height: '44px' }}><FileSpreadsheet size={15} /> CSV</button>
              </div>
            )}
          </div>

          {/* Results */}
          {results?.items?.length > 0 && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div className="label" style={{ margin: 0 }}>Results ({results.items.length} of {results.total})</div>
                   <button className="btn btn-secondary" onClick={checkDuplicates} style={{ padding: '2px 10px', fontSize: '10px', border: '1px dashed var(--border)' }}>Check Duplicates</button>
                </div>
                {results.items.length < results.total && (
                  <button className="btn btn-secondary" onClick={() => run(true)} disabled={loading} style={{ padding: '4px 12px', fontSize: '11px' }}>
                    {loading ? <RefreshCw size={11} className="spin" /> : <Plus size={11} />} Load More
                  </button>
                )}
              </div>

              {duplicates.length > 0 && (
                <div className="fade-in" style={{ marginBottom: '10px', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '11px', color: 'var(--error)' }}>
                  ⚠️ <strong>{duplicates.length} Duplicate Item IDs found!</strong>
                  <div style={{ marginTop: '5px', maxHeight: '60px', overflowY: 'auto' }}>
                    {duplicates.map(d => (
                      <div key={d.id}>Item ID #{d.id} appears {d.count} times.</div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: '300px', overflowY: 'auto' }}>
                {results.items.map(item => (
                  <div key={item.item_id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '13px' }}>{item.title}</span>
                      <span style={{ color: 'var(--text-3)', fontFamily: 'monospace', fontSize: '11px' }}>#{item.item_id}</span>
                    </div>
                    {extFields.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {extFields.map(eid => {
                          const val = item[eid];
                          if (val === null || val === undefined || val === '') return null;
                          return (
                            <div key={eid} style={{ fontSize: '11px', display: 'flex', gap: '4px' }}>
                              <span style={{ color: 'var(--accent)', opacity: 0.8 }}>{eid}:</span>
                              <span style={{ color: 'var(--text-2)' }}>{String(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Console */}
        <div style={{ width: '360px', flexShrink: 0 }}>
          <FloatingConsole logs={logs} onClear={clearLogs} title="Query Log" />
        </div>
      </div>
    </div>
  );
}
