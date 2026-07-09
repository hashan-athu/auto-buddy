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
