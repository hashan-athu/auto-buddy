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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-records', vehicleId] });
      qc.invalidateQueries({ queryKey: ['vehicle-summary', vehicleId] });
    },
  });
}
