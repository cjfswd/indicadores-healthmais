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

  const active = computed(() =>
    BIMESTER_OPTIONS.find(b => b.value === selectedBimester.value) ?? BIMESTER_OPTIONS[0],
  )

  const startDate = computed(() => active.value.start)
  const endDate = computed(() => active.value.end)

  function clear() {
    selectedBimester.value = 'all'
  }

  return { selectedBimester, startDate, endDate, active, clear }
})
