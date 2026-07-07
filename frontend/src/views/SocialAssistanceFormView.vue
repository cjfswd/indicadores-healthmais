<template lang="pug">
v-container.fill-height.fluid.pa-4.d-flex.align-center.justify-center

  v-card.pa-4.pa-sm-8(elevation="8" rounded="lg" max-width="640" width="100%" v-if="!submitted")
    .text-center.mb-6
      v-icon(color="primary" size="40") mdi-hand-heart-outline
      h1.text-h5.font-weight-bold.mt-2 Registro de Ocorrência — Assistência Social e Ouvidoria
      p.text-body-2.text-medium-emphasis.mt-2 Use este formulário para relatar uma ocorrência de assistência social ou de ouvidoria (elogio, sugestão, reclamação) referente a um paciente. Um responsável irá analisar e vincular o registro ao paciente correto.

    v-form(@submit.prevent="submit")
      v-text-field.mb-2(
        v-model="form.patientNameRaw"
        label="Nome do paciente *"
        variant="outlined"
        :error-messages="errors.patientNameRaw"
      )
      v-text-field.mb-2(
        v-model="form.occurrenceDate"
        label="Data da ocorrência *"
        variant="outlined"
        type="date"
        :error-messages="errors.occurrenceDate"
      )
      v-select.mb-2(
        v-model="form.indicatorName"
        :items="categoryOptions"
        item-title="name"
        item-value="name"
        label="Categoria *"
        variant="outlined"
        :loading="isLoadingIndicators"
        :error-messages="errors.indicatorName"
        @update:model-value="form.subindicatorName = ''"
      )
      v-select.mb-2(
        v-model="form.subindicatorName"
        :items="subindicatorOptions"
        item-title="name"
        item-value="name"
        label="Tipo de ocorrência *"
        variant="outlined"
        :disabled="!form.indicatorName"
        :error-messages="errors.subindicatorName"
      )
      v-text-field.mb-2(
        v-model="form.reporterName"
        label="Nome de quem está denunciando (Opcional)"
        variant="outlined"
        :error-messages="errors.reporterName"
      )
      v-textarea.mb-2(
        v-model="form.observations"
        label="Observações (Opcional)"
        variant="outlined"
        rows="3"
        counter="500"
        :error-messages="errors.observations"
      )
      v-file-input.mb-2(
        v-model="rawFiles"
        label="Anexar Arquivo (Opcional, Máx 5MB)"
        variant="outlined"
        chips
        show-size
        @update:model-value="processFile"
        prepend-inner-icon="mdi-paperclip"
        prepend-icon=""
      )

      v-btn.mt-2(
        type="submit"
        color="primary"
        variant="flat"
        size="large"
        block
        :loading="isSubmitting"
      ) Enviar

  v-card.pa-8.text-center(elevation="8" rounded="lg" max-width="480" width="100%" v-else)
    v-icon(color="success" size="56") mdi-check-circle-outline
    h2.text-h6.font-weight-bold.mt-4 Registro enviado com sucesso!
    p.text-body-2.text-medium-emphasis.mt-2 Obrigado. Sua ocorrência foi registrada e será analisada pela equipe responsável.
    v-btn.mt-4(variant="text" color="primary" @click="resetForm") Enviar outro registro
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { z } from 'zod'
import { useCrud } from '@/composables/useCrud'
import { dbExecute, fileToBase64 } from '@/lib/proxy-client'
import { useSnackbarStore } from '@/stores/snackbarStore'

// Categorias permitidas no formulário público: Indicadores Sociais e Ouvidorias
const ALLOWED_INDICATOR_PREFIXES = ['09 -', '10 -']

const snackbar = useSnackbarStore()

const { data: indicators, isLoading: isLoadingIndicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const categoryOptions = computed(() =>
  (indicators.value ?? []).filter((i: any) => ALLOWED_INDICATOR_PREFIXES.some(p => i.name?.startsWith(p)))
)

const selectedIndicator = computed(() =>
  categoryOptions.value.find((i: any) => i.name === form.indicatorName) ?? null
)

const subindicatorOptions = computed(() => selectedIndicator.value?.subindicators ?? [])

const FormSchema = z.object({
  patientNameRaw: z.string().min(1, 'O nome do paciente é obrigatório'),
  occurrenceDate: z.string().min(1, 'A data da ocorrência é obrigatória'),
  indicatorName: z.string().min(1, 'A categoria é obrigatória'),
  subindicatorName: z.string().min(1, 'O tipo de ocorrência é obrigatório'),
  reporterName: z.string().max(200, 'O nome deve ter no máximo 200 caracteres').optional(),
  observations: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
})

const form = reactive({
  patientNameRaw: '',
  occurrenceDate: new Date().toISOString().slice(0, 10),
  indicatorName: '',
  subindicatorName: '',
  reporterName: '',
  observations: '',
  file: null as { name: string; type: string; size: number } | null,
})
const errors = reactive<Record<string, string>>({})

const rawFiles = ref<File[]>([])
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

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k])
  const result = FormSchema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach(issue => {
      errors[issue.path[0] as string] = issue.message
    })
  }
  return result.success
}

const isSubmitting = ref(false)
const submitted = ref(false)

const submit = async () => {
  if (!validate()) return
  if (!selectedIndicator.value) {
    snackbar.show('Não foi possível carregar a categoria selecionada. Tente novamente.', 'error')
    return
  }

  const sub = selectedIndicator.value.subindicators.find((s: any) => s.name === form.subindicatorName)
  if (!sub) return

  isSubmitting.value = true
  try {
    const payload: any = {
      patientNameRaw: form.patientNameRaw,
      occurrenceDate: form.occurrenceDate,
      indicator: {
        name: selectedIndicator.value.name,
        targetType: selectedIndicator.value.targetType,
        targetDirection: selectedIndicator.value.targetDirection,
        targetValue: selectedIndicator.value.targetValue,
        comparisonInterval: selectedIndicator.value.comparisonInterval,
      },
      subindicator: {
        name: sub.name,
        targetType: sub.targetType,
        targetDirection: sub.targetDirection,
        targetValue: sub.targetValue,
      },
      reporterName: form.reporterName,
      observations: form.observations,
      status: 'pendente',
      linkedPatientId: null,
      linkedAt: null,
    }

    if (pendingFile.value) {
      payload.file = await fileToBase64(pendingFile.value)
    } else {
      payload.file = null
    }

    await dbExecute({
      action: 'insert',
      collection: 'social_assistance_reports',
      data: payload,
    })

    submitted.value = true
  } catch (e) {
    console.error(e)
    snackbar.show('Erro ao enviar o registro. Tente novamente.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.patientNameRaw = ''
  form.occurrenceDate = new Date().toISOString().slice(0, 10)
  form.indicatorName = ''
  form.subindicatorName = ''
  form.reporterName = ''
  form.observations = ''
  form.file = null
  pendingFile.value = null
  Object.keys(errors).forEach(k => delete errors[k])
  submitted.value = false
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  width: 100vw;
  max-width: 100% !important;
}
</style>
