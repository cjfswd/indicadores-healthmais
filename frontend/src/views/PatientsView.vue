<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Pacientes
    
    v-btn(color="primary" @click="openModal()") Novo Paciente

  v-card.mb-4(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="4" md="4")
          v-text-field(
            v-model="filtersForm.name"
            placeholder="Buscar por nome..."
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
            @update:model-value="applySearch"
          )
        v-col(cols="12" sm="4" md="4")
          v-autocomplete(
            v-model="filtersForm.operatorId"
            :items="operators"
            item-title="name"
            item-value="_id"
            placeholder="Filtrar Operadora"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            @update:model-value="applySearch"
          )
        v-col(cols="12" sm="4" md="4")
          v-btn(
            v-if="filtersForm.name || filtersForm.operatorId"
            variant="text"
            color="primary"
            prepend-icon="mdi-filter-off"
            @click="clearFilters"
          ) Limpar Filtros


  v-row
    v-col(cols="12" md="6" lg="4" v-for="item in patients" :key="item._id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.d-flex.justify-space-between.align-start
          .text-wrap.text-subtitle-1.font-weight-bold.pr-2(style="line-height: 1.2;") {{ item.name }}
        v-card-text.flex-grow-1
          .text-body-2.mb-2
            span.font-weight-bold Operadora: 
            | {{ item.operator?.name }}
          .text-body-2.mb-2
            span.font-weight-bold Admissão: 
            span(v-if="item.admissionDate") {{ new Date(item.admissionDate).toLocaleDateString() }}
            span.text-warning.font-italic(v-else) Falta adicionar
          .text-body-2.mb-2
            span.font-weight-bold Nasc.: 
            span(v-if="item.birthDate") {{ new Date(item.birthDate).toLocaleDateString() }}
            span.text-warning.font-italic(v-else) Falta adicionar
          .text-body-2.mb-4
            span.font-weight-bold Obs: 
            span(v-if="item.observations") {{ item.observations }}
            span.text-grey.font-italic(v-else) Nenhuma observação
            
          .d-flex.flex-wrap.gap-1.mt-auto
            v-chip(v-if="item.events && item.events.length" size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-calendar-check") {{ item.events.length }} evento(s)
            v-chip(
              v-if="item.file"
              size="x-small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-download"
              @click="downloadFile(item.file, item._id)"
              style="cursor: pointer"
            ) {{ item.file.name }}
            v-chip(v-else size="x-small" color="grey" variant="tonal" prepend-icon="mdi-paperclip") Nenhum anexo
            
        v-divider
        v-card-actions
          v-btn(variant="text" color="secondary" size="small" prepend-icon="mdi-calendar-search" @click="$router.push({ path: '/events', query: { patientId: item._id } })") Eventos
          v-spacer
          v-btn(variant="text" color="primary" size="small" icon="mdi-pencil" @click="openModal(item)")
          v-btn(variant="text" color="error" size="small" icon="mdi-delete" @click="deletePatient(item._id)")
          
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
          
  PatientFormModal(ref="formModal")
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useConfirm } from '@/composables/useConfirm'
import { downloadFileFromDb } from '@/lib/proxy-client'
import PatientFormModal from '@/components/PatientFormModal.vue'

const {
  data: patients,
  isLoading,
  filters,
  page,
  totalPages,
  remove,
} = useCrud<any>('patients', { defaultPageSize: 10 })

const { data: operators } = useCrud<any>('operators', { defaultPageSize: 100 })

const filtersForm = reactive({
  name: '',
  operatorId: null
})

const clearFilters = () => {
  filtersForm.name = ''
  filtersForm.operatorId = null
  applySearch()
}

const formModal = ref<InstanceType<typeof PatientFormModal> | null>(null)

const applySearch = () => {
  const newFilters: any = {}
  if (filtersForm.name) newFilters.name = { $regex: filtersForm.name, $options: 'i' }
  if (filtersForm.operatorId) newFilters['operator._id'] = filtersForm.operatorId
  
  filters.value = newFilters
  page.value = 1
}

const jumpToPage = ref<number | null>(null)
const goToPage = () => {
  if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
    page.value = jumpToPage.value
    jumpToPage.value = null
  }
}
const openModal = (patient?: any) => {
  formModal.value?.open(patient)
}

const { confirm } = useConfirm()

const downloadFile = (file: any, docId: string) => {
  downloadFileFromDb('patients', docId, 0, file.name)
}

const deletePatient = async (id: string) => {
  if (!await confirm('Tem certeza que deseja excluir este paciente?')) return
  await remove(id)
}
</script>
