import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useVehicleSummary } from '../../api/vehicles';
import {
  useRunningLogs,
  useAddRunningLog,
  useFuelEntries,
  useAddFuelEntry,
} from '../../api/logs';
import {
  useMaintenanceRecords,
  useAddMaintenanceRecord,
  MAINTENANCE_CATEGORIES,
} from '../../api/maintenance';
import { useDocuments, useUploadDocument, DOCUMENT_TYPES } from '../../api/documents';
import { useReminders, useAddReminder, useUpdateReminder } from '../../api/reminders';

const TABS = ['Overview', 'Running', 'Fuel', 'Maintenance', 'Documents', 'Reminders'];
const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  'w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors';
const btnCls =
  'bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const money = (v) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const km = (v) => `${Number(v).toLocaleString()} km`;

// --- Shared presentational bits --------------------------------------------
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-400">
      {label}
      {children}
    </label>
  );
}

function DataTable({ columns, rows, empty }) {
  if (!rows) return <p className="text-sm text-gray-500 py-6">Loading…</p>;
  if (rows.length === 0)
    return <p className="text-sm text-gray-500 py-6">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-gray-400 border-b border-white/10">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4 font-medium whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5">
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-4 whitespace-nowrap">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormError({ mutation }) {
  if (!mutation.isError) return null;
  const data = mutation.error?.response?.data;
  const msg =
    typeof data === 'object'
      ? Object.values(data).flat().join(' ')
      : 'Could not save. Please check the fields.';
  return <p className="text-red-400 text-xs mt-1">{msg}</p>;
}

// --- Overview ---------------------------------------------------------------
function StatTile({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function OverviewTab({ vehicleId }) {
  const { data: s } = useVehicleSummary(vehicleId);
  if (!s) return <p className="text-sm text-gray-500 py-6">Loading…</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Odometer" value={km(s.current_odometer)} />
      <StatTile label="Distance on record" value={km(s.total_distance)} />
      <StatTile label="Total spend" value={money(s.total_spend)} />
      <StatTile label="Fuel cost" value={money(s.fuel_cost)} />
      <StatTile label="Maintenance cost" value={money(s.maintenance_cost)} />
      <StatTile
        label="Avg economy"
        value={s.economy_kmpl ? `${s.economy_kmpl} km/L` : '—'}
      />
    </div>
  );
}

// --- Running ----------------------------------------------------------------
function RunningTab({ vehicleId }) {
  const { data: logs } = useRunningLogs(vehicleId);
  const add = useAddRunningLog(vehicleId);
  const [form, setForm] = useState({ date: today(), odometer: '', note: '' });

  const submit = (e) => {
    e.preventDefault();
    add.mutate(
      { date: form.date, odometer: Number(form.odometer), note: form.note },
      { onSuccess: () => setForm({ date: today(), odometer: '', note: '' }) },
    );
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid grid-cols-3 gap-3 items-end">
        <Field label="Date">
          <input type="date" required value={form.date} className={inputCls}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Odometer (km)">
          <input type="number" required min="0" value={form.odometer} className={inputCls}
            onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
        </Field>
        <button type="submit" disabled={add.isPending} className={btnCls}>
          {add.isPending ? 'Saving…' : 'Add log'}
        </button>
        <div className="col-span-3"><FormError mutation={add} /></div>
      </form>
      <DataTable
        rows={logs}
        empty="No running logs yet."
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'odometer', label: 'Odometer', render: (r) => km(r.odometer) },
          { key: 'note', label: 'Note', render: (r) => r.note || '—' },
        ]}
      />
    </div>
  );
}

