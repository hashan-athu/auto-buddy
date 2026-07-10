import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export function useVehicleAnalytics(vehicleId) {
  return useQuery({
    queryKey: ['vehicle-analytics', vehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles/${vehicleId}/analytics/`);
      return data;
    },
    enabled: !!vehicleId,
  });
}
