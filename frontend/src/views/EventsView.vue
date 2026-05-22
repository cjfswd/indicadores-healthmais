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
          v-btn(
            v-if="filtersForm.patientId || filtersForm.indicatorName || filtersForm.subindicatorName"
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
import { dbExecute, downloadFileFromDb } from '@/lib/proxy-client'
import { formatDate } from '@/lib/date-utils'
import EventFormModal from '@/components/EventFormModal.vue'

const route = useRoute()
const router = useRouter()

const {
  data: patients,
  isLoading,
  update: updatePatient,
} = useCrud<any>('patients', { defaultPageSize: 1000 })

const { data: indicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const filtersForm = reactive({
  patientId: null,
  indicatorName: null,
  subindicatorName: ''
})

const clearFilters = () => {
  filtersForm.patientId = null
  filtersForm.indicatorName = null
  filtersForm.subindicatorName = ''
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
    const res = await dbExecute({ action: 'findOne', collection: 'patients', id: item.patientId })
    if (res.success && res.result) {
      const newEvents = (res.result.events || []).filter((e: any) => e._id !== item._id)
      await updatePatient({ id: item.patientId, data: { events: newEvents } })
    }
  } catch (error) {
    console.error(error)
  }
}
</script>
