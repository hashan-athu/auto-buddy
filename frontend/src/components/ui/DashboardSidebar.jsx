import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { healthColor } from '../../scene/hotspots';

const HEALTH_LABEL = {
  good: 'Good',
  warning: 'Attention soon',
  critical: 'Action needed',
};

const FIELDS = [
  ['category', 'Category'],
  ['last_serviced_date', 'Last serviced'],
  ['last_serviced_odometer', 'Serviced at (km)'],
  ['expected_life_km', 'Expected life (km)'],
  ['note', 'Notes'],
];

export default function DashboardSidebar() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const component = selectedNode?.component;
  const color = healthColor(component?.health);

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

          {!component ? (
            <p className="text-sm text-gray-400">
              No component record for this part yet. Add one in the admin or via the API.
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Health badge */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold" style={{ color }}>
                  {HEALTH_LABEL[component.health] ?? component.health}
                </span>
              </div>

              {FIELDS.map(([key, label]) => {
                const value = component[key];
                if (value === null || value === undefined || value === '') return null;
                return (
                  <div key={key} className="bg-white/5 p-4 rounded border border-white/5">
                    <p className="text-xs text-gray-400 capitalize mb-1">{label}</p>
                    <p className="text-sm font-semibold text-white capitalize">{value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