// --- Fuel -------------------------------------------------------------------
function FuelTab({ vehicleId }) {
  const { data: entries } = useFuelEntries(vehicleId);
  const add = useAddFuelEntry(vehicleId);
  const [form, setForm] = useState({ date: today(), odometer: '', litres: '', total_cost: '' });

  const submit = (e) => {
    e.preventDefault();
    add.mutate(
      {
        date: form.date,
        odometer: Number(form.odometer),
        litres: form.litres,
        total_cost: form.total_cost,
      },
      { onSuccess: () => setForm({ date: today(), odometer: '', litres: '', total_cost: '' }) },
    );
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 items-end">
        <Field label="Date">
          <input type="date" required value={form.date} className={inputCls}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Odometer (km)">
          <input type="number" required min="0" value={form.odometer} className={inputCls}
            onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
        </Field>
        <Field label="Litres">
          <input type="number" required min="0" step="0.01" value={form.litres} className={inputCls}
            onChange={(e) => setForm({ ...form, litres: e.target.value })} />
        </Field>
        <Field label="Total cost">
          <input type="number" required min="0" step="0.01" value={form.total_cost} className={inputCls}
            onChange={(e) => setForm({ ...form, total_cost: e.target.value })} />
        </Field>
        <div className="col-span-2 flex justify-end">
          <button type="submit" disabled={add.isPending} className={btnCls}>
            {add.isPending ? 'Saving…' : 'Add fill-up'}
          </button>
        </div>
        <div className="col-span-2"><FormError mutation={add} /></div>
      </form>
      <DataTable
        rows={entries}
        empty="No fuel entries yet."
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'odometer', label: 'Odometer', render: (r) => km(r.odometer) },
          { key: 'litres', label: 'Litres', render: (r) => `${r.litres} L` },
          { key: 'total_cost', label: 'Cost', render: (r) => money(r.total_cost) },
          { key: 'price_per_litre', label: '$/L', render: (r) => (r.price_per_litre ? money(r.price_per_litre) : '—') },
        ]}
      />
    </div>
  );
}

// --- Maintenance ------------------------------------------------------------
function MaintenanceTab({ vehicleId }) {
  const { data: records } = useMaintenanceRecords(vehicleId);
  const add = useAddMaintenanceRecord(vehicleId);
  const blank = {
    date: today(), category: 'service', title: '',
    parts_cost: '', labor_cost: '', vendor: '',
  };
  const [form, setForm] = useState(blank);

  const submit = (e) => {
    e.preventDefault();
    add.mutate(
      {
        date: form.date,
        category: form.category,
        title: form.title,
        parts_cost: form.parts_cost || 0,
        labor_cost: form.labor_cost || 0,
        vendor: form.vendor,
      },
      { onSuccess: () => setForm(blank) },
    );
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 items-end">
        <Field label="Date">
          <input type="date" required value={form.date} className={inputCls}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Category">
          <select value={form.category} className={inputCls}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-neutral-900">{c.label}</option>
            ))}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="What was done">
            <input type="text" required value={form.title} className={inputCls}
              placeholder="e.g. Oil & filter change"
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </div>
        <Field label="Parts cost">
          <input type="number" min="0" step="0.01" value={form.parts_cost} className={inputCls}
            onChange={(e) => setForm({ ...form, parts_cost: e.target.value })} />
        </Field>
        <Field label="Labour cost">
          <input type="number" min="0" step="0.01" value={form.labor_cost} className={inputCls}
            onChange={(e) => setForm({ ...form, labor_cost: e.target.value })} />
        </Field>
        <div className="col-span-2">
          <Field label="Vendor">
            <input type="text" value={form.vendor} className={inputCls}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </Field>
        </div>
        <div className="col-span-2 flex justify-end">
          <button type="submit" disabled={add.isPending} className={btnCls}>
            {add.isPending ? 'Saving…' : 'Add record'}
          </button>
        </div>
        <div className="col-span-2"><FormError mutation={add} /></div>
      </form>
      <DataTable
        rows={records}
        empty="No maintenance records yet."
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'title', label: 'Work' },
          { key: 'total_cost', label: 'Cost', render: (r) => money(r.total_cost) },
          { key: 'vendor', label: 'Vendor', render: (r) => r.vendor || '—' },
        ]}
      />
    </div>
  );
}

