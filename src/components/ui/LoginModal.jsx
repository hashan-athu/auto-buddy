import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_DATA } from '../../constants/const';
import { useAppStore } from '../../store/useAppStore';

export default function LoginModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { unlockGarage } = useAppStore();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === MOCK_DATA.user.username && password === MOCK_DATA.user.password) {
      setError('');
      unlockGarage();
      onClose();
    } else {
      setError('Invalid credentials. Hint: use admin / password123');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="bg-black/60 backdrop-blur-xl border border-gray-600 p-8 rounded-lg shadow-2xl w-80 text-white font-sans">
            <h2 className="text-2xl font-bold mb-6 text-center tracking-wide">Auth Required</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button 
                type="submit"
                className="mt-4 bg-white text-black font-semibold py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
