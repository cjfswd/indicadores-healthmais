<template lang="pug">
v-container.fill-height.fluid.pa-4.d-flex.align-center.justify-center

  v-card.pa-4.pa-sm-8(elevation="8" rounded="lg" max-width="640" width="100%" v-if="!submitted")
    .text-center.mb-6
      v-icon(color="primary" size="40") mdi-hand-heart-outline
      h1.text-h5.font-weight-bold.mt-2 Registro de Ocorrência
      p.text-body-2.text-medium-emphasis.mt-2 Use este formulário para relatar uma ocorrência (elogio, sugestão, reclamação, solicitação ou evento adverso) referente a um paciente. Um responsável irá analisar e vincular o registro ao paciente correto.

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
        v-model="form.subindicatorName"
        :items="occurrenceOptions"
        item-title="title"
        item-value="value"
        label="Tipo de ocorrência *"
        variant="outlined"
        :loading="isLoadingIndicators"
        :error-messages="errors.subindicatorName"
      )
      v-text-field.mb-2(
        v-model="form.reporterName"
        label="Nome de quem está denunciando (Opcional)"
        variant="outlined"
        :error-messages="errors.reporterName"
      )
      v-text-field.mb-2(
        v-model="form.reporterContact"
        label="Contato de quem está denunciando (Opcional)"
        variant="outlined"
        :error-messages="errors.reporterContact"
      )
      v-textarea.mb-2(
        v-model="form.observations"
        label="Relato *"
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

// Categorias permitidas no formulário público: Eventos adversos, Ouvidoria e Indicadores Sociais
const ALLOWED_INDICATOR_PREFIXES = ['08 -', '09 -', '10 -']

// Apenas estes subindicadores (sem numeração) ficam disponíveis como "Tipo de ocorrência".
// "Reclamações e Solicitações" (unificado) não entra aqui de propósito: fica só no
// histórico/dados para não perder os registros antigos. "Solicitações" também não fica
// selecionável no formulário público (a pedido), mas continua existindo nos dados.
const ALLOWED_SUBINDICATOR_LABELS = ['Elogios', 'Sugestões', 'Reclamações']

// "Evento adverso" não é escolhido por subindicador aqui: fica no nível do indicador
// "08 - Nº de eventos adversos". A categoria específica (Quedas, Broncoaspiração etc.)
// é definida depois pelas coordenações, no momento de vincular o registro ao paciente.
const EVENTO_ADVERSO_VALUE = '__evento_adverso__'

// "Denúncias" (indicador social) usa o subindicador real "Denúncias não categorizadas":
// a categoria específica (Abuso sexual, Violência doméstica etc.) é escolhida depois,
// também no momento de vincular o registro ao paciente.
const DENUNCIAS_NAO_CATEGORIZADAS_LABEL = 'Denúncias não categorizadas'

const snackbar = useSnackbarStore()

const { data: indicators, isLoading: isLoadingIndicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const categoryOptions = computed(() =>
  (indicators.value ?? []).filter((i: any) => ALLOWED_INDICATOR_PREFIXES.some(p => i.name?.startsWith(p)))
)

// Remove a numeração ("10.1 - ", "9.3 - ") do nome do sub-indicador para exibição.
const stripNumbering = (name: string) => name.replace(/^\d+(\.\d+)?\s*-\s*/, '')

// Achata os sub-indicadores das categorias permitidas em uma única lista de opções.
// O "de-para" entre o rótulo amigável (sem numeração) e o indicador/sub-indicador
// completo (com numeração, usado no armazenamento) acontece no envio do formulário.
const occurrenceOptions = computed(() => {
  const opts: { title: string; value: string; indicatorName: string }[] = []
  for (const ind of categoryOptions.value) {
    if (ind.name?.startsWith('08 -')) {
      opts.push({ title: 'Evento adverso', value: EVENTO_ADVERSO_VALUE, indicatorName: ind.name })
      continue
    }
    if (ind.name?.startsWith('10 -')) {
      const placeholder = (ind.subindicators ?? []).find((s: any) => stripNumbering(s.name) === DENUNCIAS_NAO_CATEGORIZADAS_LABEL)
      if (placeholder) {
        opts.push({ title: 'Denúncia', value: placeholder.name, indicatorName: ind.name })
      }
      continue
    }
    for (const sub of ind.subindicators ?? []) {
      const label = stripNumbering(sub.name)
      if (!ALLOWED_SUBINDICATOR_LABELS.includes(label)) continue
      opts.push({ title: label, value: sub.name, indicatorName: ind.name })
    }
  }
  return opts
})

const selectedOption = computed(() =>
  occurrenceOptions.value.find(o => o.value === form.subindicatorName) ?? null
)

const selectedIndicator = computed(() =>
  categoryOptions.value.find((i: any) => i.name === selectedOption.value?.indicatorName) ?? null
)

const FormSchema = z.object({
  patientNameRaw: z.string().min(1, 'O nome do paciente é obrigatório'),
  occurrenceDate: z.string().min(1, 'A data da ocorrência é obrigatória'),
  subindicatorName: z.string().min(1, 'O tipo de ocorrência é obrigatório'),
  reporterName: z.string().max(200, 'O nome deve ter no máximo 200 caracteres').optional(),
  reporterContact: z.string().max(200, 'O contato deve ter no máximo 200 caracteres').optional(),
  observations: z.string().min(1, 'O relato é obrigatório').max(500, 'O relato deve ter no máximo 500 caracteres'),
})

const form = reactive({
  patientNameRaw: '',
  occurrenceDate: new Date().toISOString().slice(0, 10),
  subindicatorName: '',
  reporterName: '',
  reporterContact: '',
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
    snackbar.show('Não foi possível carregar o tipo de ocorrência selecionado. Tente novamente.', 'error')
    return
  }

  const isEventoAdverso = form.subindicatorName === EVENTO_ADVERSO_VALUE
  const sub = isEventoAdverso
    ? null
    : selectedIndicator.value.subindicators.find((s: any) => s.name === form.subindicatorName)
  if (!isEventoAdverso && !sub) return

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
      // Para "Evento adverso" a categoria específica ainda não foi definida:
      // fica null até a coordenação categorizar no momento de vincular ao paciente.
      subindicator: sub
        ? {
            name: sub.name,
            targetType: sub.targetType,
            targetDirection: sub.targetDirection,
            targetValue: sub.targetValue,
          }
        : null,
      reporterName: form.reporterName,
      reporterContact: form.reporterContact,
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
  form.subindicatorName = ''
  form.reporterName = ''
  form.reporterContact = ''
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
