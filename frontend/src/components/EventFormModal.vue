<template lang="pug">
v-dialog(v-model="isOpen" max-width="800px")
  v-card
    v-card-title.text-h6.font-weight-bold.pa-4
      | {{ editingId ? 'Editar Evento' : 'Novo Evento' }}
    
    v-card-text.pa-4
      v-form(@submit.prevent="saveEvent")
        v-row
          v-col(cols="12" md="6")
            v-autocomplete(
              v-model="form.patientId"
              :items="patients"
              item-title="name"
              item-value="_id"
              label="Paciente *"
              variant="outlined"
              :error-messages="errors.patientId"
              :loading="isLoadingPatients"
              :disabled="!!editingId"
            )
          v-col(cols="12" md="6")
            v-text-field(
              v-model="form.occurrenceDate"
              label="Data da Ocorrência *"
              variant="outlined"
              type="date"
              :error-messages="errors.occurrenceDate"
            )
          v-col(cols="12" md="6")
            v-select(
              v-model="form.indicatorId"
              :items="indicators"
              item-title="name"
              item-value="_id"
              label="Indicador *"
              variant="outlined"
              :error-messages="errors.indicatorId"
              :loading="isLoadingIndicators"
            )
          v-col(cols="12" md="6")
            v-select(
              v-model="form.subindicatorId"
              :items="filteredSubindicators"
              item-title="name"
              item-value="name"
              label="Sub-Indicador *"
              variant="outlined"
              :error-messages="errors.subindicatorId"
              :disabled="!form.indicatorId"
            )
          v-col(cols="12" v-if="isPadEvent")
            v-select(
              v-model="form.assistanceType"
              :items="assistanceOptions"
              label="Assistência (Qual?)"
              variant="outlined"
              :error-messages="errors.assistanceType"
            )
          v-col(cols="12")
            v-textarea(
              v-model="form.observations"
              label="Observações (Opcional)"
              variant="outlined"
              rows="3"
              counter="500"
              :error-messages="errors.observations"
            )
          v-col(cols="12")
            v-file-input(
              v-model="rawFiles"
              label="Anexar Arquivo (Opcional, Máx 5MB)"
              variant="outlined"
              chips
              show-size
              @update:model-value="processFile"
              prepend-inner-icon="mdi-paperclip"
              prepend-icon=""
            )
            .d-flex.flex-wrap.gap-2.mt-2(v-if="form.file")
              v-chip(
                closable
                color="primary"
                variant="tonal"
                @click:close="removeFile"
                @click="editingPatientId && editingId && !pendingFile ? downloadFile(form.file, editingPatientId, editingId) : null"
              ) 
                v-icon(start size="small") mdi-file-document-outline
                | {{ form.file.name }} ({{ Math.round(form.file.size / 1024) }} KB)
            
    v-card-actions.pa-4.pt-0
      v-spacer
      v-btn(variant="text" @click="close") Cancelar
      v-btn(
        color="primary"
        variant="flat"
        :loading="isSaving"
        :disabled="!isValid"
        @click="saveEvent"
      ) {{ editingId ? 'Atualizar' : 'Salvar' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { z } from 'zod'
import { useCrud } from '@/composables/useCrud'
import { useQueryClient } from '@tanstack/vue-query'
import { fileToBase64, downloadFileFromDb, dbExecute } from '@/lib/proxy-client'
import { NotificationService } from '@/services/NotificationService'


const EventFormSchema = z.object({
  patientId: z.string().min(1, 'A seleção de paciente é obrigatória'),
  occurrenceDate: z.string().min(1, 'A data da ocorrência é obrigatória'),
  indicatorId: z.string().min(1, 'O indicador é obrigatório'),
  subindicatorId: z.string().min(1, 'O sub-indicador é obrigatório'),
  observations: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
  assistanceType: z.enum(['enfermagem', 'fisioterapia', 'fonoaudiologia', 'medicina', 'nutrição', 'psicologia']).optional().nullable(),
  file: z.any().nullable().optional().default(null)
})

const { update: updatePatient, isUpdating } = useCrud<any>('patients')
const { data: patients, isLoading: isLoadingPatients } = useCrud<any>('patients', { defaultPageSize: 1000 })
const { data: indicators, isLoading: isLoadingIndicators } = useCrud<any>('indicators', { defaultPageSize: 100 })
const queryClient = useQueryClient()

import { useSnackbarStore } from '@/stores/snackbarStore'
const snackbar = useSnackbarStore()

const assistanceOptions = ['enfermagem', 'fisioterapia', 'fonoaudiologia', 'medicina', 'nutrição', 'psicologia']

const isOpen = ref(false)
const editingId = ref<string | null>(null)
const editingPatientId = ref<string | null>(null)

const form = reactive({
  patientId: '',
  occurrenceDate: '',
  indicatorId: '',
  subindicatorId: '',
  observations: '',
  assistanceType: null as string | null,
  file: null as { name: string; type: string; size: number } | null
})
const errors = reactive<Record<string, string>>({})

const isPadEvent = computed(() => {
  const ind = indicators.value?.find((i: any) => i._id === form.indicatorId)
  const indName = ind?.name?.toLowerCase() || ''
  const subName = form.subindicatorId?.toLowerCase() || ''
  const combined = `${indName} ${subName}`
  return combined.includes('pad') && (combined.includes('aumento') || combined.includes('redução') || combined.includes('reducao'))
})

const rawFiles = ref<File[]>([])

/** Referência ao File object para conversão base64 no save */
const pendingFile = ref<File | null>(null)

const processFile = (files: File | File[]) => {
  const fileArray = Array.isArray(files) ? files : files ? [files] : []
  if (!fileArray.length) {
    pendingFile.value = null
    form.file = null
    return
  }
  const file = fileArray[0]
  
  if (file.size > 5 * 1024 * 1024) {
    snackbar.show('O arquivo não pode exceder 5MB', 'error')
    rawFiles.value = []
    return
  }

  pendingFile.value = file
  form.file = { name: file.name, type: file.type, size: file.size }
  rawFiles.value = []
}

const removeFile = () => {
  form.file = null
  pendingFile.value = null
}

const downloadFile = (file: any, patientId: string, eventId: string) => {
  downloadFileFromDb('patients', patientId, 0, file.name, eventId)
}

const isSaving = computed(() => isUpdating.value)

const validateForm = () => {
  Object.keys(errors).forEach(k => delete errors[k])
  const result = EventFormSchema.safeParse(form)
  
  let valid = result.success
  if (!result.success) {
    result.error.issues.forEach(issue => {
      errors[issue.path[0] as string] = issue.message
    })
  }

  if (isPadEvent.value && !form.assistanceType) {
    errors.assistanceType = 'A assistência é obrigatória para este evento'
    valid = false
  }

  return valid
}

const isValid = computed(() => {
  if (isPadEvent.value && !form.assistanceType) return false
  return EventFormSchema.safeParse(form).success
})

// Auto-validate form fields when they change
watch(form, () => {
  if (Object.keys(errors).length > 0) {
    validateForm()
  }
}, { deep: true })

const filteredSubindicators = computed(() => {
  if (!form.indicatorId || !indicators.value) return []
  const ind = indicators.value.find((i: any) => i._id === form.indicatorId)
  return ind ? ind.subindicators : []
})

const generateObjectId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')

const saveEvent = async () => {
  if (!validateForm()) return
  try {
    const patient = patients.value?.find((p: any) => p._id === form.patientId)
    const ind = indicators.value?.find((i: any) => i._id === form.indicatorId)
    const sub = ind?.subindicators?.find((s: any) => s.name === form.subindicatorId)

    if (!patient || !ind || !sub) return

    const payloadEvent: any = {
      _id: editingId.value || generateObjectId(),
      occurrenceDate: form.occurrenceDate,
      indicator: {
        name: ind.name,
        targetType: ind.targetType,
        targetDirection: ind.targetDirection,
        targetValue: ind.targetValue,
        comparisonInterval: ind.comparisonInterval
      },
      subindicator: {
        _id: sub._id || generateObjectId(),
        name: sub.name,
        targetType: sub.targetType,
        targetDirection: sub.targetDirection,
        targetValue: sub.targetValue
      },
      observations: form.observations,
    }

    if (isPadEvent.value && form.assistanceType) {
      payloadEvent.assistanceType = form.assistanceType
    }

    // Se tem arquivo novo, converte para base64 e inclui no evento
    if (pendingFile.value) {
      payloadEvent.file = await fileToBase64(pendingFile.value)
    } else {
      payloadEvent.file = form.file  // Mantém arquivo existente (metadata only)
    }

    let newEvents: any[]
    if (editingId.value) {
      newEvents = (patient.events || []).map((e: any) => e._id === editingId.value ? payloadEvent : e)
    } else {
      newEvents = [...(patient.events || []), payloadEvent]
    }

    if (editingId.value) {
      // Edição: usa useCrud (snackbar automático "Registro atualizado")
      await updatePatient({ id: patient._id, data: { events: newEvents } })
    } else {
      // Criação: usa dbExecute direto para evitar snackbar duplicado
      // O NotificationService.notify já cuida do feedback visual
      await dbExecute({
        action: 'update',
        collection: 'patients',
        id: patient._id,
        data: { events: newEvents }
      })
      queryClient.invalidateQueries({ queryKey: ['patients', 'list'] })
      await NotificationService.notifyNewEvent(patient.name, ind.name)
    }

    close()

  } catch (e) {
    console.error(e)
    snackbar.show('Erro ao salvar evento', 'error')
  }
}

const open = (event?: any) => {
  pendingFile.value = null
  if (event) {
    editingId.value = event._id
    editingPatientId.value = event.patientId
    
    const ind = indicators.value?.find((i: any) => i.name === event.indicator.name)
    
    Object.assign(form, {
      patientId: event.patientId,
      occurrenceDate: event.occurrenceDate,
      indicatorId: ind?._id || '',
      subindicatorId: event.subindicator?.name || '',
      observations: event.observations || '',
      assistanceType: event.assistanceType || null,
      file: event.file ? { name: event.file.name, type: event.file.type, size: event.file.size } : null
    })
  } else {
    Object.assign(form, {
      patientId: '', occurrenceDate: '', indicatorId: '', subindicatorId: '', observations: '', assistanceType: null, file: null
    })
    editingId.value = null
    editingPatientId.value = null
  }
  Object.keys(errors).forEach(k => delete errors[k])
  isOpen.value = true
  validateForm()
}

const close = () => {
  isOpen.value = false
}

defineExpose({ open, close })
</script>
