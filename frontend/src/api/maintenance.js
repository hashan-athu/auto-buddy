import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export const MAINTENANCE_CATEGORIES = [
  { value: 'oil_change', label: 'Oil change' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'battery', label: 'Battery' },
  { value: 'service', label: 'General service' },
  { value: 'repair', label: 'Repair' },
  { value: 'other', label: 'Other' },
];

function invalidate(qc, vehicleId) {
  qc.invalidateQueries({ queryKey: ['maintenance-records', vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-summary', vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-analytics', vehicleId] });
}

export function useMaintenanceRecords(vehicleId) {
  return useQuery({
    queryKey: ['maintenance-records', vehicleId],
    queryFn: async () => {
      const { data } = await api.get('/maintenance-records/', {
        params: { vehicle: vehicleId },
      });
      return data.results ?? data;
    },
    enabled: !!vehicleId,
  });
}

export function useAddMaintenanceRecord(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/maintenance-records/', {
        vehicle: vehicleId,
        ...payload,
      });
      return data;
    },
    onSuccess: () => invalidate(qc, vehicleId),
  });
}

export function useUpdateMaintenanceRecord(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/maintenance-records/${id}/`, patch);
      return data;
    },
    onSuccess: () => invalidate(qc, vehicleId),
  });
}

export function useDeleteMaintenanceRecord(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/maintenance-records/${id}/`);
    },
    onSuccess: () => invalidate(qc, vehicleId),
  });
}
