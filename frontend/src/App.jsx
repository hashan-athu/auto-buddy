import React, { useEffect } from 'react';
import LoadingAwakening from './components/canvas/LoadingAwakening';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import { useAppStore } from './store/useAppStore';
import { useMe } from './api/auth';

function App() {
  const { appState, setAppState, isUnlocked, logIn } = useAppStore();
  const { data: me } = useMe();

  // Already signed in (valid Django session)? Skip the intro + padlock and go
  // straight to the garage. The `!isUnlocked` guard leaves the fresh-login
  // door-opening cinematic alone (that path sets isUnlocked before entering).
  useEffect(() => {
    if (me && !isUnlocked && appState !== 'interior') {
      logIn();
      setAppState('interior');
    }
  }, [me, isUnlocked, appState, setAppState, logIn]);

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
