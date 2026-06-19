import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { computeAnalytics, type Indicator, type Patient } from "../core/analytics.ts";

// ── fixtures ─────────────────────────────────────────────────────────────────

const IND_QUEDAS: Indicator = {
  _id: "ind01",
  name: "01 - Quedas",
  subindicators: [
    { _id: "s1", name: "Queda com dano" },
    { _id: "s2", name: "Queda sem dano" },
  ],
};

const IND_AD: Indicator = {
  _id: "ind06",
  name: "06 - AD/ID",
  subindicators: [
    { _id: "s3", name: "Assistência Domiciliar (AD)" },
    { _id: "s4", name: "Internação Domiciliar (ID)" },
  ],
};

const IND_ADVERSO: Indicator = {
  _id: "ind08",
  name: "08 - Evento adverso",
  subindicators: [
    { _id: "s5", name: "Reação medicamentosa" },
    { _id: "s6", name: "Infecção" },
  ],
};

function makePatient(id: string, events: Patient["events"] = []): Patient {
  return { _id: id, name: `Paciente ${id}`, events };
}

function makeEvent(
  indicatorName: string,
  subName: string,
  date = "2025-03-15",
): NonNullable<Patient["events"]>[0] {
  return {
    _id: crypto.randomUUID(),
    occurrenceDate: date,
    indicator: { _id: "x", name: indicatorName },
    subindicator: { _id: "x", name: subName },
  };
}

// ── testes ───────────────────────────────────────────────────────────────────

Deno.test("retorna estrutura vazia quando não há pacientes", () => {
  const result = computeAnalytics([], [IND_QUEDAS]);
  assertEquals(result.indicatorsCards.length, 1);
  assertEquals(result.indicatorsCards[0].totalEvents, 0);
  assertEquals(result.adverseEventsData.length, 0);
  assertEquals(result.ouvidoriasData.length, 0);
  assertEquals(result.reportTableData.length, 3); // 1 pai + 2 sub-indicadores
});

Deno.test("conta eventos por sub-indicador corretamente", () => {
  const patients = [
    makePatient("p1", [
      makeEvent("01 - Quedas", "Queda com dano"),
      makeEvent("01 - Quedas", "Queda com dano"),
      makeEvent("01 - Quedas", "Queda sem dano"),
    ]),
  ];

  const result = computeAnalytics(patients, [IND_QUEDAS]);
  const card = result.indicatorsCards[0];

  assertEquals(card.totalEvents, 3);
  assertEquals(card.subindicators.find((s) => s.name === "Queda com dano")?.eventos, 2);
  assertEquals(card.subindicators.find((s) => s.name === "Queda sem dano")?.eventos, 1);
});

Deno.test("lógica AD/ID: conta estado atual por paciente (não histórico)", () => {
  const patients = [
    makePatient("p1", [
      makeEvent("06 - AD/ID", "Assistência Domiciliar (AD)", "2025-01-01"),
      makeEvent("06 - AD/ID", "Internação Domiciliar (ID)", "2025-02-01"), // último = ID
    ]),
    makePatient("p2", [
      makeEvent("06 - AD/ID", "Assistência Domiciliar (AD)", "2025-03-01"), // único = AD
    ]),
  ];

  const result = computeAnalytics(patients, [IND_AD]);
  const card = result.indicatorsCards[0];

  // p1 → ID (último evento), p2 → AD
  assertEquals(card.subindicators.find((s) => s.name.includes("AD"))?.eventos, 1);
  assertEquals(card.subindicators.find((s) => s.name.includes("ID"))?.eventos, 1);
  assertEquals(card.totalEvents, 2);
});

Deno.test("filtro por data exclui eventos fora do intervalo", () => {
  const patients = [
    makePatient("p1", [
      makeEvent("01 - Quedas", "Queda com dano", "2025-01-10"),
      makeEvent("01 - Quedas", "Queda sem dano", "2025-06-15"),
      makeEvent("01 - Quedas", "Queda com dano", "2025-12-01"),
    ]),
  ];

  const result = computeAnalytics(patients, [IND_QUEDAS], "2025-03-01", "2025-09-30");
  assertEquals(result.indicatorsCards[0].totalEvents, 1); // só junho
});

Deno.test("eventos adversos são agrupados separadamente", () => {
  const patients = [
    makePatient("p1", [
      makeEvent("08 - Evento adverso", "Reação medicamentosa"),
      makeEvent("08 - Evento adverso", "Reação medicamentosa"),
      makeEvent("08 - Evento adverso", "Infecção"),
    ]),
  ];

  const result = computeAnalytics(patients, [IND_ADVERSO]);
  assertEquals(result.adverseEventsData.length, 2);
  const reacao = result.adverseEventsData.find((d) => d.name === "Reação medicamentosa");
  assertExists(reacao);
  assertEquals(reacao.eventos, 2);
});

Deno.test("pivot mensal conta corretamente por mês", () => {
  const patients = [
    makePatient("p1", [
      makeEvent("01 - Quedas", "Queda com dano", "2025-03-05"),
      makeEvent("01 - Quedas", "Queda com dano", "2025-03-20"),
      makeEvent("01 - Quedas", "Queda sem dano", "2025-05-10"),
    ]),
  ];

  const result = computeAnalytics(patients, [IND_QUEDAS]);
  const parentRow = result.reportTableData.find((r) => r.indicador === "01 - Quedas");
  assertExists(parentRow);
  assertEquals(parentRow["mar"], 2);
  assertEquals(parentRow["mai"], 1);
  assertEquals(parentRow["total"], 3);
});

Deno.test("chart bar data tem um label por indicador", () => {
  const patients = [makePatient("p1", [makeEvent("01 - Quedas", "Queda com dano")])];
  const result = computeAnalytics(patients, [IND_QUEDAS]);
  assertEquals(result.chartBarData.labels.length, 1);
  assertEquals(result.chartBarData.datasets[0].data.length, 1);
});

Deno.test("múltiplos indicadores são ordenados numericamente", () => {
  const ind2: Indicator = { _id: "i2", name: "02 - Lesão", subindicators: [] };
  const ind10: Indicator = { _id: "i10", name: "10 - Outro", subindicators: [] };
  const result = computeAnalytics([], [ind10, ind2, IND_QUEDAS]);
  assertEquals(result.indicatorsCards[0].name, "01 - Quedas");
  assertEquals(result.indicatorsCards[1].name, "02 - Lesão");
  assertEquals(result.indicatorsCards[2].name, "10 - Outro");
});
