import React, { useEffect } from 'react';
import LoadingAwakening from './components/canvas/LoadingAwakening';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import { useAppStore } from './store/useAppStore';

function App() {
  const { appState } = useAppStore();

  return (
    <div className="w-full h-screen overflow-hidden bg-black text-white selection:bg-white/30">
      {/* Absolute Loading Phase */}
      <LoadingAwakening />

      {/* App Router based on appState */}
      {appState === 'exterior' || appState === 'loading' ? (
        <Landing />
      ) : appState === 'interior' ? (
        <Dashboard />
      ) : null}
    </div>
  );
}

export default App;
