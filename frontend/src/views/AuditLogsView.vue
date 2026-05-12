<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Event Store — Histórico de Eventos

  v-card.mb-4(elevation="0" border)
    v-card-text.pa-3
      v-row(dense)
        v-col(cols="12" md="4")
          v-text-field(
            v-model="filtersForm.search"
            placeholder="Buscar por Stream ID..."
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
            @update:model-value="applySearch"
          )
        v-col(cols="12" md="4")
          v-select(
            v-model="filtersForm.streamType"
            :items="streamTypeOptions"
            placeholder="Filtrar Collection"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            @update:model-value="applySearch"
          )
        v-col(cols="12" md="4")
          v-select(
            v-model="filtersForm.eventType"
            :items="eventTypeOptions"
            placeholder="Filtrar Tipo de Evento"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            @update:model-value="applySearch"
          )

  //- Loading state
  .d-flex.justify-center.py-8(v-if="isLoading")
    v-progress-circular(indeterminate color="primary")

  //- Empty state
  v-alert(v-else-if="!events || !events.length" type="info" variant="tonal" border="start")
    | Nenhum evento encontrado. Os eventos são registrados automaticamente ao criar, atualizar ou excluir registros.

  //- Events grid
  v-row(v-else)
    v-col(cols="12" md="6" lg="4" v-for="item in events" :key="item._id")
      v-card(elevation="1" class="h-100 d-flex flex-column" @click="openHistory(item)")
        v-card-title.d-flex.justify-space-between.align-start
          .d-flex.flex-column(style="max-width: 70%")
            span.text-body-1.font-weight-bold.text-truncate {{ getStreamTypeLabel(item.streamType) }}
            span.text-caption.text-medium-emphasis Stream: {{ item.streamId }}
          v-chip(
            :color="eventTypeColor(item.eventType)"
            size="small"
            variant="flat"
          ) {{ item.eventType }}

        v-card-text.pt-1.flex-grow-1.d-flex.flex-column
          .d-flex.align-center.gap-2.mb-1
            v-icon(size="small" color="grey") mdi-clock-outline
            span.text-body-2.text-medium-emphasis {{ formatTimestamp(item.timestamp) }}

          .d-flex.align-center.gap-2.mb-1
            v-icon(size="small" color="grey") mdi-counter
            span.text-body-2.text-medium-emphasis Versão: {{ item.version }}

          .d-flex.align-center.gap-2.mb-2(v-if="item.actor")
            v-icon(size="small" color="grey") mdi-account-outline
            span.text-body-2.text-medium-emphasis {{ item.actor }}

          .d-flex.flex-wrap.gap-1.mt-auto
            v-chip(size="x-small" color="info" variant="tonal" prepend-icon="mdi-database")
              | {{ item.streamType }}
            v-chip(size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-source-commit")
              | v{{ item.version }}

        v-divider
        v-card-actions
          v-spacer
          v-btn(size="small" color="primary" variant="text" prepend-icon="mdi-eye")
            | Ver Stream Completo

  //- Pagination
  .d-flex.justify-center.align-center.gap-4.mt-4(v-if="totalPages > 1")
    v-pagination(
      v-model="page"
      :length="totalPages"
      :total-visible="5"
      density="compact"
    )
    span.text-caption.text-medium-emphasis {{ page }} de {{ totalPages }}
    v-text-field(
      v-model.number="jumpPage"
      type="number"
      variant="outlined"
      density="compact"
      hide-details
      placeholder="Ir p/"
      style="max-width: 80px"
      :min="1"
      :max="totalPages"
      @keydown.enter="goToPage"
    )

  //- History Modal
  AuditHistoryModal(ref="historyModal")
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { fetchEventStoreLogs } from '@/lib/proxy-client'
import { useQuery } from '@tanstack/vue-query'
import AuditHistoryModal from '@/components/AuditHistoryModal.vue'

const streamTypeOptions = ['patients', 'operators', 'indicators']
const eventTypeOptions = ['CREATE', 'UPDATE', 'SOFT_DELETE']

const filtersForm = reactive({
  search: '',
  streamType: null as string | null,
  eventType: null as string | null,
})

const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const jumpPage = ref<number | null>(null)

const skip = computed(() => (page.value - 1) * pageSize.value)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const buildQuery = () => {
  const q: Record<string, any> = {}
  if (filtersForm.search) {
    q.streamId = filtersForm.search
  }
  if (filtersForm.streamType) {
    q.streamType = filtersForm.streamType
  }
  if (filtersForm.eventType) {
    q.eventType = filtersForm.eventType
  }
  return q
}

const queryKey = computed(() => ['events_store', 'list', page.value, pageSize.value, filtersForm.search, filtersForm.streamType, filtersForm.eventType])

const { data: events, isLoading } = useQuery<any[]>({
  queryKey,
  queryFn: async () => {
    const res = await fetchEventStoreLogs<any>({
      query: buildQuery(),
      skip: skip.value,
      limit: pageSize.value,
      sort: [['timestamp', -1]],
    })
    if (res.total !== undefined) {
      total.value = res.total
    }
    return res.result || []
  }
})

const applySearch = () => {
  page.value = 1
}

const goToPage = () => {
  if (jumpPage.value && jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    page.value = jumpPage.value
    jumpPage.value = null
  }
}

const getStreamTypeLabel = (streamType: string) => {
  const labels: Record<string, string> = {
    patients: 'Paciente',
    operators: 'Operadora',
    indicators: 'Indicador',
  }
  return labels[streamType] || streamType
}

const eventTypeColor = (eventType: string) => {
  const colors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    SOFT_DELETE: 'error',
  }
  return colors[eventType] || 'grey'
}

const formatTimestamp = (ts: string | Date) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const historyModal = ref<InstanceType<typeof AuditHistoryModal> | null>(null)

const openHistory = (eventItem: any) => {
  historyModal.value?.open(eventItem.streamType, eventItem.streamId)
}
</script>
