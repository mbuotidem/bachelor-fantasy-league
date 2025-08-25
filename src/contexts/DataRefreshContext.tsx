'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';

interface DataRefreshContextType {
  registerDraftDataRefresh: (refreshFn: () => Promise<void>) => void;
  unregisterDraftDataRefresh: (refreshFn: () => Promise<void>) => void;
  triggerDraftDataRefresh: () => Promise<void>;
}

const DataRefreshContext = createContext<DataRefreshContextType | null>(null);

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const draftRefreshFunctions = useRef<Set<() => Promise<void>>>(new Set());

  const registerDraftDataRefresh = useCallback((refreshFn: () => Promise<void>) => {
    draftRefreshFunctions.current.add(refreshFn);
  }, []);

  const unregisterDraftDataRefresh = useCallback((refreshFn: () => Promise<void>) => {
    draftRefreshFunctions.current.delete(refreshFn);
  }, []);

  const triggerDraftDataRefresh = useCallback(async () => {
    console.log('🔄 Triggering draft data refresh for all registered components...');
    const promises = Array.from(draftRefreshFunctions.current).map(fn => fn());
    await Promise.all(promises);
    console.log('✅ Draft data refresh completed');
  }, []);

  return (
    <DataRefreshContext.Provider value={{
      registerDraftDataRefresh,
      unregisterDraftDataRefresh,
      triggerDraftDataRefresh,
    }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
}