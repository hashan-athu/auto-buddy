import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// vehicleId optional — omit to pull every open reminder across the garage.
export function useReminders(vehicleId, { status } = {}) {
  return useQuery({
    queryKey: ['reminders', vehicleId, status],
    queryFn: async () => {
      const params = {};
      if (vehicleId) params.vehicle = vehicleId;
      if (status) params.status = status;
      const { data } = await api.get('/reminders/', { params });
      return data.results ?? data;
    },
  });
}

export function useAddReminder(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/reminders/', { vehicle: vehicleId, ...payload });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders', vehicleId] }),
  });
}

export function useUpdateReminder(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await api.patch(`/reminders/${id}/`, patch);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders', vehicleId] }),
  });
}

export function useDeleteReminder(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/reminders/${id}/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders', vehicleId] }),
  });
}

// Runs the reminder engine for the current user's vehicles (no cron locally).
export function useRunReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/reminders/run/');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });
}
