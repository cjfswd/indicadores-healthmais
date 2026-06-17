<template lang="pug">
div(class="space-y-6 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Bem-vindo aos Indicadores Healthmais

  //- ── Filtro de período ──
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

  //- ── Filtros rápidos: modalidade AD/ID e convênio ──
  v-card.mb-4(elevation="0" border)
    v-card-text.pa-3
      .d-flex.align-center.flex-wrap.ga-2
        v-icon.mr-1(size="18" color="grey-darken-1") mdi-filter-variant
        span.text-caption.text-medium-emphasis.mr-1 Pacientes em:
        v-chip(
          color="blue"
          variant="tonal"
          size="small"
          clickable
          prepend-icon="mdi-home-heart"
          @click="openByModalityAndOperator('AD')"
        ) AD
        v-chip(
          color="teal"
          variant="tonal"
          size="small"
          clickable
          prepend-icon="mdi-hospital-box"
          @click="openByModalityAndOperator('ID')"
        ) ID
        v-divider.mx-1(vertical style="height:20px; align-self:center")
        span.text-caption.text-medium-emphasis.mr-1 Por convênio:
        v-chip(
          v-for="op in (operators ?? [])"
          :key="op._id"
          color="deep-orange"
          variant="tonal"
          size="small"
          clickable
          prepend-icon="mdi-card-account-details"
          @click="openByModalityAndOperator(undefined, op._id)"
        ) {{ op.name }}

  //- ── Card de destaque: Taxa de Internação Hospitalar ──
  v-row.mb-2(v-if="hospitalizationRate !== null")
    v-col(cols="12" md="6" lg="4")
      v-card(elevation="2" color="blue-darken-4" theme="dark")
        v-card-text.pa-5
          .text-caption.text-blue-lighten-3.font-weight-bold.mb-1 TAXA DE INTERNAÇÃO HOSPITALAR
          .d-flex.align-end.ga-2
            span.text-h2.font-weight-bold {{ hospitalizationRate }}%
            span.text-body-1.mb-2.text-blue-lighten-3 ({{ hospitalizationRateAbs }} internações / {{ adIdTotal }} pacientes AD+ID)
          .text-caption.text-blue-lighten-3.mt-1 Indicador 03 sobre total de pacientes em AD/ID

  //- ── Cards de indicadores ──
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
            v-list-item.px-0(
              v-for="sub in card.subindicators"
              :key="sub.name"
              :class="sub.eventos > 0 ? 'cursor-pointer' : ''"
              @click="sub.eventos > 0 && openDrilldown(card.name, sub.name)"
            )
              v-list-item-title.text-body-2.text-wrap {{ sub.name }}
              template(v-slot:append)
                v-chip(
                  size="small"
                  variant="tonal"
                  :color="sub.eventos > 0 ? 'secondary' : 'grey'"
                  :style="sub.eventos > 0 ? 'cursor:pointer' : ''"
                ) {{ sub.eventos }}

          .text-caption.text-medium-emphasis.mt-4.text-center(v-else)
            | Nenhum subindicador configurado.

  //- ── Seção: Indicadores Sociais ──
  template(v-if="socialCard")
    v-divider.my-6
    .d-flex.align-center.mb-4
      v-icon.mr-2(color="deep-purple") mdi-account-group
      h2.text-h6.font-weight-bold Indicadores Sociais
    v-row
      v-col(cols="12" md="8" lg="6")
        v-card(elevation="1")
          v-card-text
            .d-flex.align-center.mb-4
              .text-h3.font-weight-bold.text-deep-purple {{ socialCard.totalEvents }}
              .text-body-2.text-medium-emphasis.ml-3 ocorrências no período
            v-row(dense)
              v-col(cols="12" sm="6" v-for="sub in socialCard.subindicators" :key="sub.name")
                v-card(
                  variant="tonal"
                  :color="sub.eventos > 0 ? 'deep-purple' : 'grey'"
                  class="pa-3"
                  :style="sub.eventos > 0 ? 'cursor:pointer' : ''"
                  @click="sub.eventos > 0 && openDrilldown(socialCard.name, sub.name)"
                )
                  .text-h5.font-weight-bold {{ sub.eventos }}
                  .text-caption.text-wrap {{ sub.name }}

  v-divider.my-6

  //- ── Relatórios Detalhados ──
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

  //- ── Gráficos & Exportação ──
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h6.font-weight-bold Gráficos e Relatórios
    .d-flex.gap-2
      v-btn(color="primary" variant="elevated" prepend-icon="mdi-file-pdf-box" :loading="generatingReport" :disabled="generatingReport" @click="generateReport") Exportar PDF
      v-btn(color="deep-orange" variant="elevated" prepend-icon="mdi-file-powerpoint-box" :loading="generatingPptx" :disabled="generatingPptx" @click="generatePptx") Exportar PPTX

  v-row
    v-col(cols="12")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold
          | Eventos por Indicador
          span.text-caption.text-medium-emphasis.ml-2 (clique na barra para ver pacientes)
        v-card-text
          .chart-container(style="position: relative; height: 400px;")
            Bar(ref="barChartRef" :data="barChartData" :options="barOptions")

  .d-flex.justify-space-between.align-center.mb-4.mt-6
    h2.text-h6.font-weight-bold Distribuição por Sub-indicador
    span.text-caption.text-medium-emphasis clique na barra para ver pacientes

  v-row
    v-col(cols="12" sm="6" lg="4" v-for="(card, idx) in analytics.indicatorsCards" :key="'bar-' + card.id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.text-subtitle-2.font-weight-bold.text-wrap(style="line-height: 1.3;") {{ card.name }}
        v-card-text.flex-grow-1.d-flex.flex-column.justify-center
          .chart-container(v-if="card.subindicators.length && card.totalEvents > 0" style="position: relative; height: 280px;")
            Bar(:ref="el => setDoughnutRef(el, idx)" :data="getSubBarDataForCard(card)" :options="getSubBarOptions(card)")
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

  //- ── Tabela Pivot ──
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

  //- ── Modal de Drill-down ──
  v-dialog(v-model="drilldownDialog" max-width="700" scrollable)
    v-card
      v-card-title.d-flex.justify-space-between.align-center.pa-4
        span.text-subtitle-1.font-weight-bold.text-wrap {{ drilldownTitle }}
        v-btn(icon="mdi-close" variant="text" @click="drilldownDialog = false")
      v-divider
      v-card-text.pa-0
        .text-caption.text-medium-emphasis.pa-4(v-if="!drilldownRows.length")
          | Nenhum paciente encontrado para este filtro.
        v-list(v-else density="compact" lines="two")
          v-list-item(
            v-for="(row, i) in drilldownRows"
            :key="i"
            :title="row.patient"
            prepend-icon="mdi-account"
          )
            template(v-slot:subtitle)
              .d-flex.align-center.flex-wrap.ga-1
                v-chip(size="x-small" color="deep-orange" variant="tonal") {{ row.operator }}
                span.text-caption.text-medium-emphasis · {{ row.subindicator }}
                span.text-caption.text-medium-emphasis · {{ row.date }}
      v-card-actions.pa-4
        .text-caption.text-medium-emphasis {{ drilldownRows.length }} registro(s)
        v-spacer
        v-btn(variant="tonal" @click="drilldownDialog = false") Fechar

</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
const { data: operators } = useCrud<any>('operators', { defaultPageSize: 100 })

const operatorMap = computed(() => {
  const map: Record<string, string> = {}
  for (const op of operators.value ?? []) map[String(op._id)] = op.name
  return map
})

function resolveOperator(p: any): string {
  if (!p.operator) return '—'
  if (typeof p.operator === 'object' && p.operator?.name) return p.operator.name
  return operatorMap.value[String(p.operator)] ?? '—'
}

const analytics = useDashboardAnalytics(patients, indicators, startDate, endDate)

const totalPatients = computed(() => patients.value?.length ?? 0)

// ── Hospitalization rate (ind 03 / total AD+ID patients) ──
const hospitalizationRateAbs = computed(() => {
  return analytics.value.indicatorsCards.find(c => c.name.startsWith('03'))?.totalEvents ?? 0
})
const adIdTotal = computed(() => {
  return analytics.value.indicatorsCards.find(c => c.name.startsWith('06'))?.totalEvents ?? 0
})
const hospitalizationRate = computed(() => {
  if (adIdTotal.value <= 0) return null
  return ((hospitalizationRateAbs.value / adIdTotal.value) * 100).toFixed(1)
})

// ── Social indicators card (ind 10) ──
const socialCard = computed(() =>
  analytics.value.indicatorsCards.find(c => c.name.startsWith('10')) ?? null,
)

// ── Drill-down ──
interface DrilldownRow {
  patient: string
  operator: string
  subindicator: string
  date: string
}

const drilldownDialog = ref(false)
const drilldownTitle = ref('')
const drilldownRows = ref<DrilldownRow[]>([])

const IND06_PREFIX = '06'

function openDrilldown(indicatorName: string, subindicatorName?: string) {
  const startD = startDate.value ? new Date(startDate.value + 'T00:00:00') : null
  const endD = endDate.value ? new Date(endDate.value + 'T23:59:59') : null
  const rows: DrilldownRow[] = []

  // Ind.06: mostrar pacientes pelo estado atual (último evento AD/ID no período)
  if (indicatorName.startsWith(IND06_PREFIX)) {
    for (const p of patients.value ?? []) {
      const ind06Events = (p.events ?? [])
        .filter((e: any) => (e.indicator?.name ?? '').startsWith(IND06_PREFIX))
        .filter((e: any) => {
          const d = new Date(e.occurrenceDate)
          return (!startD || d >= startD) && (!endD || d <= endD)
        })
        .sort((a: any, b: any) => a.occurrenceDate < b.occurrenceDate ? 1 : -1)

      if (!ind06Events.length) continue
      const lastEvent = ind06Events[0]
      const sub: string = lastEvent.subindicator?.name ?? ''
      if (subindicatorName && sub !== subindicatorName) continue
      rows.push({
        patient: p.name,
        operator: resolveOperator(p),
        subindicator: sub || '—',
        date: new Date(lastEvent.occurrenceDate).toLocaleDateString('pt-BR'),
      })
    }
  } else {
    for (const p of patients.value ?? []) {
      for (const e of p.events ?? []) {
        if (e.indicator?.name !== indicatorName) continue
        if (subindicatorName && e.subindicator?.name !== subindicatorName) continue
        const d = new Date(e.occurrenceDate)
        if (startD && d < startD) continue
        if (endD && d > endD) continue
        rows.push({
          patient: p.name,
          operator: resolveOperator(p),
          subindicator: e.subindicator?.name ?? '—',
          date: d.toLocaleDateString('pt-BR'),
        })
      }
    }
  }

  rows.sort((a, b) => a.patient.localeCompare(b.patient))
  drilldownTitle.value = subindicatorName
    ? `${indicatorName} › ${subindicatorName}`
    : indicatorName
  drilldownRows.value = rows
  drilldownDialog.value = true
}

// Abre modal filtrando por modalidade (AD/ID) e/ou convênio
function openByModalityAndOperator(modality?: string, operatorId?: string) {
  const startD = startDate.value ? new Date(startDate.value + 'T00:00:00') : null
  const endD = endDate.value ? new Date(endDate.value + 'T23:59:59') : null
  const rows: DrilldownRow[] = []

  for (const p of patients.value ?? []) {
    if (operatorId) {
      const opId = typeof p.operator === 'object' ? p.operator?._id : p.operator
      if (String(opId) !== String(operatorId)) continue
    }

    const ind06Events = (p.events ?? [])
      .filter((e: any) => (e.indicator?.name ?? '').startsWith(IND06_PREFIX))
      .filter((e: any) => {
        const d = new Date(e.occurrenceDate)
        return (!startD || d >= startD) && (!endD || d <= endD)
      })
      .sort((a: any, b: any) => a.occurrenceDate < b.occurrenceDate ? 1 : -1)

    if (!ind06Events.length) continue
    const sub: string = ind06Events[0].subindicator?.name ?? ''
    if (modality && !sub.includes(modality)) continue

    rows.push({
      patient: p.name,
      operator: resolveOperator(p),
      subindicator: sub || '—',
      date: new Date(ind06Events[0].occurrenceDate).toLocaleDateString('pt-BR'),
    })
  }

  rows.sort((a, b) => a.patient.localeCompare(b.patient))

  const parts: string[] = []
  if (modality) parts.push(modality)
  if (operatorId) parts.push(operatorMap.value[String(operatorId)] ?? operatorId)
  drilldownTitle.value = `Pacientes${parts.length ? ' — ' + parts.join(' · ') : ' AD/ID'}`
  drilldownRows.value = rows
  drilldownDialog.value = true
}

// ── Chart refs ──
const barChartRef = ref<any>(null)
const lineChartRef = ref<any>(null)
const doughnutChartRefs = ref<Record<number, any>>({})

const setDoughnutRef = (el: any, idx: number) => {
  if (el) doughnutChartRefs.value[idx] = el
}

// Gera um item de legenda por barra com a cor exata da barra
function generateColorLabels(chart: any): any[] {
  const labels: string[] = chart.data.labels || []
  const bg = chart.data.datasets[0]?.backgroundColor
  return labels.map((label: string, i: number) => ({
    text: label,
    fillStyle: Array.isArray(bg) ? bg[i % bg.length] : (bg ?? '#ccc'),
    strokeStyle: 'transparent',
    lineWidth: 0,
    hidden: false,
    index: i,
    datasetIndex: 0,
  }))
}

// ── Main Bar Chart ──
const barChartData = computed(() => ({
  labels: analytics.value.indicatorsCards.map(c => c.name),
  datasets: [{
    label: 'Total de Eventos',
    data: analytics.value.chartBarData?.datasets?.[0]?.data || [],
    backgroundColor: CHART_COLORS,
    borderRadius: 6,
    borderSkipped: false,
  }],
}))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  onClick: (_: any, elements: any[]) => {
    if (!elements.length) return
    const idx = elements[0].index
    const name = analytics.value.indicatorsCards[idx]?.name
    if (name) openDrilldown(name)
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        generateLabels: generateColorLabels,
        usePointStyle: true,
        pointStyle: 'rectRounded' as const,
        padding: 10,
        font: { size: 10 },
        boxWidth: 12,
        boxHeight: 12,
      },
    },
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
      ticks: { display: false },
    },
  },
}))

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

