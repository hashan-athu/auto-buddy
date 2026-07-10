import { useQuery } from '@tanstack/react-query';
import { api } from './client';

async function fetchVehicles() {
  const { data } = await api.get('/vehicles/');
  // DRF pagination wraps the list in `results`.
  return data.results ?? data;
}

export function useVehicles() {
  return useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
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
