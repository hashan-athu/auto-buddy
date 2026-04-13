import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { X } from 'lucide-react';

export default function DashboardSidebar() {
  const { selectedNode, setSelectedNode } = useAppStore();

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="absolute top-0 right-0 h-full w-80 bg-black/80 backdrop-blur-md border-l border-white/20 p-6 font-sans text-white z-20 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-bold tracking-wider">{selectedNode.title}</h2>
            <button 
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Dynamic Data Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {Object.entries(selectedNode.data).map(([key, value]) => {
              // We skip rendering the healthColor explicitly as text if it's just a class, 
              // but we can use it to style the value if it's related to health.
              if (key === 'healthColor') return null;

              // Formatting the key for display (e.g., lastReplaced -> Last Replaced)
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

              return (
                <div key={key} className="bg-white/5 p-4 rounded border border-white/5">
                  <p className="text-xs text-gray-400 capitalize mb-1">{formattedKey}</p>
                  <p className={`text-sm font-semibold ${key === 'expectedChange' && selectedNode.data.healthColor ? selectedNode.data.healthColor : 'text-white'}`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
