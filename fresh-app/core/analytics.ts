const MONTH_KEYS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

type MonthKey = typeof MONTH_KEYS[number];

const MONTH_LABELS: Record<MonthKey, string> = {
  jan: "Jan", fev: "Fev", mar: "Mar", abr: "Abr", mai: "Mai", jun: "Jun",
  jul: "Jul", ago: "Ago", set: "Set", out: "Out", nov: "Nov", dez: "Dez",
};

function getMonthKey(date: Date): MonthKey {
  return MONTH_KEYS[date.getMonth()];
}

export interface Patient {
  _id: string;
  name: string;
  events?: PatientEvent[];
}

export interface PatientEvent {
  _id: string;
  occurrenceDate: string;
  indicator: { _id: string; name: string };
  subindicator: { _id: string; name: string };
  assistanceType?: string;
  observations?: string;
}

export interface Indicator {
  _id: string;
  name: string;
  subindicators: Array<{ _id: string; name: string }>;
}

export interface IndicatorCard {
  id: string;
  name: string;
  totalEvents: number;
  subindicators: Array<{ name: string; eventos: number }>;
}

export interface AnalyticsResult {
  indicatorsCards: IndicatorCard[];
  adverseEventsData: Array<{ name: string; eventos: number }>;
  ouvidoriasData: Array<{ name: string; eventos: number }>;
  reportTableData: Array<Record<string, unknown>>;
  reportHeaders: Record<string, string>;
  chartBarData: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  chartLineData: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
}

interface FlatEvent extends PatientEvent {
  patientId: string;
  patientName: string;
}

