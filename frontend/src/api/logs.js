import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Invalidate the record list plus anything derived from it (summary, vehicle
// odometer) after a successful mutation.
function invalidateVehicleData(qc, key, vehicleId) {
  qc.invalidateQueries({ queryKey: [key, vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-summary', vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicles'] });
}

// --- Running logs ----------------------------------------------------------
export function useRunningLogs(vehicleId) {
  return useQuery({
    queryKey: ['running-logs', vehicleId],
    queryFn: async () => {
      const { data } = await api.get('/running-logs/', { params: { vehicle: vehicleId } });
      return data.results ?? data;
    },
    enabled: !!vehicleId,
  });
}

export function useAddRunningLog(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/running-logs/', { vehicle: vehicleId, ...payload });
      return data;
    },
    onSuccess: () => invalidateVehicleData(qc, 'running-logs', vehicleId),
  });
}

// --- Fuel entries ----------------------------------------------------------
export function useFuelEntries(vehicleId) {
  return useQuery({
    queryKey: ['fuel-entries', vehicleId],
    queryFn: async () => {
      const { data } = await api.get('/fuel-entries/', { params: { vehicle: vehicleId } });
      return data.results ?? data;
    },
    enabled: !!vehicleId,
  });
}

export function useAddFuelEntry(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/fuel-entries/', { vehicle: vehicleId, ...payload });
      return data;
    },
    onSuccess: () => invalidateVehicleData(qc, 'fuel-entries', vehicleId),
  });
}
