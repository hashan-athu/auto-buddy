import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export const COMPONENT_CATEGORIES = [
  { value: 'tyre', label: 'Tyre' },
  { value: 'engine', label: 'Engine' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'battery', label: 'Battery' },
  { value: 'oil', label: 'Oil' },
  { value: 'other', label: 'Other' },
];

export const HEALTH_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'warning', label: 'Attention soon' },
  { value: 'critical', label: 'Action needed' },
];

function invalidate(qc, vehicleId) {
  qc.invalidateQueries({ queryKey: ['components', vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-analytics', vehicleId] });
}

export function useComponents(vehicleId) {
  return useQuery({
    queryKey: ['components', vehicleId],
    queryFn: async () => {
      const { data } = await api.get('/components/', { params: { vehicle: vehicleId } });
      return data.results ?? data;
    },
    enabled: !!vehicleId,
  });
}

export function useAddComponent(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/components/', { vehicle: vehicleId, ...payload });
      return data;
    },
    onSuccess: () => invalidate(qc, vehicleId),
  });
}

export function useUpdateComponent(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/components/${id}/`, patch);
      return data;
    },
    onSuccess: () => invalidate(qc, vehicleId),
  });
}
