import React, { useState, useEffect } from 'react';
import GarageInterior from '../components/canvas/GarageInterior';
import DashboardSidebar from '../components/ui/DashboardSidebar';
import RecordsPanel from '../components/records/RecordsPanel';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import VehiclesPanel from '../components/vehicles/VehiclesPanel';
import { useActiveVehicle, useVehicleSummary } from '../api/vehicles';
import { useRunReminders } from '../api/reminders';
import { useLogout } from '../api/auth';
import { useAppStore } from '../store/useAppStore';

export default function Dashboard() {
  const [showHUD, setShowHUD] = useState(true);
  const [showRecords, setShowRecords] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const { vehicle, vehicles } = useActiveVehicle();
  const setActiveVehicleId = useAppStore((s) => s.setActiveVehicleId);
  const logOut = useAppStore((s) => s.logOut);
  const { data: summary } = useVehicleSummary(vehicle?.id);
  const runReminders = useRunReminders();
  const logout = useLogout();

  // No cron locally — refresh reminders (and send any due emails) once on entry.
  const { mutate: runRemindersMutate } = runReminders;
  useEffect(() => { runRemindersMutate(); }, [runRemindersMutate]);

  const onLogout = () => logout.mutate(undefined, { onSuccess: logOut });

  const title = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Your Garage';
  const odometer = summary?.current_odometer ?? vehicle?.current_odometer ?? 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <GarageInterior />

      {/* Log out (top-right) */}
      <button
        onClick={onLogout}
        disabled={logout.isPending}
        className="absolute top-6 right-6 z-10 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur border border-white/20 transition-colors pointer-events-auto text-sm disabled:opacity-50"
      >
        {logout.isPending ? 'Logging out…' : 'Log out'}
      </button>

      {/* 2D HUD Overlays — backed by the real vehicle summary */}
      {showHUD && (
        <div className="absolute top-6 left-6 z-10 text-white backdrop-blur-md bg-black/40 p-4 rounded border border-white/10">
          {/* Vehicle switcher appears once there's more than one car */}
          {vehicles.length > 1 && (
            <select
              value={vehicle?.id ?? ''}
              onChange={(e) => setActiveVehicleId(Number(e.target.value))}
              className="mb-2 w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-neutral-900">
                  {v.make} {v.model}
                </option>
              ))}
            </select>
          )}
          <h1 className="text-2xl font-bold tracking-widest pointer-events-none">{title}</h1>
          <div className="mt-2 text-sm text-gray-300 space-y-1 pointer-events-none">
            <p>Maintenance: ${Number(summary?.maintenance_cost ?? 0).toLocaleString()}</p>
            <p>Fuel: ${Number(summary?.fuel_cost ?? 0).toLocaleString()}</p>
            <p>Odometer: {Number(odometer).toLocaleString()} km</p>
          </div>
        </div>
      )}

      {/* Bottom-left controls */}
      <div className="absolute bottom-6 left-6 z-10 flex gap-3">
        <button
          onClick={() => setShowRecords(true)}
          className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors pointer-events-auto text-sm"
        >
          Open Records
        </button>
        <button
          onClick={() => setShowAnalytics(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur border border-white/20 transition-colors pointer-events-auto text-sm"
        >
          Analytics
        </button>
        <button
          onClick={() => setShowVehicles(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur border border-white/20 transition-colors pointer-events-auto text-sm"
        >
          Garage
        </button>
        <button
          onClick={() => setShowHUD(!showHUD)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur border border-white/20 transition-colors pointer-events-auto text-sm"
        >
          {showHUD ? 'Hide HUD' : 'Show HUD'}
        </button>
      </div>

      <DashboardSidebar />

      {showRecords && vehicle && (
        <RecordsPanel vehicleId={vehicle.id} onClose={() => setShowRecords(false)} />
      )}

      {showAnalytics && vehicle && (
        <AnalyticsPanel vehicleId={vehicle.id} onClose={() => setShowAnalytics(false)} />
      )}

      {showVehicles && <VehiclesPanel onClose={() => setShowVehicles(false)} />}
    </div>
  );
}
