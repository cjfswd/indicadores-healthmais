<template lang="pug">
div(class="space-y-6 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    div
      h2.text-h5.font-weight-bold Relat&#243;rios e Gr&#225;ficos
      .text-body-2.text-medium-emphasis Visualiza&#231;&#227;o consolidada dos indicadores

  v-card.mb-6(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="3")
          v-text-field(
            v-model="startDate"
            type="date"
            label="Data Inicial"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="3")
          v-text-field(
            v-model="endDate"
            type="date"
            label="Data Final"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="6")
          .d-flex.ga-2.justify-end
            v-btn(
              v-if="startDate || endDate"
              variant="text"
              color="primary"
              prepend-icon="mdi-filter-off"
              @click="clearFilters"
            ) Limpar
            v-btn(color="primary" variant="elevated" prepend-icon="mdi-file-pdf-box" @click="generateReport" :loading="generatingReport" :disabled="generatingReport") Exportar PDF
            v-btn(color="deep-orange" variant="elevated" prepend-icon="mdi-file-powerpoint-box" @click="generatePptx" :loading="generatingPptx" :disabled="generatingPptx") Exportar PPTX

  v-row
    v-col(cols="12" lg="8")
      v-card(elevation="1" class="h-100")
        v-card-title.text-subtitle-1.font-weight-bold Eventos por Indicador
        v-card-text
          .chart-container(style="position: relative; height: 420px;")
            Bar(ref="barChartRef" :data="barChartData" :options="barOptions")
    v-col(cols="12" lg="4")
      v-card(elevation="1" class="h-100")
        v-card-title.text-subtitle-1.font-weight-bold Distribui&#231;&#227;o por Sub-indicador
        v-card-text
          v-select(
            v-model="selectedIndicatorForPie"
            :items="analytics.indicatorsCards.map(c => c.name)"
            label="Selecionar Indicador"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
          .chart-container.mt-3(style="position: relative; height: 350px;")
            Doughnut(ref="doughnutChartRef" :data="doughnutData" :options="doughnutOptions")

  v-row.mt-4
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Evolu&#231;&#227;o Mensal
        v-card-text
          .chart-container(style="position: relative; height: 400px;")
            Line(ref="lineChartRef" :data="lineChartData" :options="lineOptions")

  v-row.mt-4(v-if="analytics.reportTableData?.length")
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Tabela Piv&#244; Mensal
        v-card-text
          v-table(density="compact" fixed-header hover)
            thead
              tr
                th.font-weight-bold(
                  v-for="(label, key) in analytics.reportHeaders"
                  :key="key"
                  :class="key === 'indicador' ? 'text-left' : 'text-center'"
                ) {{ label }}
            tbody
              tr(
                v-for="(row, idx) in analytics.reportTableData"
                :key="idx"
                :class="{ 'font-weight-bold bg-grey-lighten-4': !String(row.indicador).includes(' > ') }"
              )
                td(
                  v-for="(label, key) in analytics.reportHeaders"
                  :key="key"
                  :class="[key === 'indicador' ? 'text-left' : 'text-center', key === 'indicador' && String(row.indicador).includes(' > ') ? 'pl-8' : '']"
                ) {{ key === 'indicador' ? row[key] : (row[key] ?? 0) }}

  v-divider.my-6

  v-row
    v-col(cols="12" md="6" lg="4" v-for="card in analytics.indicatorsCards" :key="card.id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.text-subtitle-1.font-weight-bold.text-wrap(style="line-height: 1.3;") {{ card.name }}
        v-card-text.flex-grow-1.d-flex.flex-column
          .d-flex.align-center.mb-3
            .text-h4.font-weight-bold.text-primary {{ card.totalEvents }}
            .text-caption.text-medium-emphasis.ml-2 Eventos (Total)
          v-divider.mb-2
          v-list.flex-grow-1(lines="one" density="compact" v-if="card.subindicators.length")
            v-list-item.px-0(v-for="sub in card.subindicators" :key="sub.name")
              v-list-item-title.text-body-2.text-wrap {{ sub.name }}
              template(v-slot:append)
                v-chip(size="small" variant="tonal" :color="sub.eventos > 0 ? 'secondary' : 'grey'") {{ sub.eventos }}
          .text-caption.text-medium-emphasis.mt-4.text-center(v-else)
            | Nenhum subindicador configurado.

</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useDashboardAnalytics } from '@/composables/useDashboardAnalytics'
import { useSnackbarStore } from '@/stores/snackbarStore'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'vue-chartjs'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
)

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#D946EF', '#0EA5E9', '#22C55E', '#A855F7',
]

