import React, { useState, useEffect } from 'react';
import { PodioProvider, usePodio } from './context/PodioContext';
import Sidebar from './components/Sidebar';
import ConfigPanel, { loadCreds } from './components/ConfigPanel';
import { ToastProvider, useToast } from './components/ToastProvider';
import ItemCreator from './modules/ItemCreator';
import RevisionChecker from './modules/RevisionChecker';
import ViewGetter from './modules/ViewGetter';
import AppExplorer from './modules/AppExplorer';
import WebhookManager from './modules/WebhookManager';
import FileUploader from './modules/FileUploader';
import Dashboard from './modules/Dashboard';
import DiffTool from './modules/DiffTool';
import SpaceMapper from './modules/SpaceMapper';
import SpaceBrowser from './modules/SpaceBrowser';
import BulkOperations from './modules/BulkOperations';
import AppSearch from './modules/AppSearch';
import ItemInspector from './modules/ItemInspector';
import CommentManager from './modules/CommentManager';
import CodeGenerator from './modules/CodeGenerator';
import MacroEngine from './modules/MacroEngine';
import DataMigrator from './modules/DataMigrator';
import SchemaBuilder from './modules/SchemaBuilder';
import NetworkInspector from './components/NetworkInspector';
import CommandPalette from './components/CommandPalette';
import StorageManager from './modules/StorageManager';
import ApiSandbox from './modules/ApiSandbox';
import {
  LayoutDashboard, Plus, History, Filter, Eye,
  Search, Globe, Upload, Columns, Activity, Share2,
  X, Layers, Microscope, MessageSquare, Code2, Package, Database,
  Terminal
} from 'lucide-react';

const MODULES = {
  'dashboard':        Dashboard,
  'item-create':      ItemCreator,
  'revision-checker': RevisionChecker,
  'view-getter':      ViewGetter,
  'app-explorer':     AppExplorer,
  'webhook-manager':  WebhookManager,
  'file-uploader':    FileUploader,
  'diff-tool':        DiffTool,
  'space-mapper':     SpaceMapper,
  'space-browser':    SpaceBrowser,
  'bulk-ops':         BulkOperations,
  'app-search':       AppSearch,
  'item-inspector':   ItemInspector,
  'comment-manager':  CommentManager,
  'code-gen':         CodeGenerator,
  'macro-engine':     MacroEngine,
  'data-migrator':    DataMigrator,
  'schema-builder':   SchemaBuilder,
  'inspector':        NetworkInspector,
  'storage-manager':  StorageManager,
  'api-sandbox':      ApiSandbox,
};

