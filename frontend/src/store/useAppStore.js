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

  // Which vehicle is in focus in the garage; null falls back to the first one.
  activeVehicleId: null,
  setActiveVehicleId: (id) => set({ activeVehicleId: id, selectedNode: null }),
}));
