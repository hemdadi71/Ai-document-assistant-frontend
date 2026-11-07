import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useWorkspaceData(enabled: boolean) {
  const health = useQuery({ queryKey: queryKeys.health, queryFn: api.health, enabled, retry: 1, refetchInterval: enabled ? 45_000 : false });
  const documents = useQuery({ queryKey: queryKeys.documents, queryFn: api.documents, enabled, retry: 1 });
  return { health, documents };
}
