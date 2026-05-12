<template lang="pug">
v-dialog(v-model="isOpen" max-width="800px")
  v-card
    v-card-title.text-h6.font-weight-bold.pa-4
      | {{ editingId ? 'Editar Paciente' : 'Novo Paciente' }}
    
    v-card-text.pa-4
      v-form(@submit.prevent="savePatient")
        v-row
          v-col(cols="12" md="6")
            v-text-field(
              v-model="form.name"
              label="Nome *"
              variant="outlined"
              :error-messages="errors.name"
              placeholder="Nome do paciente"
            )
          v-col(cols="12" md="6")
            v-autocomplete(
              v-model="form.operatorId"
              :items="operators"
              item-title="name"
              item-value="_id"
              label="Operadora *"
              variant="outlined"
              :error-messages="errors.operatorId"
              :loading="isLoadingOps"
            )
          v-col(cols="12" md="6")
            v-text-field(
              v-model="form.admissionDate"
              type="date"
              label="Data de Admissão (Opcional)"
              variant="outlined"
              :error-messages="errors.admissionDate"
            )
          v-col(cols="12" md="6")
            v-text-field(
              v-model="form.birthDate"
              type="date"
              label="Data de Nascimento (Opcional)"
              variant="outlined"
              :error-messages="errors.birthDate"
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
                @click="editingId && !pendingFile ? downloadFile(form.file, editingId) : null"
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
        @click="savePatient"
      ) {{ editingId ? 'Atualizar' : 'Salvar' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { z } from 'zod'
import { useCrud } from '@/composables/useCrud'
import { useQueryClient } from '@tanstack/vue-query'
import { fileToBase64, downloadFileFromDb } from '@/lib/proxy-client'

const PatientFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(100, 'Nome muito longo'),
  operatorId: z.string().min(1, 'A operadora é obrigatória'),
  admissionDate: z.string().optional(),
  birthDate: z.string().optional(),
  observations: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
  file: z.any().nullable().optional().default(null)
})

const { create, update, isCreating, isUpdating } = useCrud<any>('patients')
const { data: operators, isLoading: isLoadingOps } = useCrud<any>('operators', { defaultPageSize: 100 })
const queryClient = useQueryClient()

import { useSnackbarStore } from '@/stores/snackbarStore'
const snackbar = useSnackbarStore()

const isOpen = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  name: '', operatorId: '', admissionDate: '', birthDate: '', observations: '',
  file: null as { name: string; type: string; size: number } | null
})
const errors = reactive<Record<string, string>>({})

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

const downloadFile = (file: any, docId: string) => {
  downloadFileFromDb('patients', docId, 0, file.name)
}

const isSaving = computed(() => isCreating.value || isUpdating.value)

const validateForm = () => {
  Object.keys(errors).forEach(k => delete errors[k])
  const result = PatientFormSchema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach(issue => {
      errors[issue.path[0] as string] = issue.message
    })
    return false
  }
  return true
}

const isValid = computed(() => {
  return PatientFormSchema.safeParse(form).success
})

// Auto-validate form fields when they change
watch(form, () => {
  if (Object.keys(errors).length > 0) {
    validateForm()
  }
}, { deep: true })

const savePatient = async () => {
  if (!validateForm()) return
  try {
    const op = operators.value?.find((o: any) => o._id === form.operatorId)
    const payload: any = {
      name: form.name,
      operatorId: op?._id || '',
      admissionDate: form.admissionDate,
      birthDate: form.birthDate,
      observations: form.observations,
      operator: op ? { _id: op._id, name: op.name } : undefined
    }
    
    // Se tem arquivo novo, converte para base64 e inclui no payload JSON
    if (pendingFile.value) {
      payload.file = await fileToBase64(pendingFile.value)
    } else {
      payload.file = form.file  // Mantém arquivo existente (metadata only)
    }

    if (editingId.value) {
      await update({ id: editingId.value, data: payload })
    } else {
      await create(payload)
    }
    close()
  } catch (e) {
    console.error(e)
    snackbar.show('Erro ao salvar paciente', 'error')
  }
}

const open = (patient?: any) => {
  pendingFile.value = null
  if (patient) {
    Object.assign(form, patient)
    form.operatorId = patient.operator?._id || ''
    form.file = patient.file ? { name: patient.file.name, type: patient.file.type, size: patient.file.size } : null
    editingId.value = patient._id
  } else {
    Object.assign(form, {
      name: '', operatorId: '', admissionDate: '', birthDate: '', observations: '', file: null
    })
    editingId.value = null
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
