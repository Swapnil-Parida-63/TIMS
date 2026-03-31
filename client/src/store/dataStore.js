import { create } from 'zustand';

/**
 * Global data-sync store.
 * Any page that mutates shared data calls triggerRefresh().
 * Any page that fetches data listens to refreshKey in its useEffect dependency.
 */
export const useDataStore = create((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
