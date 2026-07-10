import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useActiveVehicle } from '../../api/vehicles';
import {
  useComponents, useAddComponent, useUpdateComponent,
  COMPONENT_CATEGORIES, HEALTH_OPTIONS,
} from '../../api/components';
import { healthColor } from '../../scene/hotspots';

const HEALTH_LABEL = { good: 'Good', warning: 'Attention soon', critical: 'Action needed' };

const inputCls =
  'w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors';

const FIELDS = [
  ['category', 'Category'],
  ['last_serviced_date', 'Last serviced'],
  ['last_serviced_odometer', 'Serviced at (km)'],
  ['expected_life_km', 'Expected life (km)'],
  ['note', 'Notes'],
];

function ComponentForm({ vehicleId, hotspotKey, defaultLabel, component, onDone }) {
  const add = useAddComponent(vehicleId);
  const update = useUpdateComponent(vehicleId);
  const editing = !!component;
  const [form, setForm] = useState({
    label: component?.label ?? defaultLabel ?? '',
    category: component?.category ?? 'other',
    health: component?.health ?? 'good',
    last_serviced_date: component?.last_serviced_date ?? '',
    note: component?.note ?? '',
  });

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      label: form.label,
      category: form.category,
      health: form.health,
      last_serviced_date: form.last_serviced_date || null,
      note: form.note,
    };
    if (editing) update.mutate({ id: component.id, ...payload }, { onSuccess: onDone });
    else add.mutate({ hotspot_key: hotspotKey, ...payload }, { onSuccess: onDone });
  };

  const pending = add.isPending || update.isPending;
  const mutation = editing ? update : add;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 text-xs text-gray-400">
      <label className="flex flex-col gap-1">Label
        <input type="text" required value={form.label} className={inputCls}
          onChange={(e) => setForm({ ...form, label: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1">Category
        <select value={form.category} className={inputCls}
          onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {COMPONENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-neutral-900">{c.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">Health
        <select value={form.health} className={inputCls}
          onChange={(e) => setForm({ ...form, health: e.target.value })}>
          {HEALTH_OPTIONS.map((h) => (
            <option key={h.value} value={h.value} className="bg-neutral-900">{h.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">Last serviced
        <input type="date" value={form.last_serviced_date} className={inputCls}
          onChange={(e) => setForm({ ...form, last_serviced_date: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1">Notes
        <input type="text" value={form.note} className={inputCls}
          onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
      {mutation.isError && <p className="text-red-400">Could not save. Check the fields.</p>}
      <div className="flex gap-2 justify-end mt-1">
        <button type="button" onClick={onDone}
          className="text-sm px-3 py-1.5 rounded border border-white/20 text-gray-300 hover:bg-white/10">Cancel</button>
        <button type="submit" disabled={pending}
          className="text-sm px-3 py-1.5 rounded bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-50">
          {pending ? 'Saving…' : editing ? 'Save' : 'Add component'}
        </button>
      </div>
    </form>
  );
}

export default function DashboardSidebar() {
  const { selectedNode, setSelectedNode } = useAppStore();
  const { vehicle } = useActiveVehicle();
  const { data: components } = useComponents(vehicle?.id);
  const [editing, setEditing] = useState(false);

  // Read the live component (so edits reflect immediately), falling back to the
  // snapshot captured on click while the query is still loading.
  const component =
    components?.find((c) => c.hotspot_key === selectedNode?.hotspot_key)
    ?? selectedNode?.component
    ?? null;
  const color = healthColor(component?.health);

  const close = () => { setEditing(false); setSelectedNode(null); };

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
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-bold tracking-wider">{selectedNode.title}</h2>
            <button onClick={close} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {editing || !component ? (
              <ComponentForm
                vehicleId={vehicle?.id}
                hotspotKey={selectedNode.hotspot_key}
                defaultLabel={selectedNode.title}
                component={component}
                onDone={() => setEditing(false)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold" style={{ color }}>
                      {HEALTH_LABEL[component.health] ?? component.health}
                    </span>
                  </div>
                  <button onClick={() => setEditing(true)}
                    className="text-xs px-2 py-1 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition-colors">
                    Edit
                  </button>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
