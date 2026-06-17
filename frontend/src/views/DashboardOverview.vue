<template lang="pug">
div(class="space-y-6 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Bem-vindo aos Indicadores Healthmais

  v-card.mb-6(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="5" md="4")
          v-select(
            v-model="filterStore.selectedBimester"
            :items="BIMESTER_OPTIONS"
            item-title="label"
            item-value="value"
            label="Período"
            density="compact"
            variant="outlined"
            hide-details
            prepend-inner-icon="mdi-calendar-range"
          )
        v-col(cols="12" sm="4" md="3")
          v-btn(
            v-if="filterStore.selectedBimester !== 'all'"
            variant="text"
            color="primary"
            prepend-icon="mdi-filter-off"
            @click="filterStore.clear()"
          ) Limpar Filtro

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

  v-divider.my-6

  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h6.font-weight-bold Relatórios Detalhados

  v-row
    v-col(cols="12" md="6")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title Eventos Adversos (Detalhamento)
        v-card-text.flex-grow-1
          v-list(lines="one" density="compact")
            v-list-item.px-0(v-for="item in analytics.adverseEventsData" :key="item.name")
              v-list-item-title.text-body-2.text-wrap {{ item.name }}
              template(v-slot:append)
                v-chip(size="small" color="error" variant="tonal") {{ item.eventos }}
            v-list-item(v-if="!analytics.adverseEventsData.length")
              v-list-item-title.text-medium-emphasis Nenhum evento adverso registrado.

    v-col(cols="12" md="6")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title Ouvidorias (Detalhamento)
        v-card-text.flex-grow-1
          v-list(lines="one" density="compact")
            v-list-item.px-0(v-for="item in analytics.ouvidoriasData" :key="item.name")
              v-list-item-title.text-body-2.text-wrap {{ item.name }}
              template(v-slot:append)
                v-chip(size="small" color="warning" variant="tonal") {{ item.eventos }}
            v-list-item(v-if="!analytics.ouvidoriasData.length")
              v-list-item-title.text-medium-emphasis Nenhuma ouvidoria registrada.

  v-divider.my-6

  //- ── Charts & Export Section ──
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h6.font-weight-bold Gráficos e Relatórios
    .d-flex.gap-2
      v-btn(
        color="primary"
        variant="elevated"
        prepend-icon="mdi-file-pdf-box"
        :loading="generatingReport"
        :disabled="generatingReport"
        @click="generateReport"
      ) Exportar PDF
      v-btn(
        color="deep-orange"
        variant="elevated"
        prepend-icon="mdi-file-powerpoint-box"
        :loading="generatingPptx"
        :disabled="generatingPptx"
        @click="generatePptx"
      ) Exportar PPTX

  v-row
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Eventos por Indicador
        v-card-text
          .chart-container(style="position: relative; height: 400px;")
            Bar(ref="barChartRef" :data="barChartData" :options="barOptions")

  .d-flex.justify-space-between.align-center.mb-4.mt-6
    h2.text-h6.font-weight-bold Distribuição por Sub-indicador

  v-row
    v-col(cols="12" sm="6" lg="4" v-for="(card, idx) in analytics.indicatorsCards" :key="'doughnut-' + card.id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.text-subtitle-2.font-weight-bold.text-wrap(style="line-height: 1.3;") {{ card.name }}
        v-card-text.flex-grow-1.d-flex.flex-column.justify-center
          .chart-container(v-if="card.subindicators.length && card.totalEvents > 0" style="position: relative; height: 280px;")
            Bar(:ref="el => setDoughnutRef(el, idx)" :data="getSubBarDataForCard(card)" :options="subBarOptions")
          .text-center.text-caption.text-medium-emphasis.pa-4(v-else)
            v-icon.mb-2(size="40" color="grey-lighten-1") mdi-chart-bar
            div(v-if="!card.subindicators.length") Nenhum subindicador configurado.
            div(v-else) Nenhum evento registrado.

  v-row.mt-4
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Indicadores ao Longo do Tempo
        v-card-text
          .chart-container(style="position: relative; height: 400px;")
            Line(ref="lineChartRef" :data="lineChartData" :options="lineOptions")

  //- ── Pivot Table ──
  v-row.mt-4(v-if="analytics.reportTableData?.length")
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Tabela por Mês — {{ new Date().getFullYear() }}
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

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCrud } from '@/composables/useCrud'
import { useDashboardAnalytics } from '@/composables/useDashboardAnalytics'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useFilterStore, BIMESTER_OPTIONS } from '@/stores/filterStore'

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
import { Bar, Line } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler, ChartDataLabels
)

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#84CC16', '#D946EF', '#0EA5E9', '#22C55E', '#A855F7',
]

