import { useQuery } from '@tanstack/react-query';
import { api } from './client';

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
