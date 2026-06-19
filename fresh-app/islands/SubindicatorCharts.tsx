import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { Chart, registerables } from "npm:chart.js";
import ChartDataLabels from "npm:chartjs-plugin-datalabels";
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

interface SubChartProps {
  card: IndicatorCard;
  colorIndex: number;
}

function SubChart({ card, colorIndex }: SubChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (card.subindicators.every((s) => s.eventos === 0)) return;

    const baseColor = CHART_COLORS[colorIndex % CHART_COLORS.length];

    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: card.subindicators.map((s) => s.name),
        datasets: [{
          label: "Eventos",
          data: card.subindicators.map((s) => s.eventos),
          backgroundColor: card.subindicators.map((_, i) =>
            CHART_COLORS[(colorIndex + i) % CHART_COLORS.length]
          ),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: "end",
            align: "top",
            color: "#374151",
            font: { size: 11, weight: "bold" },
            formatter: (value: number) => value > 0 ? String(value) : "",
          },
          tooltip: {
            backgroundColor: "#1E293B",
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              afterLabel(ctx) {
                const total = card.totalEvents;
                if (total === 0) return "";
                const pct = ((ctx.parsed.y / total) * 100).toFixed(1);
                return `${pct}% do total`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.06)" },
            ticks: { stepSize: 1, font: { size: 11 } },
          },
        },
      },
    });

    return () => { chart.destroy(); };
  }, [card]);

  const hasData = card.subindicators.some((s) => s.eventos > 0);
  const chartHeight = 200;

  if (!hasData) {
    return (
      <div class="themed-card p-4">
        <div class="flex items-center gap-2 mb-3">
          <span
            class="shrink-0 rounded-sm"
            style={`width: 4px; height: 32px; background: ${CHART_COLORS[colorIndex % CHART_COLORS.length]};`}
          />
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide leading-tight" style="color: var(--text-secondary);">
              {card.name}
            </p>
            <p class="text-lg font-bold" style="color: var(--text-secondary); opacity: 0.4;">0 eventos</p>
          </div>
        </div>
        <div class="flex items-center justify-center text-sm" style={`height: ${chartHeight}px; color: var(--text-secondary); opacity: 0.4;`}>
          Sem eventos registrados
        </div>
      </div>
    );
  }

  return (
    <div class="themed-card p-4">
      <div class="flex items-center gap-2 mb-3">
        <span
          class="shrink-0 rounded-sm"
          style={`width: 4px; height: 32px; background: ${CHART_COLORS[colorIndex % CHART_COLORS.length]};`}
        />
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide leading-tight" style="color: var(--text-secondary);">
            {card.name}
          </p>
          <p class="text-xl font-bold" style={`color: ${CHART_COLORS[colorIndex % CHART_COLORS.length]};`}>
            {card.totalEvents}
            <span class="text-xs font-normal ml-1" style="color: var(--text-secondary);">eventos</span>
          </p>
        </div>
      </div>

      {/* HTML legend for sub-indicator → color association */}
      <div class="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {card.subindicators.map((sub, i) => (
          <div key={sub.name} class="flex items-center gap-1.5" style="font-size: 11px; color: var(--text-secondary);">
            <span
              class="shrink-0 rounded-sm"
              style={`width: 10px; height: 10px; background: ${CHART_COLORS[(colorIndex + i) % CHART_COLORS.length]};`}
            />
            <span>{sub.name}</span>
          </div>
        ))}
      </div>

      <div class="relative" style={`height: ${chartHeight}px;`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default function SubindicatorCharts() {
  const patients = useSignal<Patient[]>([]);
  const indicators = useSignal<Indicator[]>([]);
  const loading = useSignal(true);

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

  const analytics = useComputed(() =>
    computeAnalytics(patients.value, indicators.value)
  );

  const { indicatorsCards } = analytics.value;
  const hasData = indicatorsCards.some((c) => c.totalEvents > 0);

  return (
    <div>
      <h2 class="font-semibold mb-4" style="font-size: 16px; color: var(--text-primary);">
        Gráficos por Sub-indicador
      </h2>

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
          <svg class="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="font-medium">Nenhum evento encontrado</p>
          <p class="text-sm">Cadastre eventos para visualizar os gráficos.</p>
        </div>
      )}

      {!loading.value && hasData && (
        <div class="flex flex-col gap-4">
          {indicatorsCards.map((card, i) => (
            <SubChart key={card.id} card={card} colorIndex={i} />
          ))}
        </div>
      )}
    </div>
  );
}
