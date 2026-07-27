import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const YEAR = new Date().getFullYear()

export const BIMESTER_OPTIONS = [
  { value: 'all', label: 'Todos os períodos', start: '', end: '' },
  { value: 'b1', label: `Jan – Fev ${YEAR}`, start: `${YEAR}-01-01`, end: `${YEAR}-02-28` },
  { value: 'b2', label: `Mar – Abr ${YEAR}`, start: `${YEAR}-03-01`, end: `${YEAR}-04-30` },
  { value: 'b3', label: `Mai – Jun ${YEAR}`, start: `${YEAR}-05-01`, end: `${YEAR}-06-30` },
  { value: 'b4', label: `Jul – Ago ${YEAR}`, start: `${YEAR}-07-01`, end: `${YEAR}-08-31` },
  { value: 'b5', label: `Set – Out ${YEAR}`, start: `${YEAR}-09-01`, end: `${YEAR}-10-31` },
  { value: 'b6', label: `Nov – Dez ${YEAR}`, start: `${YEAR}-11-01`, end: `${YEAR}-12-31` },
]

export const useFilterStore = defineStore('filter', () => {
  const selectedBimester = ref('all')
  const customStartDate = ref('')
  const customEndDate = ref('')

  const active = computed(() =>
    BIMESTER_OPTIONS.find(b => b.value === selectedBimester.value) ?? BIMESTER_OPTIONS[0],
  )

  // Um intervalo de data personalizado (De/Até) tem prioridade sobre o bimestre selecionado.
  const startDate = computed(() => customStartDate.value || active.value.start)
  const endDate = computed(() => customEndDate.value || active.value.end)

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

  const periodLabel = computed(() => {
    if (customStartDate.value || customEndDate.value) {
      const from = customStartDate.value ? formatDate(customStartDate.value) : '…'
      const to = customEndDate.value ? formatDate(customEndDate.value) : '…'
      return `${from} – ${to}`
    }
    return active.value.label
  })

  function clear() {
    selectedBimester.value = 'all'
    customStartDate.value = ''
    customEndDate.value = ''
  }

  return { selectedBimester, customStartDate, customEndDate, startDate, endDate, active, periodLabel, clear }
})