// ── Sub-indicator Bar Charts (per-card) ──
const getSubBarDataForCard = (card: any) => ({
  labels: card.subindicators.map((s: any) => s.name),
  datasets: [{
    label: 'Eventos',
    data: card.subindicators.map((s: any) => s.eventos),
    backgroundColor: CHART_COLORS,
    borderRadius: 4,
    borderSkipped: false,
  }],
})

const getSubBarOptions = (card: any) => ({
  responsive: true,
  maintainAspectRatio: false,
  onClick: (_: any, elements: any[]) => {
    if (!elements.length) return
    const idx = elements[0].index
    const sub = card.subindicators[idx]
    if (sub?.eventos > 0) openDrilldown(card.name, sub.name)
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        generateLabels: generateColorLabels,
        usePointStyle: true,
        pointStyle: 'rectRounded' as const,
        padding: 8,
        font: { size: 10 },
        boxWidth: 10,
        boxHeight: 10,
      },
    },
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
      ticks: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { font: { size: 10 }, stepSize: 1 },
    },
  },
})

// ── Report export ──
const generatingReport = ref(false)
const generatingPptx = ref(false)

function collectChartImages() {
  const charts: { title: string; image: string }[] = []
  if (barChartRef.value?.chart)
    charts.push({ title: 'Eventos por Indicador', image: barChartRef.value.chart.toBase64Image() })
  if (lineChartRef.value?.chart)
    charts.push({ title: 'Evolução Mensal', image: lineChartRef.value.chart.toBase64Image() })
  const cards = analytics.value.indicatorsCards
  for (const [idx, r] of Object.entries(doughnutChartRefs.value)) {
    if (r?.chart) {
      const card = cards[Number(idx)]
      charts.push({ title: card ? card.name : `Distribuição ${idx}`, image: r.chart.toBase64Image() })
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