const snackbar = useSnackbarStore()

const startDate = ref('')
const endDate = ref('')

const clearFilters = () => {
  startDate.value = ''
  endDate.value = ''
}

const { data: patients } = useCrud<any>('patients', { defaultPageSize: 1000 })
const { data: indicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const analytics = useDashboardAnalytics(patients, indicators, startDate, endDate)

// ── Chart refs ──
const barChartRef = ref<any>(null)
const lineChartRef = ref<any>(null)
const doughnutChartRef = ref<any>(null)
const selectedIndicatorForPie = ref('')

// ── Bar Chart ──
const barChartData = computed(() => ({
  labels: analytics.value.chartBarData?.labels || [],
  datasets: [{
    label: 'Total de Eventos',
    data: analytics.value.chartBarData?.datasets?.[0]?.data || [],
    backgroundColor: CHART_COLORS,
    borderRadius: 6,
    borderSkipped: false,
  }],
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E293B',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { size: 11 } },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}

// ── Line Chart ──
const lineChartData = computed(() => {
  const raw = analytics.value.chartLineData
  if (!raw) return { labels: [], datasets: [] }
  return {
    labels: raw.labels,
    datasets: raw.datasets.map((ds: any, i: number) => ({
      ...ds,
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { usePointStyle: true, padding: 16, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#1E293B',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { size: 11 }, stepSize: 1 },
    },
  },
}

// ── Doughnut Chart ──
const doughnutData = computed(() => {
  const card = analytics.value.indicatorsCards.find(c => c.name === selectedIndicatorForPie.value)
  if (!card || !card.subindicators.length) {
    return {
      labels: analytics.value.indicatorsCards.map(c => c.name.length > 25 ? c.name.substring(0, 23) + '\u2026' : c.name),
      datasets: [{
        data: analytics.value.indicatorsCards.map(c => c.totalEvents),
        backgroundColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    }
  }
  return {
    labels: card.subindicators.map(s => s.name.length > 25 ? s.name.substring(0, 23) + '\u2026' : s.name),
    datasets: [{
      data: card.subindicators.map(s => s.eventos),
      backgroundColor: CHART_COLORS,
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { usePointStyle: true, padding: 10, font: { size: 10 } },
    },
    tooltip: {
      backgroundColor: '#1E293B',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
    },
  },
}

// ── Report export ──
const generatingReport = ref(false)
const generatingPptx = ref(false)

function collectChartImages() {
  const charts: { title: string; image: string }[] = []
  if (barChartRef.value?.chart) {
    charts.push({ title: 'Eventos por Indicador', image: barChartRef.value.chart.toBase64Image() })
  }
  if (lineChartRef.value?.chart) {
    charts.push({ title: 'Evolucao Mensal', image: lineChartRef.value.chart.toBase64Image() })
  }
  if (doughnutChartRef.value?.chart) {
    charts.push({ title: 'Distribuicao por Sub-indicador', image: doughnutChartRef.value.chart.toBase64Image() })
  }
  return charts
}

function buildPayload(format: 'pdf' | 'pptx') {
  return {
    title: 'RELATORIO DE INDICADORES',
    subtitle: `Periodo: ${startDate.value || 'Inicio'} a ${endDate.value || 'Atual'}`,
    headers: analytics.value.reportHeaders,
    data: analytics.value.reportTableData,
    charts: collectChartImages(),
    format,
  }
}

async function downloadReport(format: 'pdf' | 'pptx') {
  const loadingRef = format === 'pdf' ? generatingReport : generatingPptx
  loadingRef.value = true
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${import.meta.env.VITE_API_URL}/report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(buildPayload(format)),
    })
    if (!response.ok) throw new Error(`Falha ao gerar ${format.toUpperCase()}`)

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_indicadores_${new Date().toISOString().slice(0, 10)}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    snackbar.show(`${format.toUpperCase()} gerado com sucesso!`, 'success')
  } catch (err) {
    console.error(err)
    snackbar.show(`Erro ao gerar ${format.toUpperCase()}`, 'error')
  } finally {
    loadingRef.value = false
  }
}

const generateReport = () => downloadReport('pdf')
const generatePptx = () => downloadReport('pptx')
</script>
