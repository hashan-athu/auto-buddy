import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { useAppStore } from '../store/useAppStore';

async function fetchVehicles() {
  const { data } = await api.get('/vehicles/');
  // DRF pagination wraps the list in `results`.
  return data.results ?? data;
}

export function useVehicles() {
  return useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
}

// The vehicle currently in focus: the store's activeVehicleId, or the first one.
export function useActiveVehicle() {
  const { data: vehicles } = useVehicles();
  const activeVehicleId = useAppStore((s) => s.activeVehicleId);
  const active =
    vehicles?.find((v) => v.id === activeVehicleId) ?? vehicles?.[0] ?? null;
  return { vehicle: active, vehicles: vehicles ?? [] };
}

export function useVehicleSummary(vehicleId) {
  return useQuery({
    queryKey: ['vehicle-summary', vehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles/${vehicleId}/summary/`);
      return data;
    },
    enabled: !!vehicleId,
  });
}