const snackbar = useSnackbarStore()
const filterStore = useFilterStore()
const { startDate, endDate } = storeToRefs(filterStore)

const { data: patients } = useCrud<any>('patients', { defaultPageSize: 1000 })
const { data: indicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const analytics = useDashboardAnalytics(patients, indicators, startDate, endDate)

const totalPatients = computed(() => {
  if (!patients.value) return 0
  return patients.value.length
})

// ── Chart refs ──
const barChartRef = ref<any>(null)
const lineChartRef = ref<any>(null)
const doughnutChartRefs = ref<Record<number, any>>({})

const setDoughnutRef = (el: any, idx: number) => {
  if (el) doughnutChartRefs.value[idx] = el
}

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
    datalabels: {
      anchor: 'end' as const,
      align: 'right' as const,
      color: '#374151',
      font: { weight: 'bold' as const, size: 11 },
      formatter: (value: number) => value > 0 ? value : '',
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
    datalabels: { display: false },
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

// ── Sub-indicator Bar Chart (per-card) ──
const getSubBarDataForCard = (card: any) => ({
  labels: card.subindicators.map((s: any) => s.name.length > 25 ? s.name.substring(0, 23) + '…' : s.name),
  datasets: [{
    label: 'Eventos',
    data: card.subindicators.map((s: any) => s.eventos),
    backgroundColor: CHART_COLORS,
    borderRadius: 4,
    borderSkipped: false,
  }],
})

const subBarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end' as const,
      align: 'end' as const,
      color: '#374151',
      font: { weight: 'bold' as const, size: 10 },
      formatter: (value: number) => value > 0 ? String(value) : '',
    },
    tooltip: {
      backgroundColor: '#1E293B',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          const value = ctx.parsed.y
          const total = totalPatients.value
          if (total <= 0) return ` ${value}`
          const pct = ((value / total) * 100).toFixed(1)
          return ` ${value} (${pct}% dos pacientes)`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 9 }, maxRotation: 45 },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { size: 10 }, stepSize: 1 },
    },
  },
}))


// ── Report export ──
const generatingReport = ref(false)
const generatingPptx = ref(false)

function collectChartImages() {
  const charts: { title: string; image: string }[] = []
  if (barChartRef.value?.chart) {
    charts.push({ title: 'Eventos por Indicador', image: barChartRef.value.chart.toBase64Image() })
  }
  if (lineChartRef.value?.chart) {
    charts.push({ title: 'Evolução Mensal', image: lineChartRef.value.chart.toBase64Image() })
  }
  // Captura todos os doughnuts individuais
  const cards = analytics.value.indicatorsCards
  for (const [idx, ref] of Object.entries(doughnutChartRefs.value)) {
    if (ref?.chart) {
      const card = cards[Number(idx)]
      charts.push({
        title: card ? card.name : `Distribuição ${idx}`,
        image: ref.chart.toBase64Image(),
      })
    }
  }
  return charts
}

function buildPayload(format: 'pdf' | 'pptx') {
  return {
    title: 'RELATÓRIO DE INDICADORES',
    subtitle: `Período: ${filterStore.active.label}`,
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
    const baseURL = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${baseURL}/report/generate`, {
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
