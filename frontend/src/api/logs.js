import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Invalidate a record list plus everything derived from it (summary, analytics,
// vehicle odometer) after a create/update/delete.
function invalidateVehicleData(qc, key, vehicleId) {
  qc.invalidateQueries({ queryKey: [key, vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-summary', vehicleId] });
  qc.invalidateQueries({ queryKey: ['vehicle-analytics', vehicleId] });
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

export function useUpdateRunningLog(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/running-logs/${id}/`, patch);
      return data;
    },
    onSuccess: () => invalidateVehicleData(qc, 'running-logs', vehicleId),
  });
}

export function useDeleteRunningLog(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/running-logs/${id}/`);
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

export function useUpdateFuelEntry(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/fuel-entries/${id}/`, patch);
      return data;
    },
    onSuccess: () => invalidateVehicleData(qc, 'fuel-entries', vehicleId),
  });
}

export function useDeleteFuelEntry(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/fuel-entries/${id}/`);
    },
    onSuccess: () => invalidateVehicleData(qc, 'fuel-entries', vehicleId),
  });
}
