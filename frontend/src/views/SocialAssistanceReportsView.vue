<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Formulário de Assistência Social e Ouvidoria
    v-btn(variant="text" color="primary" prepend-icon="mdi-content-copy" @click="copyPublicLink") Copiar link público

  v-tabs(v-model="statusFilter" class="mb-4")
    v-tab(value="pendente") Pendentes ({{ pendingCount }})
    v-tab(value="vinculado") Vinculados
    v-tab(value="descartado") Descartados

  v-row(v-if="filteredReports.length")
    v-col(cols="12" md="6" lg="4" v-for="item in filteredReports" :key="item._id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.d-flex.justify-space-between.align-start
          .text-wrap.text-subtitle-1.font-weight-bold.pr-2(style="line-height: 1.2;") {{ item.patientNameRaw }}
          .text-caption.text-medium-emphasis.flex-shrink-0.mt-1 {{ formatDate(item.occurrenceDate) }}
        v-card-text.flex-grow-1
          v-chip.mb-2(size="x-small" :color="categoryColor(item)" variant="tonal") {{ categoryLabel(item) }}
          .text-body-2.mb-2
            span.font-weight-bold Tipo:
            | {{ item.subindicator?.name }}
          .text-body-2.mb-2(v-if="item.reporterName")
            span.font-weight-bold Denunciante:
            | {{ item.reporterName }}
          .text-body-2.mb-2(v-if="item.reporterContact")
            span.font-weight-bold Contato:
            | {{ item.reporterContact }}
          .text-body-2.mb-2
            span.font-weight-bold Obs:
            | {{ item.observations }}
          .d-flex.flex-wrap.gap-1.mt-auto
            v-chip(
              v-if="item.file"
              size="x-small"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-download"
              @click="downloadFile(item.file, item._id)"
              style="cursor: pointer"
            ) {{ item.file.name }}
            v-chip(v-if="item.status === 'vinculado'" size="x-small" color="success" variant="tonal" prepend-icon="mdi-check") Vinculado a {{ item.linkedPatientName || 'paciente' }}
        v-divider
        v-card-actions(v-if="item.status === 'pendente'")
          v-spacer
          v-btn(variant="text" color="error" size="small" @click="discard(item)") Descartar
          v-btn(variant="flat" color="primary" size="small" @click="openLinkDialog(item)") Vincular a paciente

  v-card(v-else elevation="0" border class="pa-8 text-center")
    v-icon(size="48" color="grey-lighten-1") mdi-clipboard-text-outline
    .text-body-2.text-grey.mt-2 Nenhum registro nesta categoria

  v-dialog(v-model="linkDialogOpen" max-width="480px")
    v-card
      v-card-title.text-h6.font-weight-bold.pa-4 Vincular a paciente
      v-card-text.pa-4
        p.text-body-2.text-medium-emphasis.mb-4 Selecione o paciente cadastrado que corresponde a "{{ activeReport?.patientNameRaw }}". Isso criará um evento no histórico do paciente.
        v-autocomplete(
          v-model="selectedPatientId"
          :items="patients"
          item-title="name"
          item-value="_id"
          label="Paciente *"
          variant="outlined"
          :loading="isLoadingPatients"
          hide-details
        )
      v-card-actions.pa-4.pt-0
        v-spacer
        v-btn(variant="text" @click="linkDialogOpen = false") Cancelar
        v-btn(color="primary" variant="flat" :disabled="!selectedPatientId" :loading="isLinking" @click="confirmLink") Vincular
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useCrud } from '@/composables/useCrud'
import { useConfirm } from '@/composables/useConfirm'
import { dbExecute, downloadFileFromDb } from '@/lib/proxy-client'
import { formatDate } from '@/lib/date-utils'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { NotificationService } from '@/services/NotificationService'

const snackbar = useSnackbarStore()
const { confirm } = useConfirm()

const {
  data: reports,
  update: updateReport,
  remove: removeReport,
  refetch: refetchReports,
} = useCrud<any>('social_assistance_reports', { defaultPageSize: 200 })

const { data: patients, isLoading: isLoadingPatients } = useCrud<any>('patients', { defaultPageSize: 1000 })
const queryClient = useQueryClient()

const statusFilter = ref('pendente')

const allReports = computed(() => reports.value ?? [])
const pendingCount = computed(() => allReports.value.filter(r => r.status === 'pendente').length)
const filteredReports = computed(() =>
  allReports.value
    .filter(r => (r.status ?? 'pendente') === statusFilter.value)
    .sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
)

const categoryLabel = (item: any) => {
  if (item.indicator?.name?.startsWith('08')) return 'Evento Adverso'
  if (item.indicator?.name?.startsWith('09')) return 'Ouvidoria'
  return 'Assistência Social'
}

const categoryColor = (item: any) => {
  if (item.indicator?.name?.startsWith('08')) return 'warning'
  if (item.indicator?.name?.startsWith('09')) return 'info'
  return 'secondary'
}

const downloadFile = (file: any, reportId: string) => {
  downloadFileFromDb('social_assistance_reports', reportId, 0, file.name)
}

const copyPublicLink = async () => {
  const url = `${window.location.origin}/formulario/registro-de-ocorrencia`
  await navigator.clipboard.writeText(url)
  snackbar.show('Link copiado para a área de transferência!')
}

const discard = async (item: any) => {
  if (!await confirm('Tem certeza que deseja descartar este registro?')) return
  await updateReport({ id: item._id, data: { status: 'descartado' } })
}

const linkDialogOpen = ref(false)
const activeReport = ref<any | null>(null)
const selectedPatientId = ref<string | null>(null)
const isLinking = ref(false)

const openLinkDialog = (item: any) => {
  activeReport.value = item
  selectedPatientId.value = null
  linkDialogOpen.value = true
}

const generateObjectId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

const confirmLink = async () => {
  if (!activeReport.value || !selectedPatientId.value) return
  const patient = patients.value?.find((p: any) => p._id === selectedPatientId.value)
  if (!patient) return

  isLinking.value = true
  try {
    const report = activeReport.value

    const reporterLine = report.reporterName
      ? `Denunciante: ${report.reporterName}${report.reporterContact ? ` (contato: ${report.reporterContact})` : ''}`
      : report.reporterContact
        ? `Contato do denunciante: ${report.reporterContact}`
        : ''

    const observations = reporterLine
      ? `${reporterLine}\n\n${report.observations}`
      : report.observations

    const newEvent = {
      _id: generateObjectId(),
      occurrenceDate: report.occurrenceDate,
      indicator: report.indicator,
      subindicator: { _id: generateObjectId(), ...report.subindicator },
      observations,
      file: report.file ?? null,
    }

    await dbExecute({
      action: 'update',
      collection: 'patients',
      id: patient._id,
      data: { events: [...(patient.events || []), newEvent] },
    })
    queryClient.invalidateQueries({ queryKey: ['patients', 'list'] })

    await dbExecute({
      action: 'update',
      collection: 'social_assistance_reports',
      id: report._id,
      data: {
        status: 'vinculado',
        linkedPatientId: patient._id,
        linkedPatientName: patient.name,
        linkedAt: new Date().toISOString(),
      },
    })

    await NotificationService.notifyNewEvent(patient.name, report.indicator.name)

    linkDialogOpen.value = false
    refetchReports()
  } catch (e) {
    console.error(e)
    snackbar.show('Erro ao vincular registro ao paciente', 'error')
  } finally {
    isLinking.value = false
  }
}
</script>
