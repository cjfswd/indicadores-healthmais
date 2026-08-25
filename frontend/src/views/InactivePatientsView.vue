<template lang="pug">
div(class="space-y-8 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    .d-flex.align-center.gap-2
      v-btn(icon="mdi-arrow-left" variant="text" @click="$router.push('/patients')")
      h2.text-h5.font-weight-bold Pacientes inativos
    v-btn(variant="text" prepend-icon="mdi-refresh" :loading="isLoading" @click="carregar") Atualizar

  v-alert.mb-4(type="info" variant="tonal" density="comfortable")
    | Alta e óbito inativam o paciente, mas não apagam nada. Os eventos continuam
    | registrados e o paciente segue aparecendo nas telas normais, marcado como inativo.

  v-card.mb-4(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="6" md="4")
          v-text-field(
            v-model="busca"
            placeholder="Buscar por nome..."
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
          )
        v-col(cols="12" sm="6" md="4")
          v-select(
            v-model="motivo"
            :items="motivoOptions"
            item-title="label"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
          )
        v-col(cols="12" sm="12" md="4")
          .text-caption.text-medium-emphasis {{ filtrados.length }} de {{ pacientes.length }} paciente(s)

  v-progress-linear(v-if="isLoading" indeterminate color="primary")

  v-alert(v-else-if="erro" type="error" variant="tonal") {{ erro }}

  v-alert(v-else-if="!filtrados.length" type="success" variant="tonal")
    | Nenhum paciente inativo no momento.

  v-row(v-else)
    v-col(cols="12" md="6" lg="4" v-for="item in filtrados" :key="item._id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.d-flex.justify-space-between.align-start
          .text-wrap.text-subtitle-1.font-weight-bold.pr-2(style="line-height: 1.2;") {{ item.name }}
          v-chip(
            size="x-small"
            :color="item.inactivationReason === 'obito' ? 'error' : 'warning'"
            variant="flat"
          ) {{ labelMotivo(item.inactivationReason) }}
        v-card-text.flex-grow-1
          .text-body-2.mb-2
            span.font-weight-bold Operadora:&nbsp;
            | {{ item.operator?.name || '—' }}
          .text-body-2.mb-2
            span.font-weight-bold Inativado em:&nbsp;
            span(v-if="item.inactivatedAt") {{ formatDate(item.inactivatedAt) }}
            span.text-grey.font-italic(v-else) Sem data
          .text-body-2.mb-2(v-if="item.deletedBy")
            span.font-weight-bold Por:&nbsp;
            | {{ item.deletedBy }}
          .text-body-2.mb-2
            span.font-weight-bold Eventos:&nbsp;
            | {{ item.events?.length || 0 }}
          v-chip.mt-2(
            v-if="item.softDeleted"
            size="x-small"
            color="grey"
            variant="tonal"
            prepend-icon="mdi-eye-off"
          ) Oculto pela regra antiga
        v-divider
        v-card-actions
          v-btn(
            variant="text"
            color="secondary"
            size="small"
            prepend-icon="mdi-calendar-search"
            @click="$router.push({ path: '/events', query: { patientId: item._id } })"
          ) Ver eventos
          v-spacer
          v-btn(
            variant="text"
            color="primary"
            size="small"
            prepend-icon="mdi-account-reactivate"
            :loading="reativando === item._id"
            @click="reativar(item)"
          ) Reativar
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchInactivePatients, reactivatePatient } from '@/lib/proxy-client'
import { useConfirm } from '@/composables/useConfirm'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { formatDate } from '@/lib/date-utils'

const pacientes = ref<any[]>([])
const isLoading = ref(false)
const erro = ref('')
const busca = ref('')
const motivo = ref('todos')
const reativando = ref<string | null>(null)

const snackbar = useSnackbarStore()
const { confirm } = useConfirm()

const motivoOptions = [
  { value: 'todos', label: 'Todos os motivos' },
  { value: 'alta', label: 'Alta' },
  { value: 'obito', label: 'Óbito' },
  { value: 'outro', label: 'Sem motivo registrado' },
]

const labelMotivo = (m?: string) => {
  if (m === 'obito') return 'Óbito'
  if (m === 'alta') return 'Alta'
  return 'Sem motivo'
}

const carregar = async () => {
  isLoading.value = true
  erro.value = ''
  try {
    const res = await fetchInactivePatients()
    pacientes.value = res.result || []
  } catch (e: any) {
    erro.value = e?.message || 'Não foi possível carregar os pacientes inativos'
  } finally {
    isLoading.value = false
  }
}

const filtrados = computed(() =>
  pacientes.value.filter(p => {
    if (busca.value && !p.name?.toLowerCase().includes(busca.value.toLowerCase())) return false
    if (motivo.value === 'todos') return true
    if (motivo.value === 'outro') return !p.inactivationReason
    return p.inactivationReason === motivo.value
  }),
)

const reativar = async (item: any) => {
  if (!await confirm(`Reativar ${item.name}? O histórico de eventos é mantido.`)) return
  reativando.value = item._id
  try {
    await reactivatePatient(item._id)
    snackbar.show('Paciente reativado com sucesso!')
    await carregar()
  } catch (e: any) {
    snackbar.show(e?.message || 'Erro ao reativar paciente', 'error')
  } finally {
    reativando.value = null
  }
}

onMounted(carregar)
</script>
