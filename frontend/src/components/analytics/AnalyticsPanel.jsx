import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useVehicleAnalytics } from '../../api/analytics';
import { healthColor } from '../../scene/hotspots';

// Validated categorical pair (see dataviz validator, dark surface): blue/orange,
// CVD ΔE ~90, both in the lightness band. Fuel vs maintenance identity.
const FUEL = '#3392d0';
const MAINT = '#c96a1c';

const money = (v) => `$${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const money2 = (v) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1).toLocaleString('en', { month: 'short' });
};

function Tile({ label, value, sub }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// --- Monthly spend: stacked bars (fuel + maintenance) -----------------------
function MonthlySpend({ data }) {
  const [hover, setHover] = useState(null);
  const W = 360, H = 150, PLOT = 120, n = data.length;
  const max = Math.max(...data.map((d) => Number(d.total)), 1);
  const slot = W / n;
  const barW = slot * 0.58;

  const y = (v) => (Number(v) / max) * PLOT;

  return (
    <div className="relative">
      {/* Legend (2 series -> always present) */}
      <div className="flex gap-4 mb-2 text-xs text-gray-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: FUEL }} /> Fuel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: MAINT }} /> Maintenance
        </span>
      </div>

      {hover != null && (
        <div
          className="absolute -top-1 z-10 pointer-events-none bg-black/90 border border-white/10 rounded px-2 py-1 text-[11px] text-white whitespace-nowrap"
          style={{ left: `${((hover + 0.5) / n) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <div className="text-gray-400">{monthLabel(data[hover].month)} {data[hover].month.slice(0, 4)}</div>
          <div style={{ color: FUEL }}>Fuel {money2(data[hover].fuel)}</div>
          <div style={{ color: MAINT }}>Maint {money2(data[hover].maintenance)}</div>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
        {/* recessive baseline */}
        <line x1="0" y1={PLOT} x2={W} y2={PLOT} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {data.map((d, i) => {
          const x = i * slot + (slot - barW) / 2;
          const fuelH = y(d.fuel);
          const maintH = y(d.maintenance);
          const gap = maintH > 0 && fuelH > 0 ? 2 : 0; // 2px surface gap between segments
          const fuelY = PLOT - fuelH;
          const maintY = fuelY - gap - maintH;
          const topRounded = maintH > 0 ? 2 : fuelH > 0 ? 2 : 0;
          return (
            <g key={d.month}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* hit target */}
              <rect x={i * slot} y="0" width={slot} height={PLOT} fill="transparent" />
              {fuelH > 0 && (
                <rect x={x} y={fuelY} width={barW} height={fuelH} rx={maintH > 0 ? 0 : topRounded}
                      fill={FUEL} opacity={hover == null || hover === i ? 1 : 0.5} />
              )}
              {maintH > 0 && (
                <rect x={x} y={maintY} width={barW} height={maintH} rx={topRounded}
                      fill={MAINT} opacity={hover == null || hover === i ? 1 : 0.5} />
              )}
              {/* x label every 3rd month */}
              {i % 3 === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle"
                      fill="rgba(255,255,255,0.45)" fontSize="9">{monthLabel(d.month)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// --- Fuel economy sparkline -------------------------------------------------
function EconomyLine({ series }) {
  if (!series || series.length < 2)
    return <p className="text-sm text-gray-500 py-4">Not enough fuel data yet.</p>;
  const W = 360, H = 90, PAD = 8;
  const vals = series.map((s) => Number(s.kmpl));
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => PAD + (i / (series.length - 1)) * (W - 2 * PAD);
  const y = (v) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);
  const pts = series.map((s, i) => `${x(i)},${y(Number(s.kmpl))}`).join(' ');
  const last = series[series.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
        <polyline points={pts} fill="none" stroke={FUEL} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
        {/* emphasized endpoint */}
        <circle cx={x(series.length - 1)} cy={y(Number(last.kmpl))} r="4" fill={FUEL}
                stroke="#0e1013" strokeWidth="2" />
      </svg>
      <p className="text-xs text-gray-400 mt-1">
        Latest: <span className="text-white font-semibold tabular-nums">{last.kmpl} km/L</span>
      </p>
    </div>
  );
}

// --- Health -----------------------------------------------------------------
const HEALTH_LABEL = { good: 'Healthy', warning: 'Attention soon', critical: 'Action needed', unknown: 'No data' };

function HealthBlock({ health }) {
  const color = healthColor(health.status);
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          {health.score != null && (
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={`${(health.score / 100) * 97.4} 97.4`} />
          )}
        </svg>
        <span className="absolute text-lg font-bold tabular-nums" style={{ color }}>
          {health.score ?? '—'}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color }}>{HEALTH_LABEL[health.status]}</p>
        <div className="mt-1.5 space-y-0.5 text-xs text-gray-400">
          {health.components.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: healthColor(c.health) }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPanel({ vehicleId, onClose }) {
  const { data } = useVehicleAnalytics(vehicleId);
  const coo = data?.cost_of_ownership;

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
            <h2 className="text-lg font-bold tracking-wider">Analytics</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {!data ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                <Section title="Cost of ownership">
                  <div className="grid grid-cols-2 gap-3">
                    <Tile label="Total spend" value={money(coo.total_spend)}
                          sub={coo.purchase_price ? `${money(coo.total_with_purchase)} incl. purchase` : 'fuel + maintenance'} />
                    <Tile label="Cost per km" value={coo.cost_per_km != null ? money2(coo.cost_per_km) : '—'} />
                    <Tile label="Cost per month" value={coo.cost_per_month != null ? money(coo.cost_per_month) : '—'}
                          sub={coo.months_owned ? `over ${coo.months_owned} mo` : undefined} />
                    <Tile label="Distance on record" value={`${Number(coo.total_distance).toLocaleString()} km`} />
                  </div>
                </Section>

                <Section title="Monthly spend (last 12 months)">
                  <MonthlySpend data={data.monthly_spend} />
                </Section>

                <Section title="Vehicle health">
                  <HealthBlock health={data.health} />
                </Section>

                <Section title="Fuel economy trend">
                  <EconomyLine series={data.economy_series} />
                </Section>

                {data.reminders.open > 0 && (
                  <Section title="Reminders">
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-semibold">{data.reminders.open}</span> open
                      {data.reminders.overdue > 0 && (
                        <span className="text-red-400"> · {data.reminders.overdue} overdue</span>
                      )}
                    </p>
                  </Section>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
