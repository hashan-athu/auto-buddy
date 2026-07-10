import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { useAppStore } from '../store/useAppStore';

export const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
  { value: 'other', label: 'Other' },
];

export const VEHICLE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'stored', label: 'Stored' },
  { value: 'sold', label: 'Sold' },
];

async function fetchVehicles() {
  const { data } = await api.get('/vehicles/');
  // DRF pagination wraps the list in `results`.
  return data.results ?? data;
}

export function useVehicles() {
  return useQuery({ queryKey: ['vehicles'], queryFn: fetchVehicles });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/vehicles/', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/vehicles/${id}/`, patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/vehicles/${id}/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
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
