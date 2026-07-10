import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export const DOCUMENT_TYPES = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'registration', label: 'Registration' },
  { value: 'license', label: 'License' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
];

export function useDocuments(vehicleId) {
  return useQuery({
    queryKey: ['documents', vehicleId],
    queryFn: async () => {
      const { data } = await api.get('/documents/', { params: { vehicle: vehicleId } });
      return data.results ?? data;
    },
    enabled: !!vehicleId,
  });
}

export function useUploadDocument(vehicleId) {
  const qc = useQueryClient();
  return useMutation({
    // fields: { type, title, expiry_date, issuer, file (File) }
    mutationFn: async (fields) => {
      const form = new FormData();
      form.append('vehicle', vehicleId);
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== '' && v != null) form.append(k, v);
      });
      const { data } = await api.post('/documents/', form);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', vehicleId] });
      // A new expiry date may spawn a reminder on the next engine run.
      qc.invalidateQueries({ queryKey: ['reminders', vehicleId] });
    },
  });
}
