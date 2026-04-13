import React, { useState, useEffect } from 'react';
import GarageExterior from '../components/canvas/GarageExterior';
import LoginModal from '../components/ui/LoginModal';
import { useAppStore } from '../store/useAppStore';

export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isUnlocked, setAppState } = useAppStore();

  useEffect(() => {
    if (isUnlocked) {
      // Sequence: wait for garage to open, then fade to black, then transition
      const timer = setTimeout(() => {
        setAppState('interior');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, setAppState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <GarageExterior onUnlockRequested={() => setIsModalOpen(true)} />
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Black fade overlay when unlocking */}
      <div 
        className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-2000 ${isUnlocked ? 'opacity-100 delay-1000' : 'opacity-0'}`} 
      />
    </div>
  );
}
