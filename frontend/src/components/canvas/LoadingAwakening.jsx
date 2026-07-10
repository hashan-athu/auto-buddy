import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const INTRO_SEEN_KEY = 'ab_intro_seen';

export default function LoadingAwakening() {
  const [blinkPhase, setBlinkPhase] = useState(0);
  const { appState, setAppState } = useAppStore();

  const skipIntro = () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* ignore */ }
    setAppState('exterior');
  };

  useEffect(() => {
    // Returning visitors skip the cinematic — a 5s intro is magic once and
    // friction every day after.
    let seen = false;
    try { seen = localStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (seen) {
      setAppState('exterior');
      return;
    }

    // Sequence of blinks using timeouts (simulating eyes opening)
    const t1 = setTimeout(() => setBlinkPhase(1), 800);   // open slightly
    const t2 = setTimeout(() => setBlinkPhase(0), 1200);  // close
    const t3 = setTimeout(() => setBlinkPhase(2), 1800);  // open more
    const t4 = setTimeout(() => setBlinkPhase(0), 2200);  // close
    const t5 = setTimeout(() => {
      setBlinkPhase(3); // fully open
      // Transition to exterior phase after fully open
      setTimeout(() => {
        try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* ignore */ }
        setAppState('exterior');
      }, 2000);
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [setAppState]);

  // If we are past the loading state, unmount
  if (appState !== 'loading') return null;

  // Top and bottom eye lids
  const lidVariants = {
    closed: { height: '50vh' },
    slight: { height: '35vh' },
    more: { height: '20vh' },
    open: { height: '0vh' },
  };

  const getVariant = () => {
    switch (blinkPhase) {
      case 0: return 'closed';
      case 1: return 'slight';
      case 2: return 'more';
      case 3: return 'open';
      default: return 'closed';
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between">
      {/* Top Lid */}
      <motion.div
        variants={lidVariants}
        initial="closed"
        animate={getVariant()}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full bg-black"
      />
      
      {/* 
        (Placeholder) 
        import { useGLTF, useAnimations } from '@react-three/drei'
        // Here we could load a first-person hand rig using R3F into the scene beneath this overlay,
        // triggering a "waking up" animation on the hand model concurrently with the blinks.
      */}

      {/* Bottom Lid */}
      <motion.div
        variants={lidVariants}
        initial="closed"
        animate={getVariant()}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full bg-black"
      />
      
      {/* CSS Blur Overlay - reducing as eyes open */}
      <motion.div
        className="absolute inset-0 bg-transparent"
        initial={{ backdropFilter: 'blur(15px)' }}
        animate={{ backdropFilter: blinkPhase === 3 ? 'blur(0px)' : 'blur(15px)' }}
        transition={{ duration: 2 }}
      />

      {/* Skip the cinematic */}
      <button
        onClick={skipIntro}
        className="absolute bottom-6 right-6 z-10 pointer-events-auto text-white/60 hover:text-white text-xs tracking-[0.3em] uppercase transition-colors"
      >
        Skip →
      </button>
    </div>
  );
}
