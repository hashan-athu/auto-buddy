import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // App states: 'loading' (awakening), 'exterior' (landing/login), 'interior' (dashboard)
  appState: 'loading',
  setAppState: (state) => set({ appState: state }),

  isLoggedIn: false,
  logIn: () => set({ isLoggedIn: true }),

  isUnlocked: false,
  unlockGarage: () => set({ isUnlocked: true }),

  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
}));
