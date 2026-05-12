import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { dbExecute } from '@/lib/proxy-client';
import { ref, computed } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
export function useCrud(collectionName, options = {}) {
    const queryClient = useQueryClient();
    const snackbar = useSnackbarStore();
    // State for pagination, filtering and sorting
    const page = ref(1);
    const pageSize = ref(options.defaultPageSize || 10);
    const filters = ref({});
    const sortBy = ref([['_id', -1]]);
    const total = ref(0);
    const skip = computed(() => (page.value - 1) * pageSize.value);
    const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
    // Reactive query key so it refetches automatically when state changes
    const queryKey = computed(() => [collectionName, 'list', page.value, pageSize.value, filters.value, sortBy.value, options.pipeline]);
    // 1. READ: Fetch all documents
    const listQuery = useQuery({
        queryKey,
        queryFn: async () => {
            if (options.pipeline && options.pipeline.length > 0) {
                // If pipeline is provided, use aggregate action
                // Note: skip and limit could be appended to the pipeline if needed
                const fullPipeline = [...options.pipeline];
                // Optionally handle pagination in pipeline:
                // fullPipeline.push({ $skip: skip.value }, { $limit: pageSize.value })
                const res = await dbExecute({
                    action: 'aggregate',
                    collection: collectionName,
                    pipeline: fullPipeline
                });
                return res.result || [];
            }
            const res = await dbExecute({
                action: 'find',
                collection: collectionName,
                query: filters.value,
                skip: skip.value,
                limit: pageSize.value,
                sort: sortBy.value
            });
            if (res.total !== undefined) {
                total.value = res.total;
            }
            return res.result || [];
        },
        ...options.queryOptions,
    });
    // Helper to invalidate queries related to this collection
    const invalidateList = () => {
        queryClient.invalidateQueries({ queryKey: [collectionName, 'list'] });
    };
    // 2. CREATE: Insert a new document
    const createMutation = useMutation({
        mutationFn: async (newData) => {
            const res = await dbExecute({
                action: 'insert', // Changed 'insertOne' to 'insert' to match proxy-client
                collection: collectionName,
                data: newData, // Changed 'payload' to 'data' to match proxy-client
            });
            return res;
        },
        onSuccess: () => {
            invalidateList();
            snackbar.show('Registro criado com sucesso!');
        },
        onError: (err) => {
            snackbar.show(err.message || 'Erro ao criar registro', 'error');
        }
    });
    // 3. UPDATE: Update an existing document
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await dbExecute({
                action: 'update',
                collection: collectionName,
                id: id,
                data: data, // Removed forced $set wrapping so it supports $push/$pull
            });
            return res;
        },
        onSuccess: () => {
            invalidateList();
            snackbar.show('Registro atualizado com sucesso!');
        },
        onError: (err) => {
            snackbar.show(err.message || 'Erro ao atualizar registro', 'error');
        }
    });
    // 4. DELETE: Delete a document
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await dbExecute({
                action: 'delete', // Changed to 'delete'
                collection: collectionName,
                id: id, // Changed to 'id'
            });
            return res;
        },
        onSuccess: () => {
            invalidateList();
            snackbar.show('Registro excluído com sucesso!');
        },
        onError: (err) => {
            snackbar.show(err.message || 'Erro ao excluir registro', 'error');
        }
    });
    return {
        // Query State
        data: listQuery.data,
        isLoading: listQuery.isLoading,
        isFetching: listQuery.isFetching,
        error: listQuery.error,
        // Pagination & Filter State
        page,
        pageSize,
        filters,
        sortBy,
        total,
        totalPages,
        // Actions
        refetch: listQuery.refetch,
        // Mutations
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
        // Mutation states
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
