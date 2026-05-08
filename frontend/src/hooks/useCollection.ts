import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbExecute } from '@/lib/proxy-client';

export function useCollection<T = any>(collection: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [collection],
    queryFn: async () => {
      const res = await dbExecute({ action: 'find', collection, query: { deletedAt: null } });
      return res.result as T[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { _id, ...cleanData } = data;
      if (_id) {
        return dbExecute({ action: 'update', collection, id: _id, data: { $set: cleanData } });
      }
      return dbExecute({ action: 'insert', collection, data: cleanData });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collection] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return dbExecute({ action: 'delete', collection, id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collection] })
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
    isRemoving: deleteMutation.isPending
  };
}
