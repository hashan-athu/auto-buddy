import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Current user. Returns null (rather than throwing) when unauthenticated so the
// UI can treat "logged out" as a normal state.
async function fetchMe() {
  try {
    const { data } = await api.get('/auth/me/');
    return data;
  } catch (err) {
    if (err.response && err.response.status === 403) return null;
    throw err;
  }
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 60_000 });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, password }) => {
      const { data } = await api.post('/auth/login/', { username, password });
      return data;
    },
    onSuccess: (user) => {
      qc.setQueryData(['me'], user);
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout/');
    },
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ queryKey: ['vehicles'] });
    },
  });
}