const ALL_TOOLS = [
  { id: 'dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'item-create',      label: 'Item Manager',     icon: Package },
  { id: 'revision-checker', label: 'Revision Checker', icon: History },
  { id: 'view-getter',      label: 'View / Filter',    icon: Filter },
  { id: 'app-explorer',     label: 'App Explorer',     icon: Search },
  { id: 'webhook-manager',  label: 'Webhooks',         icon: Globe },
  { id: 'file-uploader',    label: 'File Uploader',    icon: Upload },
  { id: 'diff-tool',        label: 'Diff Tool',        icon: Columns },
  { id: 'space-mapper',     label: 'Space Map',         icon: Share2 },
  { id: 'space-browser',    label: 'Space Browser',     icon: Globe },
  { id: 'app-search',       label: 'App Search',        icon: Search },
  { id: 'item-inspector',   label: 'Item Inspector',    icon: Microscope },
  { id: 'comment-manager',  label: 'Comments',          icon: MessageSquare },
  { id: 'code-gen',         label: 'Code Generator',    icon: Code2 },
  { id: 'macro-engine',     label: 'Macro Engine',      icon: Code2 },
  { id: 'data-migrator',    label: 'Data Migrator',     icon: Package },
  { id: 'schema-builder',   label: 'Schema Builder',    icon: Database },
  { id: 'bulk-ops',         label: 'Bulk Operations',   icon: Layers },
  { id: 'inspector',        label: 'Network Inspector', icon: Activity },
  { id: 'storage-manager',  label: 'Storage Manager',   icon: Database },
  { id: 'api-sandbox',      label: 'API Sandbox',       icon: Terminal },
];

function TopBar({ onOpenConfig }) {
  const { creds, requestHistory, activeSpaceId, setActiveSpaceId, activeAppId, setActiveAppId } = usePodio();
  const isConnected = !!creds.clientId;
  const [rateLimit, setRateLimit] = useState(null);

  useEffect(() => {
    const handler = (e) => setRateLimit(e.detail);
    window.addEventListener('podioRateLimit', handler);
    return () => window.removeEventListener('podioRateLimit', handler);
  }, []);

  const ContextChip = ({ label, value, onClear }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 8px 4px 12px', borderRadius: '999px',
      background: 'rgba(129,140,248,0.1)',
      border: '1px solid rgba(129,140,248,0.25)',
      fontSize: '11px', color: 'var(--violet)', fontWeight: 600,
    }}>
      <span style={{ color: 'rgba(129,140,248,0.6)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{value}</span>
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(129,140,248,0.5)', display: 'flex', padding: '1px' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--violet)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(129,140,248,0.5)'}
      ><X size={11} /></button>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '28px',
    }}>
      {/* Context chips */}
      {activeSpaceId && <ContextChip label="Space" value={activeSpaceId} onClear={() => setActiveSpaceId('')} />}
      {activeAppId   && <ContextChip label="App"   value={activeAppId}   onClear={() => setActiveAppId('')}   />}

      {/* Request counter badge */}
      {requestHistory.length > 0 && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '999px',
          background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.2)',
          fontSize: '11px', color: 'var(--accent)', fontWeight: 600
        }}>
          <Activity size={11} />
          {requestHistory.length} request{requestHistory.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Rate Limit widget */}
      {rateLimit && (
        <div className="fade-in" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '999px',
          background: rateLimit.remaining < 50 ? 'rgba(239,68,68,0.08)' : (rateLimit.remaining < rateLimit.limit / 2 ? 'rgba(234,179,8,0.08)' : 'rgba(16,185,129,0.08)'),
          border: `1px solid ${rateLimit.remaining < 50 ? 'rgba(239,68,68,0.2)' : (rateLimit.remaining < rateLimit.limit / 2 ? 'rgba(234,179,8,0.2)' : 'rgba(16,185,129,0.2)')}`,
          fontSize: '11px', color: rateLimit.remaining < 50 ? 'var(--error)' : (rateLimit.remaining < rateLimit.limit / 2 ? 'var(--warning)' : 'var(--success)'), fontWeight: 600
        }}>
          <Activity size={11} className={rateLimit.remaining < 50 ? 'pulse' : ''} />
          Limit: {rateLimit.remaining} / {rateLimit.limit}
        </div>
      )}

      {/* Auth status pill */}
      <div className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isConnected ? 'var(--success)' : 'var(--warning)',
          display: 'inline-block',
          animation: isConnected ? 'pulse-dot 2.5s ease infinite' : 'none'
        }} />
        {isConnected
          ? `${creds.authMethod?.toUpperCase() || 'APP'} · ${creds.clientId}`
          : 'Setup Required'}
      </div>

      {/* Credentials button */}
      <button
        className="btn btn-secondary"
        onClick={onOpenConfig}
        style={{ fontSize: '12px', padding: '7px 14px', gap: '6px' }}
      >
        ⚙ Credentials
      </button>
    </div>
  );
}

function AppContent() {
  const [activeTool, setActiveTool] = useState('dashboard');
  const [configOpen, setConfigOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { creds, updateCreds } = usePodio();
  const { toast } = useToast();

  /* Ctrl+K */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Auto-detect OAuth code from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const current = loadCreds();
      const updated = { ...current, authMethod: 'oauth2', oauthCode: code };
      localStorage.setItem('podio_hub_credentials', JSON.stringify(updated));
      updateCreds(updated);
      toast({ type: 'success', title: 'OAuth Code Detected', message: 'Authorization code captured automatically. Review credentials and save.' });
      setConfigOpen(true);
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []); // eslint-disable-line

  /* Open config if no creds yet */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!creds.clientId && !params.get('code')) setConfigOpen(true);
  }, []); // eslint-disable-line

  const ActiveModule = MODULES[activeTool];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        activeTool={activeTool}
        setActiveTool={(id) => setActiveTool(id)}
        onOpenConfig={() => setConfigOpen(true)}
      />

      {/* Main */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <TopBar
          onOpenConfig={() => setConfigOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        {/* Page transition wrapper */}
        <div key={activeTool} className="fade-in" style={{ flex: 1 }}>
          <ActiveModule creds={creds} />
        </div>
      </main>

      <ConfigPanel
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        onSave={updateCreds}
      />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tools={ALL_TOOLS}
        onSelect={(id) => { setActiveTool(id); setPaletteOpen(false); }}
      />
    </div>
  );
}

export default function App() {
  return (
    <PodioProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </PodioProvider>
  );
}
