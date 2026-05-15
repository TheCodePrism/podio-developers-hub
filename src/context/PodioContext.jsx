import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadCreds } from '../components/ConfigPanel';

const PodioContext = createContext();

export function PodioProvider({ children }) {
   const [creds, setCreds] = useState({});
  const [logsByModule, setLogsByModule] = useState({});
  const [requestHistory, setRequestHistory] = useState([]);
  const [storageHistory, setStorageHistory] = useState([]);
  
  // Shared context for tools
  const [activeSpaceId, setActiveSpaceId] = useState(() => localStorage.getItem('podio_active_space') || '');
  const [activeAppId, setActiveAppId] = useState(() => localStorage.getItem('podio_active_app') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('podio_hub_theme') || 'theme-default');

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
      trackStorageActivity
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