export function computeAnalytics(
  patients: Patient[],
  indicators: Indicator[],
  startDate?: string,
  endDate?: string,
): AnalyticsResult {
  const iList = [...indicators].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  const start = startDate ? new Date(startDate + "T00:00:00") : null;
  const end = endDate ? new Date(endDate + "T23:59:59") : null;

  // 1. Flatten all events from all patients
  let eList: FlatEvent[] = patients.flatMap((p) =>
    (p.events ?? []).map((e) => ({
      ...e,
      patientId: p._id,
      patientName: p.name,
    }))
  );

  // 2. Filter by date if startDate/endDate defined
  if (start || end) {
    eList = eList.filter((e) => {
      const d = new Date(e.occurrenceDate);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }

  // 3. Build indicator cards
  const indicatorsCards: IndicatorCard[] = iList.map((ind) => {
    // 4. Special logic for indicator 06 (AD/ID): count current state per patient
    const isAdId = ind.name.includes("06");

    const card: IndicatorCard = {
      id: ind._id,
      name: ind.name,
      totalEvents: 0,
      subindicators: [],
    };

    if (isAdId) {
      const modalityCounts: Record<string, number> = { AD: 0, ID: 0 };

      patients.forEach((p) => {
        const adIdEvents = (p.events ?? [])
          .filter((e) => e.indicator?.name === ind.name)
          .filter((e) => {
            const d = new Date(e.occurrenceDate);
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
          })
          .sort(
            (a, b) =>
              new Date(b.occurrenceDate).getTime() -
              new Date(a.occurrenceDate).getTime(),
          );

        if (adIdEvents.length > 0) {
          const subName = adIdEvents[0].subindicator?.name ?? "";
          if (subName.includes("AD")) modalityCounts["AD"]++;
          else if (subName.includes("ID")) modalityCounts["ID"]++;
        }
      });

      card.subindicators = ind.subindicators.map((sub) => {
        const isAd = sub.name.includes("AD");
        const isId = sub.name.includes("ID");
        const count = isAd
          ? modalityCounts["AD"]
          : isId
          ? modalityCounts["ID"]
          : 0;
        return { name: sub.name, eventos: count };
      });
      card.totalEvents = card.subindicators.reduce(
        (acc, curr) => acc + curr.eventos,
        0,
      );
    } else {
      // Normal logic: count total historical events
      const indEvents = eList.filter((e) => e.indicator?.name === ind.name);
      card.totalEvents = indEvents.length;

      const subCounts: Record<string, number> = {};
      indEvents.forEach((e) => {
        if (e.subindicator?.name) {
          subCounts[e.subindicator.name] =
            (subCounts[e.subindicator.name] ?? 0) + 1;
        }
      });

      card.subindicators = ind.subindicators.map((sub) => ({
        name: sub.name,
        eventos: subCounts[sub.name] ?? 0,
      }));
    }

    return card;
  });

  // 5. Adverse events: indicators with "adverso" in the name
  const adverseEvents = eList.filter(
    (e) =>
      e.indicator?.name.toLowerCase().includes("adverso") && e.subindicator,
  );
  const subCountsAdv: Record<string, number> = {};
  adverseEvents.forEach((e) => {
    const label = e.subindicator.name;
    subCountsAdv[label] = (subCountsAdv[label] ?? 0) + 1;
  });
  const adverseEventsData = Object.entries(subCountsAdv)
    .map(([name, count]) => ({
      name: name.length > 30 ? name.substring(0, 28) + "." : name,
      eventos: count,
    }))
    .sort((a, b) => b.eventos - a.eventos);

  // 6. Ouvidorias: indicators with "ouvidoria" in the name
  const ouvidoriasEvents = eList.filter(
    (e) =>
      e.indicator?.name.toLowerCase().includes("ouvidoria") && e.subindicator,
  );
  const subCountsOuv: Record<string, number> = {};
  ouvidoriasEvents.forEach((e) => {
    const label = e.subindicator.name;
    subCountsOuv[label] = (subCountsOuv[label] ?? 0) + 1;
  });
  const ouvidoriasData = Object.entries(subCountsOuv)
    .map(([name, count]) => ({
      name: name.length > 30 ? name.substring(0, 28) + "." : name,
      eventos: count,
    }))
    .sort((a, b) => b.eventos - a.eventos);

  // 7. Monthly pivot table
  const activeMonths = new Set<MonthKey>();
  eList.forEach((e) => {
    const d = new Date(e.occurrenceDate);
    if (!isNaN(d.getTime())) {
      activeMonths.add(getMonthKey(d));
    }
  });

  const sortedMonths = MONTH_KEYS.filter((m) => activeMonths.has(m));

  const reportTableData: Array<Record<string, unknown>> = [];

  for (const ind of iList) {
    const indEvents = eList.filter((e) => e.indicator?.name === ind.name);

    const parentRow: Record<string, unknown> = {
      indicador: ind.name,
      total: indEvents.length,
    };
    for (const m of sortedMonths) parentRow[m] = 0;

    indEvents.forEach((e) => {
      const d = new Date(e.occurrenceDate);
      if (!isNaN(d.getTime())) {
        const mk = getMonthKey(d);
        if (mk in parentRow) {
          parentRow[mk] = ((parentRow[mk] as number) ?? 0) + 1;
        }
      }
    });

    reportTableData.push(parentRow);

    for (const sub of ind.subindicators) {
      const subEvents = indEvents.filter(
        (e) => e.subindicator?.name === sub.name,
      );
      const subRow: Record<string, unknown> = {
        indicador: ` > ${sub.name}`,
        total: subEvents.length,
      };
      for (const m of sortedMonths) subRow[m] = 0;

      subEvents.forEach((e) => {
        const d = new Date(e.occurrenceDate);
        if (!isNaN(d.getTime())) {
          const mk = getMonthKey(d);
          if (mk in subRow) {
            subRow[mk] = ((subRow[mk] as number) ?? 0) + 1;
          }
        }
      });

      reportTableData.push(subRow);
    }
  }

  const reportHeaders: Record<string, string> = { indicador: "Indicador" };
  for (const m of sortedMonths) {
    reportHeaders[m] = MONTH_LABELS[m];
  }
  reportHeaders["total"] = "Total";

  // 8. Chart data
  const chartBarData = {
    labels: indicatorsCards.map((c) => c.name),
    datasets: [
      {
        data: indicatorsCards.map((c) => c.totalEvents),
      },
    ],
  };

  const chartLineData = {
    labels: sortedMonths.map((m) => MONTH_LABELS[m]),
    datasets: indicatorsCards
      .filter((c) => c.totalEvents > 0)
      .map((c) => {
        const indEvents = eList.filter((e) => e.indicator?.name === c.name);
        const monthlyCounts = sortedMonths.map(
          (m) =>
            indEvents.filter((e) => {
              const d = new Date(e.occurrenceDate);
              return !isNaN(d.getTime()) && getMonthKey(d) === m;
            }).length,
        );
        return {
          label: c.name,
          data: monthlyCounts,
        };
      }),
  };

  return {
    indicatorsCards,
    adverseEventsData,
    ouvidoriasData,
    reportTableData,
    reportHeaders,
    chartBarData,
    chartLineData,
  };
}
