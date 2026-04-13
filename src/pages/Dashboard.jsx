import React, { useState } from 'react';
import GarageInterior from '../components/canvas/GarageInterior';
import DashboardSidebar from '../components/ui/DashboardSidebar';
import { MOCK_DATA } from '../constants/const';

export default function Dashboard() {
  const [showHUD, setShowHUD] = useState(true);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <GarageInterior />
      
      {/* 2D HUD Overlays */}
      {showHUD && (
        <div className="absolute top-6 left-6 z-10 pointer-events-none text-white backdrop-blur-md bg-black/40 p-4 rounded border border-white/10">
          <h1 className="text-2xl font-bold tracking-widest">{MOCK_DATA.vehicle.model}</h1>
          <div className="mt-2 text-sm text-gray-300 space-y-1">
            <p>Maintenance: ${MOCK_DATA.vehicle.general.totalMaintenanceCost}</p>
            <p>Fuel: ${MOCK_DATA.vehicle.general.fuelCost}</p>
            <p>Running: {MOCK_DATA.vehicle.general.dailyRunningRecords} km</p>
          </div>
        </div>
      )}

      {/* Button to toggle HUD for immersion */}
      <button 
        onClick={() => setShowHUD(!showHUD)}
        className="absolute bottom-6 left-6 z-10 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded backdrop-blur border border-white/20 transition-colors pointer-events-auto text-sm"
      >
        {showHUD ? 'Hide HUD' : 'Show HUD'}
      </button>

      <DashboardSidebar />
    </div>
  );
}
