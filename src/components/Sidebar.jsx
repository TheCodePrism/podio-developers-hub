import React from 'react';
import {
  Settings, Plus, History, Filter, Eye, Zap,
  Search, Globe, Upload, Activity, LayoutDashboard,
  Command, Share2, Layers, Microscope, MessageSquare,
  Map, ChevronDown, Code2, Package, Database
} from 'lucide-react';
import { usePodio } from '../context/PodioContext';
import logoImg from '../assets/logo.png';

const GROUPS = [
  {
    label: 'Overview',
    tools: [
      { id: 'dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
    ],
  },
  {
    label: 'Items',
    tools: [
      { id: 'item-create',      label: 'Item Manager',     icon: Package },
      { id: 'item-inspector',   label: 'Item Inspector',   icon: Microscope },
      { id: 'revision-checker', label: 'Revisions',        icon: History },
      { id: 'comment-manager',  label: 'Comments',         icon: MessageSquare },
      { id: 'bulk-ops',         label: 'Bulk Operations',  icon: Layers },
    ],
  },
  {
    label: 'Query & Export',
    tools: [
      { id: 'view-getter',      label: 'View / Filter',    icon: Filter },
    ],
  },
  {
    label: 'Apps & Spaces',
    tools: [
      { id: 'app-explorer',     label: 'App Explorer',     icon: Search },
      { id: 'app-search',       label: 'App Search',       icon: Zap },
      { id: 'space-browser',    label: 'Space Browser',    icon: Globe },
      { id: 'space-mapper',     label: 'Space Map',        icon: Share2 },
    ],
  },
  {
    label: 'Integrations & Automation',
    tools: [
      { id: 'macro-engine',     label: 'Macro Engine',     icon: Code2 },
      { id: 'data-migrator',    label: 'Data Migrator',    icon: Package },
      { id: 'schema-builder',   label: 'Schema Builder',   icon: Database },
      { id: 'webhook-manager',  label: 'Webhooks',         icon: Globe },
      { id: 'file-uploader',    label: 'File Uploader',    icon: Upload },
    ],
  },
  {
    label: 'Diagnostics',
    tools: [
      { id: 'code-gen',         label: 'Code Generator',    icon: Code2 },
      { id: 'diff-tool',        label: 'Diff Tool',        icon: Layers },
      { id: 'inspector',        label: 'Network Inspector', icon: Activity },
    ],
  },
];

export default function Sidebar({ activeTool, setActiveTool, onOpenConfig }) {
  const { activeSpaceId, activeAppId } = usePodio();

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      height: '100vh',
      overflowY: 'auto',
      background: 'rgba(10,18,38,0.98)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 0 20px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoImg} alt="Podio Hub Logo" style={{
            width: '32px', height: '32px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(56,189,248,0.2)',
            objectFit: 'cover'
          }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '-0.01em', color: 'var(--text-1)' }}>Podio Hub</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Developer Platform</div>
          </div>
        </div>

        {/* Ctrl+K hint */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          style={{ marginTop: '12px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)', color: 'var(--text-3)', fontSize: '11px', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          <Command size={11} />
          <span>Command Palette</span>
          <kbd style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontFamily: 'inherit' }}>⌃K</kbd>
        </button>
      </div>

      {/* Tool groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 4px' }}>
              {group.label}
            </div>
            {group.tools.map(({ id, label, icon: Icon }) => {
              const active = activeTool === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTool(id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: active ? 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.1))' : 'transparent',
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                    fontWeight: active ? 700 : 500,
                    textAlign: 'left',
                    transition: 'var(--transition)',
                    position: 'relative',
                    boxShadow: active ? 'inset 0 0 0 1px rgba(56,189,248,0.2)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
                >
                  {active && (
                    <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: 'var(--accent)', borderRadius: '0 2px 2px 0' }} />
                  )}
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 8px 0', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onOpenConfig}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: 'var(--radius)', border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12.5px', fontFamily: 'inherit', fontWeight: 500, textAlign: 'left', transition: 'var(--transition)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <Settings size={14} />
          Credentials
        </button>
      </div>
    </aside>
  );
}
