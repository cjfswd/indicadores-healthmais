import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "npm:chart.js";
import ChartDataLabels from "npm:chartjs-plugin-datalabels";
import { BarChart2, X } from "../components/icons.tsx";
import {
  computeAnalytics,
  type Patient,
  type Indicator,
  type IndicatorCard,
} from "../core/analytics.ts";

Chart.register(...registerables, ChartDataLabels);

const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1",
  "#84CC16", "#D946EF", "#0EA5E9", "#22C55E", "#A855F7",
];

// Custom HTML legend — color dot + full label, no truncation
function ChartLegend({ cards }: { cards: IndicatorCard[] }) {
  return (
    <div class="flex flex-wrap gap-x-5 gap-y-2 mt-4 px-1">
      {cards.map((card, i) => (
        <div key={card.id} class="flex items-center gap-1.5" style="font-size: 12px; color: var(--text-secondary);">
          <span
            class="shrink-0 rounded-sm"
            style={`width: 12px; height: 12px; background: ${CHART_COLORS[i % CHART_COLORS.length]};`}
          />
          <span>{card.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardCharts() {
  const patients = useSignal<Patient[]>([]);
  const indicators = useSignal<Indicator[]>([]);
  const startDate = useSignal("");
  const endDate = useSignal("");
  const loading = useSignal(true);

  const barChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);

  let barChart: Chart | null = null;
  let lineChart: Chart | null = null;

  const analytics = useComputed(() =>
    computeAnalytics(
      patients.value,
      indicators.value,
      startDate.value || undefined,
      endDate.value || undefined,
    )
  );

  useEffect(() => {
    async function fetchData() {
      loading.value = true;
      try {
        const [pRes, iRes] = await Promise.all([
          fetch("/api/patients?limit=1000"),
          fetch("/api/indicators"),
        ]);
        if (pRes.ok) patients.value = await pRes.json();
        if (iRes.ok) indicators.value = await iRes.json();
      } finally {
        loading.value = false;
      }
    }
    fetchData();
  }, []);

  // Horizontal bar chart — one color per indicator, no Chart.js legend (we use HTML legend)
  useEffect(() => {
    if (!barChartRef.current) return;
    barChart?.destroy();
    barChart = null;

    const { chartBarData } = analytics.value;
    if (chartBarData.labels.length === 0) return;

    barChart = new Chart(barChartRef.current, {
      type: "bar",
      data: {
        labels: chartBarData.labels,
        datasets: [{
          label: "Total de Eventos",
          data: chartBarData.datasets[0].data,
          backgroundColor: CHART_COLORS,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: "end",
            align: "end",
            color: "#374151",
            font: { weight: "bold", size: 11 },
            formatter: (v: number) => v > 0 ? String(v) : "",
          },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { stepSize: 1, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 }, display: false }, // hidden — HTML legend replaces it
          },
        },
      },
    });

    return () => { barChart?.destroy(); barChart = null; };
  }, [analytics.value.chartBarData]);

  // Line chart — full labels at bottom legend, filled areas, tension
  useEffect(() => {
    if (!lineChartRef.current) return;
    lineChart?.destroy();
    lineChart = null;

    const { chartLineData } = analytics.value;
    if (chartLineData.labels.length === 0) return;

    lineChart = new Chart(lineChartRef.current, {
      type: "line",
      data: {
        labels: chartLineData.labels,
        datasets: chartLineData.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          borderColor: CHART_COLORS[i % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + "20",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 11 },
              boxWidth: 10,
            },
          },
          datalabels: { display: false },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { stepSize: 1, font: { size: 11 } },
          },
        },
      },
    });

    return () => { lineChart?.destroy(); lineChart = null; };
  }, [analytics.value.chartLineData]);

  const { indicatorsCards, reportTableData, reportHeaders, adverseEventsData, ouvidoriasData } = analytics.value;
  const hasData = indicatorsCards.some((c) => c.totalEvents > 0);

  // Dynamic bar chart height: at least 280px, 44px per indicator
  const barHeight = Math.max(280, indicatorsCards.length * 44);

  return (
    <div class="space-y-5">
      {/* Date filter bar */}
      <div class="themed-card p-3">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" style="color: var(--text-secondary);" for="startDate">
              Data Inicial
            </label>
            <input id="startDate" type="date" lang="pt-BR" class="themed-input" value={startDate.value}
              onInput={(e) => (startDate.value = (e.target as HTMLInputElement).value)} />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" style="color: var(--text-secondary);" for="endDate">
              Data Final
            </label>
            <input id="endDate" type="date" lang="pt-BR" class="themed-input" value={endDate.value}
              onInput={(e) => (endDate.value = (e.target as HTMLInputElement).value)} />
          </div>
          {(startDate.value || endDate.value) && (
            <button
              class="flex items-center gap-1 text-sm font-medium self-end"
              style="color: #1565C0; background: none; border: none; cursor: pointer; padding: 6px 4px;"
              onClick={() => { startDate.value = ""; endDate.value = ""; }}
            >
              <X size={16} />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {loading.value && (
        <div class="flex items-center justify-center py-20" style="color: var(--text-secondary);">
          <svg class="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Carregando dados...
        </div>
      )}

      {!loading.value && !hasData && (
        <div class="flex flex-col items-center justify-center py-20 gap-3" style="color: var(--text-secondary);">
          <BarChart2 size={56} class="opacity-30" />
          <p class="font-medium">Nenhum evento encontrado</p>
          <p class="text-sm">Tente ajustar o período ou cadastre novos eventos.</p>
        </div>
      )}

      {!loading.value && hasData && (
        <>
          {/* ── Indicator summary cards ── */}
          <section>
            <h2 class="font-semibold mb-3" style="font-size: 15px; color: var(--text-primary);">Indicadores</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {indicatorsCards.map((card, i) => (
                <div key={card.id} class="themed-card p-4">
                  {/* Indicator color stripe */}
                  <div class="flex items-start gap-2 mb-2">
                    <span class="shrink-0 rounded-sm mt-0.5" style={`width: 4px; height: 36px; background: ${CHART_COLORS[i % CHART_COLORS.length]};`} />
                    <div>
                      <p class="text-xs font-medium leading-snug" style="color: var(--text-secondary);">{card.name}</p>
                      <p class="text-2xl font-bold mt-0.5" style={`color: ${CHART_COLORS[i % CHART_COLORS.length]};`}>
                        {card.totalEvents}
                        <span class="text-xs font-normal ml-1" style="color: var(--text-secondary);">eventos</span>
                      </p>
                    </div>
                  </div>
                  <div style={`height: 1px; background: ${CHART_COLORS[i % CHART_COLORS.length]}30; margin: 8px 0;`} />
                  <ul class="space-y-1">
                    {card.subindicators.map((sub) => (
                      <li key={sub.name} class="flex justify-between items-center text-xs">
                        <span style="color: var(--text-secondary);">{sub.name}</span>
                        <span
                          class="rounded-full px-2 py-0.5 font-semibold ml-2 shrink-0"
                          style={sub.eventos > 0
                            ? `background: ${CHART_COLORS[i % CHART_COLORS.length]}20; color: ${CHART_COLORS[i % CHART_COLORS.length]};`
                            : "background: var(--bg-main); color: var(--text-secondary);"}
                        >
                          {sub.eventos}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Horizontal bar chart + HTML legend ── */}
          <section class="themed-card p-5">
            <h2 class="font-semibold mb-1" style="font-size: 15px; color: var(--text-primary);">
              Eventos por Indicador
            </h2>
            {/* HTML legend — full names, color dots */}
            <ChartLegend cards={indicatorsCards} />
            <div class="relative mt-4" style={`height: ${barHeight}px;`}>
              <canvas ref={barChartRef} />
            </div>
          </section>

          {/* ── Line chart ── */}
          {analytics.value.chartLineData.datasets.length > 0 && (
            <section class="themed-card p-5">
              <h2 class="font-semibold mb-4" style="font-size: 15px; color: var(--text-primary);">
                Evolução Mensal
              </h2>
              <div class="relative h-80">
                <canvas ref={lineChartRef} />
              </div>
            </section>
          )}

          {/* ── Monthly pivot table ── */}
          {reportTableData.length > 0 && (
            <section class="themed-card overflow-x-auto">
              <div class="p-4 pb-2">
                <h2 class="font-semibold" style="font-size: 15px; color: var(--text-primary);">
                  Tabela Mensal
                </h2>
              </div>
              <table class="w-full text-sm">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-main);">
                    {Object.entries(reportHeaders).map(([key, label]) => (
                      <th key={key}
                        class={`px-4 py-3 font-medium whitespace-nowrap text-left ${key === "total" ? "text-right" : ""}`}
                        style="color: var(--text-secondary);"
                      >{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportTableData.map((row, i) => {
                    const isSubrow = String(row.indicador).startsWith(" >");
                    return (
                      <tr key={i} style={`border-bottom: 1px solid var(--border-color); background: ${isSubrow ? "var(--bg-main)" : "var(--bg-surface)"}; color: ${isSubrow ? "var(--text-secondary)" : "var(--text-primary)"};`}>
                        {Object.keys(reportHeaders).map((key) => (
                          <td key={key}
                            class={`px-4 py-2 whitespace-nowrap ${key === "total" ? "text-right font-semibold" : ""} ${key === "indicador" && isSubrow ? "pl-8" : ""}`}
                          >{String(row[key] ?? 0)}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
