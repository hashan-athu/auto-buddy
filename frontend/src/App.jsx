import React, { useEffect, lazy, Suspense } from 'react';
import LoadingAwakening from './components/canvas/LoadingAwakening';
import { useAppStore } from './store/useAppStore';
import { useMe } from './api/auth';

// The scene pages pull in three.js / R3F / drei (the bulk of the bundle). Lazy
// them so that heavy chunk downloads during the (eager, lightweight) intro
// instead of blocking first paint.
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

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
      {/* Absolute Loading Phase (eager — shows instantly while chunks load) */}
      <LoadingAwakening />

      {/* App Router based on appState. Suspense falls back to black (the page
          bg + the LoadingAwakening overlay already cover the scene loading). */}
      <Suspense fallback={null}>
        {appState === 'exterior' || appState === 'loading' ? (
          <Landing />
        ) : appState === 'interior' ? (
          <Dashboard />
        ) : null}
      </Suspense>
    </div>
  );
}

export default App;