// --- Documents --------------------------------------------------------------
function DocumentsTab({ vehicleId }) {
  const { data: docs } = useDocuments(vehicleId);
  const upload = useUploadDocument(vehicleId);
  const blank = { type: 'insurance', title: '', expiry_date: '', issuer: '', file: null };
  const [form, setForm] = useState(blank);

  const submit = (e) => {
    e.preventDefault();
    if (!form.file) return;
    upload.mutate(form, { onSuccess: () => setForm(blank) });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3 items-end">
        <Field label="Type">
          <select value={form.type} className={inputCls}
            onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-neutral-900">{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Expiry (optional)">
          <input type="date" value={form.expiry_date} className={inputCls}
            onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
        </Field>
        <div className="col-span-2">
          <Field label="Title">
            <input type="text" required value={form.title} className={inputCls}
              placeholder="e.g. Comprehensive policy"
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="File">
            <input type="file" required className={`${inputCls} file:mr-3 file:border-0 file:bg-white/10 file:text-white file:rounded file:px-2 file:py-1`}
              onChange={(e) => setForm({ ...form, file: e.target.files[0] ?? null })} />
          </Field>
        </div>
        <div className="col-span-2 flex justify-end">
          <button type="submit" disabled={upload.isPending} className={btnCls}>
            {upload.isPending ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
        <div className="col-span-2"><FormError mutation={upload} /></div>
      </form>
      <DataTable
        rows={docs}
        empty="No documents yet."
        columns={[
          { key: 'type', label: 'Type' },
          { key: 'title', label: 'Title' },
          { key: 'expiry_date', label: 'Expires', render: (r) => r.expiry_date || '—' },
          {
            key: 'file_url',
            label: 'File',
            render: (r) => (
              <a href={`/api/documents/${r.id}/download/`} className="text-blue-400 hover:underline"
                target="_blank" rel="noreferrer">
                {r.filename || 'download'}
              </a>
            ),
          },
        ]}
      />
    </div>
  );
}

// --- Reminders --------------------------------------------------------------
function RemindersTab({ vehicleId }) {
  const { data: reminders } = useReminders(vehicleId);
  const add = useAddReminder(vehicleId);
  const update = useUpdateReminder(vehicleId);
  const [form, setForm] = useState({ title: '', due_date: '' });

  const submit = (e) => {
    e.preventDefault();
    add.mutate(
      { title: form.title, trigger_type: 'date', due_date: form.due_date || null },
      { onSuccess: () => setForm({ title: '', due_date: '' }) },
    );
  };

  const dueText = (r) => {
    if (r.trigger_type === 'odometer' && r.km_until_due != null)
      return r.km_until_due < 0 ? `${Math.abs(r.km_until_due)} km overdue` : `in ${r.km_until_due} km`;
    if (r.due_date)
      return r.days_until_due < 0 ? `${Math.abs(r.days_until_due)} d overdue` : `in ${r.days_until_due} d`;
    return '—';
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid grid-cols-3 gap-3 items-end">
        <div className="col-span-2">
          <Field label="Reminder">
            <input type="text" required value={form.title} className={inputCls}
              placeholder="e.g. Renew insurance"
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </div>
        <Field label="Due date">
          <input type="date" required value={form.due_date} className={inputCls}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </Field>
        <div className="col-span-3 flex justify-end">
          <button type="submit" disabled={add.isPending} className={btnCls}>
            {add.isPending ? 'Saving…' : 'Add reminder'}
          </button>
        </div>
        <div className="col-span-3"><FormError mutation={add} /></div>
      </form>

      {!reminders ? (
        <p className="text-sm text-gray-500 py-6">Loading…</p>
      ) : reminders.length === 0 ? (
        <p className="text-sm text-gray-500 py-6">No reminders yet.</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li key={r.id}
              className={`flex items-center justify-between gap-3 rounded border p-3 ${
                r.is_overdue ? 'border-red-500/40 bg-red-500/5' : 'border-white/10 bg-white/5'
              } ${r.status !== 'open' ? 'opacity-50' : ''}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className={`text-xs ${r.is_overdue ? 'text-red-400' : 'text-gray-400'}`}>
                  {dueText(r)}
                  {r.status !== 'open' && ` · ${r.status}`}
                </p>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => update.mutate({ id: r.id, status: 'done' })}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">
                    Done
                  </button>
                  <button onClick={() => update.mutate({ id: r.id, status: 'dismissed' })}
                    className="text-xs px-2 py-1 rounded hover:bg-white/10 text-gray-400 transition-colors">
                    Dismiss
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Panel shell ------------------------------------------------------------
export default function RecordsPanel({ vehicleId, onClose }) {
  const [tab, setTab] = useState('Overview');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex justify-end font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="w-full max-w-2xl h-full bg-neutral-950/95 border-l border-white/10 text-white flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold tracking-wider">Garage Records</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-1 px-4 pt-3 border-b border-white/10 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm rounded-t transition-colors whitespace-nowrap ${
                  tab === t
                    ? 'bg-white/10 text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'Overview' && <OverviewTab vehicleId={vehicleId} />}
            {tab === 'Running' && <RunningTab vehicleId={vehicleId} />}
            {tab === 'Fuel' && <FuelTab vehicleId={vehicleId} />}
            {tab === 'Maintenance' && <MaintenanceTab vehicleId={vehicleId} />}
            {tab === 'Documents' && <DocumentsTab vehicleId={vehicleId} />}
            {tab === 'Reminders' && <RemindersTab vehicleId={vehicleId} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
