<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Usuários
    
    .d-flex.gap-4
      v-text-field(
        v-model="search"
        placeholder="Buscar usuário..."
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-magnify"
        class="max-w-xs"
        @update:model-value="applySearch"
      )
      v-btn(color="primary" disabled) Novo Usuário (Em breve)

  v-card(elevation="1")
    v-data-table(
      :items="users"
      :headers="headers"
      :loading="isLoading"
      hover
    )
      template(v-slot:item.actions="{ item }")
        .d-flex.gap-2.justify-end
          v-btn(variant="text" color="error" size="small" icon="mdi-delete" @click="deleteUser(item._id)")
      
      template(v-slot:bottom)
        .d-flex.justify-center.align-center.pa-4.gap-4
          v-btn(icon="mdi-chevron-left" variant="text" :disabled="page === 1" @click="page--")
          span Página {{ page }} de {{ totalPages || 1 }}
          v-btn(icon="mdi-chevron-right" variant="text" :disabled="page >= totalPages" @click="nextPage")
          
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useConfirm } from '@/composables/useConfirm'

const {
  data: users,
  isLoading,
  filters,
  page,
  totalPages,
  remove,
} = useCrud<any>('users', { defaultPageSize: 10 })

const search = ref('')

const headers = [
  { title: 'Nome', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

const applySearch = () => {
  filters.value = search.value ? { name: { $regex: search.value, $options: 'i' } } : {}
  page.value = 1
}

const nextPage = () => {
  if (page.value < totalPages.value) page.value++
}

const { confirm } = useConfirm()

const deleteUser = async (id: string) => {
  if (!await confirm('Tem certeza que deseja excluir este usuário?')) return
  await remove(id)
}
</script>
