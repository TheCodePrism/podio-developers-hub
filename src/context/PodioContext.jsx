import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadCreds } from '../components/ConfigPanel';

const PodioContext = createContext();

export function PodioProvider({ children }) {
   const [creds, setCreds] = useState({});
  const [logsByModule, setLogsByModule] = useState(() => {
    const saved = localStorage.getItem('podio_module_logs');
    return saved ? JSON.parse(saved) : {};
  });
  const [requestHistory, setRequestHistory] = useState(() => {
    const saved = localStorage.getItem('podio_request_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [storageHistory, setStorageHistory] = useState(() => {
    const saved = localStorage.getItem('podio_storage_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [rateLimit, setRateLimit] = useState(() => {
    const saved = localStorage.getItem('podio_last_rate_limit');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Shared context for tools
  const [activeSpaceId, setActiveSpaceId] = useState(() => localStorage.getItem('podio_active_space') || '');
  const [activeAppId, setActiveAppId] = useState(() => localStorage.getItem('podio_active_app') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('podio_hub_theme') || 'theme-default');
  const [useProxy, setUseProxy] = useState(() => localStorage.getItem('podio_use_proxy') === 'true');

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('podio_hub_theme', theme);
  }, [theme]);

  useEffect(() => {
    setCreds(loadCreds());
  }, []);

  useEffect(() => {
    localStorage.setItem('podio_active_space', activeSpaceId);
  }, [activeSpaceId]);

  useEffect(() => {
    localStorage.setItem('podio_active_app', activeAppId);
  }, [activeAppId]);

  useEffect(() => {
    localStorage.setItem('podio_use_proxy', useProxy);
  }, [useProxy]);

  // Persist logs and history
  useEffect(() => {
    localStorage.setItem('podio_module_logs', JSON.stringify(logsByModule));
  }, [logsByModule]);

  useEffect(() => {
    localStorage.setItem('podio_request_history', JSON.stringify(requestHistory));
  }, [requestHistory]);

  useEffect(() => {
    localStorage.setItem('podio_storage_history', JSON.stringify(storageHistory));
  }, [storageHistory]);

  const addLog = (moduleKey, message, type = 'info') => {
    setLogsByModule(prev => {
      const currentLogs = prev[moduleKey] || [];
      return {
        ...prev,
        [moduleKey]: [...currentLogs, { 
          id: Date.now() + Math.random(),
          message, 
          type, 
          timestamp: Date.now() 
        }].slice(-100) // Keep last 100 per module
      };
    });
  };

  const clearLogs = (moduleKey) => {
    setLogsByModule(prev => ({
      ...prev,
      [moduleKey]: []
    }));
  };

  const updateCreds = (newCreds) => {
    setCreds(newCreds);
    localStorage.setItem('podio_hub_credentials', JSON.stringify(newCreds));
  };

  const trackRequest = (request) => {
    setRequestHistory(prev => [{
      id: Date.now() + Math.random(),
      ...request,
      timestamp: Date.now()
    }, ...prev].slice(0, 200)); // Keep more history for dashboard sorting
  };

  const trackStorageActivity = (activity) => {
    setStorageHistory(prev => [{
      id: Date.now() + Math.random(),
      ...activity,
      timestamp: Date.now()
    }, ...prev].slice(0, 100)); // Keep last 100 storage events
  };

  useEffect(() => {
    const handler = (e) => {
      setRateLimit(e.detail);
      localStorage.setItem('podio_last_rate_limit', JSON.stringify(e.detail));
    };
    window.addEventListener('podioRateLimit', handler);
    return () => window.removeEventListener('podioRateLimit', handler);
  }, []);

  return (
    <PodioContext.Provider value={{ 
      creds, 
      updateCreds, 
      logsByModule,
      addLog, 
      clearLogs,
      requestHistory,
      trackRequest,
      activeSpaceId,
      setActiveSpaceId,
       activeAppId,
      setActiveAppId,
      theme,
       setTheme,
      storageHistory,
      trackStorageActivity,
      rateLimit,
      useProxy,
      setUseProxy
    }}>
      {children}
    </PodioContext.Provider>
  );
}

export function usePodio() {
  const context = useContext(PodioContext);
  if (!context) throw new Error('usePodio must be used within PodioProvider');
  return context;
}

export function useModuleLogger(moduleKey) {
  const { logsByModule, addLog, clearLogs } = usePodio();
  
  return {
    logs: logsByModule[moduleKey] || [],
    addLog: (message, type) => addLog(moduleKey, message, type),
    clearLogs: () => clearLogs(moduleKey)
  };
}
