<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    .d-flex.align-center.gap-2
      v-btn(v-if="cameFromPatient" icon="mdi-arrow-left" variant="text" @click="$router.push('/patients')")
      h2.text-h5.font-weight-bold Eventos
    v-btn(color="primary" @click="openModal()") Novo Evento

  v-card.mb-4(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="6" md="3")
          v-autocomplete(
            v-model="filtersForm.patientId"
            :items="patients"
            item-title="name"
            item-value="_id"
            placeholder="Filtrar Paciente"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="6" md="3")
          v-autocomplete(
            v-model="filtersForm.indicatorName"
            :items="indicators"
            item-title="name"
            item-value="name"
            placeholder="Filtrar Indicador"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="6" md="3")
          v-text-field(
            v-model="filtersForm.subindicatorName"
            placeholder="Buscar Sub-indicador..."
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="6" md="3")
          v-select(
            v-model="filtersForm.range"
            :items="rangeOptions"
            item-title="label"
            item-value="value"
            placeholder="Período"
            density="compact"
            variant="outlined"
            hide-details
          )
      v-row.mt-1(dense align="center")
        v-col(cols="12" sm="6" md="3")
          v-text-field(
            v-model="filtersForm.startDate"
            type="date"
            label="Ocorrência de"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="6" md="3")
          v-text-field(
            v-model="filtersForm.endDate"
            type="date"
            label="até"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            :error="invalidRange"
          )
        v-col(cols="12" sm="6" md="3")
          .text-caption.text-medium-emphasis(v-if="invalidRange") A data final é anterior à inicial
          .text-caption.text-medium-emphasis(v-else-if="hasDateFilter") {{ allEvents.length }} evento(s) no período
        v-col(cols="12" sm="6" md="3")
          v-btn(
            v-if="hasAnyFilter"
            variant="text"
            color="primary"
            prepend-icon="mdi-filter-off"
            @click="clearFilters"
          ) Limpar Filtros

  v-row
    v-col(cols="12" md="6" lg="4" v-for="item in events" :key="item._id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.d-flex.justify-space-between.align-start
          .text-wrap.text-subtitle-1.font-weight-bold.pr-2(style="line-height: 1.2;") {{ item.patientName }}
          .text-caption.text-medium-emphasis.flex-shrink-0.mt-1 {{ formatDate(item.occurrenceDate) }}
        v-card-text.flex-grow-1
          .text-body-2.mb-2
            span.font-weight-bold Indicador: 
            | {{ item.indicator?.name }}
          .text-body-2.mb-2
            span.font-weight-bold Sub-Indicador: 
            | {{ item.subindicator?.name }}
          .text-body-2.mb-2(v-if="item.assistanceType")
            span.font-weight-bold Assistência: 
            span.text-capitalize {{ item.assistanceType }}
          .text-body-2.mb-4
            span.font-weight-bold Obs: 
            span(v-if="item.observations") {{ item.observations }}
            span.text-grey.font-italic(v-else) Nenhuma observação
          
          .d-flex.flex-wrap.gap-1.mt-auto
            v-chip(
              v-if="item.file"
              size="x-small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-download"
              @click="downloadFile(item.file, item.patientId, item._id)"
              style="cursor: pointer"
            ) {{ item.file.name }}
            v-chip(v-else size="x-small" color="grey" variant="tonal" prepend-icon="mdi-paperclip") Nenhum anexo
            
        v-divider
        v-card-actions
          v-spacer
          v-btn(variant="text" color="primary" size="small" icon="mdi-pencil" @click="openModal(item)")
          v-btn(variant="text" color="error" size="small" icon="mdi-delete" @click="deleteEvent(item)")
          
  .d-flex.justify-center.align-center.pa-4.mt-4.gap-4(v-if="totalPages > 1")
    v-pagination(
      v-model="page"
      :length="totalPages"
      :total-visible="5"
      density="compact"
      rounded
    )
    v-text-field.flex-grow-0(
      v-model.number="jumpToPage"
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
          
  EventFormModal(ref="formModal")
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { useConfirm } from '@/composables/useConfirm'
import { downloadFileFromDb, removePatientEvent } from '@/lib/proxy-client'
import { useQueryClient } from '@tanstack/vue-query'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/date-utils'
import EventFormModal from '@/components/EventFormModal.vue'

const route = useRoute()
const router = useRouter()

const {
  data: patients,
  isLoading,
} = useCrud<any>('patients', { defaultPageSize: 1000 })

const queryClient = useQueryClient()
const snackbar = useSnackbarStore()
const auth = useAuthStore()

const { data: indicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const filtersForm = reactive({
  patientId: null as string | null,
  indicatorName: null as string | null,
  subindicatorName: '',
  startDate: '',
  endDate: '',
  range: 'all',
})

const YEAR = new Date().getFullYear()
const rangeOptions = [
  { value: 'all', label: 'Todo o período' },
  { value: 'last30', label: 'Últimos 30 dias' },
  { value: 'last90', label: 'Últimos 90 dias' },
  { value: 'year', label: `Ano de ${YEAR}` },
  { value: 'custom', label: 'Personalizado' },
]

const toISO = (d: Date) => d.toISOString().slice(0, 10)

// Escolher um atalho preenche as datas; mexer nas datas passa para personalizado.
watch(() => filtersForm.range, value => {
  const hoje = new Date()
  if (value === 'all') {
    filtersForm.startDate = ''
    filtersForm.endDate = ''
  } else if (value === 'last30' || value === 'last90') {
    const dias = value === 'last30' ? 30 : 90
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - dias)
    filtersForm.startDate = toISO(inicio)
    filtersForm.endDate = toISO(hoje)
  } else if (value === 'year') {
    filtersForm.startDate = `${YEAR}-01-01`
    filtersForm.endDate = `${YEAR}-12-31`
  }
})

watch([() => filtersForm.startDate, () => filtersForm.endDate], () => {
  const atalho = rangeOptions.find(o => o.value === filtersForm.range)
  if (!atalho || filtersForm.range === 'custom') return
  const esperado = filtersForm.range === 'all'
    ? !filtersForm.startDate && !filtersForm.endDate
    : true
  if (!esperado) filtersForm.range = 'custom'
})

const invalidRange = computed(() =>
  !!filtersForm.startDate && !!filtersForm.endDate && filtersForm.endDate < filtersForm.startDate,
)

const hasDateFilter = computed(() => !!filtersForm.startDate || !!filtersForm.endDate)

const hasAnyFilter = computed(() =>
  !!filtersForm.patientId || !!filtersForm.indicatorName ||
  !!filtersForm.subindicatorName || hasDateFilter.value,
)

const clearFilters = () => {
  filtersForm.patientId = null
  filtersForm.indicatorName = null
  filtersForm.subindicatorName = ''
  filtersForm.startDate = ''
  filtersForm.endDate = ''
  filtersForm.range = 'all'
}

/** Compara só a parte da data (YYYY-MM-DD), ignorando fuso e hora. */
const dentroDoIntervalo = (occurrenceDate?: string) => {
  if (!filtersForm.startDate && !filtersForm.endDate) return true
  if (!occurrenceDate) return false
  const dia = String(occurrenceDate).slice(0, 10)
  if (filtersForm.startDate && dia < filtersForm.startDate) return false
  if (filtersForm.endDate && dia > filtersForm.endDate) return false
  return true
}

const page = ref(1)
const pageSize = 10
const cameFromPatient = ref(false)

onMounted(() => {
  if (route.query.patientId) {
    filtersForm.patientId = route.query.patientId as any
    cameFromPatient.value = true
    router.replace({ query: {} })
  }
})

watch(filtersForm, () => {
  page.value = 1
})

const allEvents = computed(() => {
  if (!patients.value) return []
  const list: any[] = []
  for (const p of patients.value) {
    if (filtersForm.patientId && p._id !== filtersForm.patientId) continue
    if (p.events) {
      for (const e of p.events) {
        if (filtersForm.indicatorName && e.indicator?.name !== filtersForm.indicatorName) continue
        if (filtersForm.subindicatorName && !e.subindicator?.name?.toLowerCase().includes(filtersForm.subindicatorName.toLowerCase())) continue
        if (!dentroDoIntervalo(e.occurrenceDate)) continue
        
        list.push({ ...e, patientId: p._id, patientName: p.name })
      }
    }
  }
  return list.sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
})

const totalPages = computed(() => Math.ceil(allEvents.value.length / pageSize) || 1)

const events = computed(() => {
  const start = (page.value - 1) * pageSize
  return allEvents.value.slice(start, start + pageSize)
})

const formModal = ref<InstanceType<typeof EventFormModal> | null>(null)

const jumpToPage = ref<number | null>(null)
const goToPage = () => {
  if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
    page.value = jumpToPage.value
    jumpToPage.value = null
  }
}
const openModal = (event?: any) => {
  formModal.value?.open(event)
}

const downloadFile = (file: any, patientId: string, eventId: string) => {
  downloadFileFromDb('patients', patientId, 0, file.name, eventId)
}

const { confirm } = useConfirm()

const deleteEvent = async (item: any) => {
  if (!await confirm('Tem certeza que deseja excluir este evento?')) return
  try {
    // Remove só este evento no servidor ($pull), sem reenviar o array inteiro.
    await removePatientEvent(item.patientId, item._id, auth.user?.email ?? '')
    await queryClient.invalidateQueries({ queryKey: ['patients', 'list'] })
    snackbar.show('Evento excluído com sucesso!')
  } catch (error: any) {
    console.error(error)
    snackbar.show(error?.message || 'Erro ao excluir evento', 'error')
  }
}
</script>
