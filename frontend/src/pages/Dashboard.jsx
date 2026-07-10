import React, { useState } from 'react';
import GarageInterior from '../components/canvas/GarageInterior';
import DashboardSidebar from '../components/ui/DashboardSidebar';
import RecordsPanel from '../components/records/RecordsPanel';
import { MOCK_DATA } from '../constants/const';
import { useVehicles, useVehicleSummary } from '../api/vehicles';

export default function Dashboard() {
  const [showHUD, setShowHUD] = useState(true);
  const [showRecords, setShowRecords] = useState(false);
  const { data: vehicles } = useVehicles();
  // First vehicle in the garage for now (multi-vehicle select lands in Phase 3).
  const vehicle = vehicles?.[0];
  const { data: summary } = useVehicleSummary(vehicle?.id);

  const title = vehicle ? `${vehicle.make} ${vehicle.model}` : MOCK_DATA.vehicle.model;
  const odometer = summary?.current_odometer ?? vehicle?.current_odometer ?? 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <GarageInterior />

      {/* 2D HUD Overlays — now backed by the real vehicle summary */}
      {showHUD && (
        <div className="absolute top-6 left-6 z-10 pointer-events-none text-white backdrop-blur-md bg-black/40 p-4 rounded border border-white/10">
          <h1 className="text-2xl font-bold tracking-widest">{title}</h1>
          <div className="mt-2 text-sm text-gray-300 space-y-1">
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
    </div>
  );
}
