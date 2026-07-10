import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Check } from 'lucide-react';
import {
  useVehicles, useAddVehicle, useUpdateVehicle, useDeleteVehicle,
  FUEL_TYPES, VEHICLE_STATUSES,
} from '../../api/vehicles';
import { useAppStore } from '../../store/useAppStore';
import { HOTSPOT_LAYOUTS } from '../../scene/hotspots';

const MODEL_OPTIONS = Object.keys(HOTSPOT_LAYOUTS); // 3D models the frontend can render

const inputCls =
  'w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors';
const btnCls =
  'bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const blankForm = {
  make: '', model: '', year: '', trim: '', colour: '', fuel_type: 'petrol',
  current_odometer: '', model_3d: MODEL_OPTIONS[0] ?? '', status: 'active',
};

function Field({ label, children }) {
  return <label className="flex flex-col gap-1 text-xs text-gray-400">{label}{children}</label>;
}

export default function VehiclesPanel({ onClose }) {
  const { data: vehicles } = useVehicles();
  const add = useAddVehicle();
  const update = useUpdateVehicle();
  const del = useDeleteVehicle();
  const { activeVehicleId, setActiveVehicleId } = useAppStore();

  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);

  const activeId = activeVehicleId ?? vehicles?.[0]?.id;
  const mutation = editing ? update : add;

  const cancel = () => { setEditing(null); setForm(blankForm); };
  const startEdit = (v) => {
    setEditing(v);
    setForm({
      make: v.make, model: v.model, year: v.year ?? '', trim: v.trim ?? '',
      colour: v.colour ?? '', fuel_type: v.fuel_type, current_odometer: String(v.current_odometer ?? ''),
      model_3d: v.model_3d ?? (MODEL_OPTIONS[0] ?? ''), status: v.status,
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      make: form.make, model: form.model,
      year: form.year === '' ? null : Number(form.year),
      trim: form.trim, colour: form.colour, fuel_type: form.fuel_type,
      current_odometer: form.current_odometer === '' ? 0 : Number(form.current_odometer),
      model_3d: form.model_3d, status: form.status,
    };
    if (editing) update.mutate({ id: editing.id, ...payload }, { onSuccess: cancel });
    else add.mutate(payload, { onSuccess: (v) => { setForm(blankForm); if (v?.id) setActiveVehicleId(v.id); } });
  };

  const remove = (v) => {
    if (!window.confirm(`Delete ${v.make} ${v.model} and all its records? This can't be undone.`)) return;
    del.mutate(v.id, { onSuccess: () => { if (v.id === activeId) setActiveVehicleId(null); } });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex justify-end font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="w-full max-w-2xl h-full bg-neutral-950/95 border-l border-white/10 text-white flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold tracking-wider">Manage Garage</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form onSubmit={submit} className="grid grid-cols-2 gap-3 items-end">
              <Field label="Make">
                <input type="text" required value={form.make} className={inputCls}
                  onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </Field>
              <Field label="Model">
                <input type="text" required value={form.model} className={inputCls}
                  onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </Field>
              <Field label="Year">
                <input type="number" value={form.year} className={inputCls}
                  onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label="Trim">
                <input type="text" value={form.trim} className={inputCls}
                  onChange={(e) => setForm({ ...form, trim: e.target.value })} />
              </Field>
              <Field label="Colour">
                <input type="text" value={form.colour} className={inputCls}
                  onChange={(e) => setForm({ ...form, colour: e.target.value })} />
              </Field>
              <Field label="Odometer (km)">
                <input type="number" min="0" value={form.current_odometer} className={inputCls}
                  onChange={(e) => setForm({ ...form, current_odometer: e.target.value })} />
              </Field>
              <Field label="Fuel type">
                <select value={form.fuel_type} className={inputCls}
                  onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}>
                  {FUEL_TYPES.map((f) => <option key={f.value} value={f.value} className="bg-neutral-900">{f.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} className={inputCls}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {VEHICLE_STATUSES.map((s) => <option key={s.value} value={s.value} className="bg-neutral-900">{s.label}</option>)}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="3D model">
                  <select value={form.model_3d} className={inputCls}
                    onChange={(e) => setForm({ ...form, model_3d: e.target.value })}>
                    {MODEL_OPTIONS.map((m) => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                  </select>
                </Field>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {editing && <button type="button" onClick={cancel}
                  className="text-sm px-4 py-2 rounded border border-white/20 text-gray-300 hover:bg-white/10">Cancel</button>}
                <button type="submit" disabled={mutation.isPending} className={btnCls}>
                  {mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
                </button>
              </div>
              {mutation.isError && <p className="col-span-2 text-red-400 text-xs">Could not save. Check the fields.</p>}
            </form>

            <div className="border-t border-white/10 pt-4">
              {!vehicles ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-gray-500">No vehicles yet — add your first above.</p>
              ) : (
                <ul className="space-y-2">
                  {vehicles.map((v) => (
                    <li key={v.id}
                      className={`flex items-center justify-between gap-3 rounded border p-3 ${
                        v.id === activeId ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5'
                      }`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {Number(v.current_odometer).toLocaleString()} km · {v.status}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0 items-center">
                        {v.id === activeId ? (
                          <span className="text-xs text-green-400 inline-flex items-center gap-1"><Check size={13} /> Active</span>
                        ) : (
                          <button onClick={() => setActiveVehicleId(v.id)}
                            className="text-xs text-gray-300 hover:text-white transition-colors">Select</button>
                        )}
                        <button onClick={() => startEdit(v)} title="Edit"
                          className="text-gray-400 hover:text-white transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => remove(v)} title="Delete"
                          className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
