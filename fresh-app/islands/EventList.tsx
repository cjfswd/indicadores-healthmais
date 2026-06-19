import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ArrowLeft, Download, Paperclip, Pencil, Trash2, X } from "../components/icons.tsx";
import EventForm from "./EventForm.tsx";

interface PatientEvent {
  _id: string;
  occurrenceDate: string;
  indicator: { _id: string; name: string };
  subindicator: { _id: string; name: string };
  assistanceType?: "enfermagem" | "fisioterapia" | "fonoaudiologia" | "medicina" | "nutrição" | "psicologia";
  observations?: string;
  file?: { name: string; type: string; size: number; data: string };
}

interface Patient {
  _id: string;
  name: string;
  events?: PatientEvent[];
}

interface Indicator {
  _id: string;
  name: string;
  subindicators: Array<{ _id: string; name: string }>;
}

interface FlatEvent {
  event: PatientEvent;
  patient: Patient;
}

const PAGE_SIZE = 9;

function getToken(): string {
  if (typeof globalThis.localStorage === "undefined") return "";
  return globalThis.localStorage.getItem("auth_token") ?? "";
}

async function dbExecute(meta: Record<string, unknown>): Promise<{ success: boolean; result?: unknown; message?: string }> {
  const res = await fetch("/api/db/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`,
      "x-db-meta": JSON.stringify(meta),
    },
  });
  return res.json();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function capitalize(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function EventList() {
  const patients = useSignal<Patient[]>([]);
  const indicators = useSignal<Indicator[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");

  const patientFilter = useSignal("");
  const indicatorFilter = useSignal("");
  const subindicatorFilter = useSignal("");
  const page = useSignal(1);
  const cameFromPatient = useSignal(false);

  const showForm = useSignal(false);
  const editingEvent = useSignal<{ event: PatientEvent; patientId: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location?.search ?? "");
    const pid = params.get("patientId");
    if (pid) { patientFilter.value = pid; cameFromPatient.value = true; }
    loadData();
  }, []);

  async function loadData() {
    loading.value = true; error.value = "";
    try {
      const [pRes, iRes] = await Promise.all([
        dbExecute({ action: "find", collection: "patients", limit: 1000 }),
        dbExecute({ action: "find", collection: "indicators", limit: 200 }),
      ]);
      if (!pRes.success) throw new Error(pRes.message ?? "Erro ao buscar pacientes");
      if (!iRes.success) throw new Error(iRes.message ?? "Erro ao buscar indicadores");
      patients.value = (pRes.result as Patient[]) ?? [];
      indicators.value = (iRes.result as Indicator[]) ?? [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erro ao carregar dados.";
    } finally { loading.value = false; }
  }

  const availableSubindicators = useComputed(() => {
    const ind = indicators.value.find((i) => i._id === indicatorFilter.value);
    return ind?.subindicators ?? [];
  });

  const allEvents = useComputed<FlatEvent[]>(() =>
    patients.value.flatMap((patient) =>
      (patient.events ?? []).map((event) => ({ event, patient }))
    )
  );

  const filteredEvents = useComputed<FlatEvent[]>(() => {
    let list = allEvents.value;
    if (patientFilter.value) list = list.filter((fe) => fe.patient._id === patientFilter.value);
    if (indicatorFilter.value) list = list.filter((fe) => fe.event.indicator._id === indicatorFilter.value);
    if (subindicatorFilter.value) list = list.filter((fe) => fe.event.subindicator._id === subindicatorFilter.value);
    return list.slice().sort((a, b) =>
      new Date(b.event.occurrenceDate).getTime() - new Date(a.event.occurrenceDate).getTime()
    );
  });

  const totalPages = useComputed(() => Math.max(1, Math.ceil(filteredEvents.value.length / PAGE_SIZE)));

  const paginatedEvents = useComputed<FlatEvent[]>(() => {
    const start = (page.value - 1) * PAGE_SIZE;
    return filteredEvents.value.slice(start, start + PAGE_SIZE);
  });

  function clearFilters() {
    patientFilter.value = ""; indicatorFilter.value = ""; subindicatorFilter.value = "";
    cameFromPatient.value = false; page.value = 1;
  }

  async function handleDelete(fe: FlatEvent) {
    if (!globalThis.confirm(`Excluir evento de "${fe.patient.name}" em ${formatDate(fe.event.occurrenceDate)}?`)) return;
    const updatedEvents = (fe.patient.events ?? []).filter((ev) => ev._id !== fe.event._id);
    const res = await dbExecute({ action: "update", collection: "patients", id: fe.patient._id, data: { events: updatedEvents } });
    if (!res.success) { alert(res.message ?? "Erro ao excluir evento."); return; }
    await loadData();
  }

  // ── Shared button styles ────────────────────────────────────────────────
  const btnIcon = "inline-flex items-center justify-center w-8 h-8 rounded transition";

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-20" style="color: var(--text-secondary);">
        <svg class="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Carregando eventos...
      </div>
    );
  }

  if (error.value) {
    return (
      <div class="rounded-lg p-4 text-sm" style="background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;">
        {error.value}
        <button type="button" onClick={loadData} class="ml-3 underline">Tentar novamente</button>
      </div>
    );
  }

  return (
    <div class="space-y-5">
      {/* ── Header ── */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          {cameFromPatient.value && (
            <button
              type="button"
              onClick={() => { globalThis.history.back(); }}
              class={`${btnIcon} hover:bg-gray-100`}
              style="color: var(--text-secondary); background: none; border: none; cursor: pointer;"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 class="text-xl font-bold" style="color: var(--text-primary);">Eventos</h1>
        </div>
        <button
          type="button"
          onClick={() => { editingEvent.value = null; showForm.value = true; }}
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition"
          style="background: #1565C0; border: none; cursor: pointer;"
        >
          Novo Evento
        </button>
      </div>

      {/* ── Filtros ── */}
      <div class="themed-card p-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
          <div>
            <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">Paciente</label>
            <select
              class="themed-input w-full"
              value={patientFilter.value}
              onChange={(e) => { patientFilter.value = (e.target as HTMLSelectElement).value; page.value = 1; }}
            >
              <option value="">Filtrar Paciente</option>
              {patients.value.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">Indicador</label>
            <select
              class="themed-input w-full"
              value={indicatorFilter.value}
              onChange={(e) => { indicatorFilter.value = (e.target as HTMLSelectElement).value; subindicatorFilter.value = ""; page.value = 1; }}
            >
              <option value="">Filtrar Indicador</option>
              {indicators.value.map((ind) => <option key={ind._id} value={ind._id}>{ind.name}</option>)}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">Sub-indicador</label>
            <select
              class="themed-input w-full"
              value={subindicatorFilter.value}
              disabled={availableSubindicators.value.length === 0}
              style={availableSubindicators.value.length === 0 ? "opacity: 0.5; cursor: not-allowed;" : ""}
              onChange={(e) => { subindicatorFilter.value = (e.target as HTMLSelectElement).value; page.value = 1; }}
            >
              <option value="">{availableSubindicators.value.length === 0 ? "Selecione um indicador" : "Buscar Sub-indicador..."}</option>
              {availableSubindicators.value.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <p class="text-xs" style="color: var(--text-secondary);">
            {filteredEvents.value.length} evento{filteredEvents.value.length !== 1 ? "s" : ""} encontrado{filteredEvents.value.length !== 1 ? "s" : ""}
          </p>
          {(patientFilter.value || indicatorFilter.value || subindicatorFilter.value) && (
            <button
              type="button"
              onClick={clearFilters}
              class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition"
              style="color: #1565C0; background: none; border: none; cursor: pointer;"
            >
              <X size={14} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Grid de cards ── */}
      {paginatedEvents.value.length === 0 ? (
        <div class="flex flex-col items-center justify-center py-20 gap-3" style="color: var(--text-secondary);">
          <svg class="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={1}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="font-medium">Nenhum evento encontrado</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedEvents.value.map(({ event, patient }) => (
            <div key={`${patient._id}-${event._id}`} class="themed-card flex flex-col">
              {/* Card title */}
              <div class="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                <h3 class="font-bold text-base leading-snug" style="color: var(--text-primary);">
                  {patient.name}
                </h3>
                <span class="text-xs shrink-0 mt-0.5" style="color: var(--text-secondary);">
                  {formatDate(event.occurrenceDate)}
                </span>
              </div>

              {/* Card body */}
              <div class="px-4 pb-3 flex flex-col gap-1.5 flex-1 text-sm">
                <div style="color: var(--text-primary);">
                  <span class="font-bold">Indicador: </span>
                  <span style="color: var(--text-secondary);">{event.indicator.name}</span>
                </div>
                <div style="color: var(--text-primary);">
                  <span class="font-bold">Sub-Indicador: </span>
                  <span style="color: var(--text-secondary);">{event.subindicator.name}</span>
                </div>
                {event.assistanceType && (
                  <div style="color: var(--text-primary);">
                    <span class="font-bold">Assistência: </span>
                    <span style="color: var(--text-secondary);">{capitalize(event.assistanceType)}</span>
                  </div>
                )}
                <div style="color: var(--text-primary);">
                  <span class="font-bold">Obs: </span>
                  {event.observations
                    ? <span style="color: var(--text-secondary);">{event.observations}</span>
                    : <em style="color: var(--text-secondary); opacity: 0.6;">Nenhuma observação</em>}
                </div>

                {/* Chip arquivo */}
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {event.file ? (
                    <a
                      href={`/api/db/file/patients/${patient._id}/0/${event._id}`}
                      download={event.file.name}
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style="background: #1565C018; color: #1565C0; border: 1px solid #1565C030;"
                    >
                      <Download size={12} />
                      {event.file.name}
                    </a>
                  ) : (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style="background: var(--bg-main); color: var(--text-secondary); border: 1px solid var(--border-color);">
                      <Paperclip size={12} />
                      Nenhum anexo
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style="height: 1px; background: var(--border-color);" />

              {/* Card actions */}
              <div class="px-3 py-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => { editingEvent.value = { event, patientId: patient._id }; showForm.value = true; }}
                  class={`${btnIcon} hover:bg-blue-50`}
                  style="color: #1565C0; background: none; border: none; cursor: pointer;"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete({ event, patient })}
                  class={`${btnIcon} hover:bg-red-50`}
                  style="color: #d32f2f; background: none; border: none; cursor: pointer;"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Paginação ── */}
      {totalPages.value > 1 && (
        <div class="flex items-center justify-between pt-1 gap-3 flex-wrap">
          <p class="text-xs" style="color: var(--text-secondary);">
            Página {page.value} de {totalPages.value}
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (page.value > 1) page.value--; }}
              disabled={page.value <= 1}
              class="px-3 py-2 text-sm font-medium rounded-lg transition disabled:opacity-40"
              style="border: 1px solid var(--border-color); color: var(--text-primary); background: var(--bg-surface); cursor: pointer;"
            >Anterior</button>
            <button
              type="button"
              onClick={() => { if (page.value < totalPages.value) page.value++; }}
              disabled={page.value >= totalPages.value}
              class="px-3 py-2 text-sm font-medium rounded-lg transition disabled:opacity-40"
              style="border: 1px solid var(--border-color); color: var(--text-primary); background: var(--bg-surface); cursor: pointer;"
            >Próxima</button>
            <div class="flex items-center gap-1">
              <input
                id="ev-jump"
                type="number"
                min={1}
                max={totalPages.value}
                placeholder="Ir p/"
                class="themed-input text-sm text-center"
                style="width: 68px;"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (v >= 1 && v <= totalPages.value) { page.value = v; (e.target as HTMLInputElement).value = ""; }
                }}
              />
              <button
                type="button"
                class="px-3 py-2 text-sm font-medium rounded-lg transition"
                style="background: #1565C0; color: #fff; border: none; cursor: pointer;"
                onClick={() => {
                  const el = document.getElementById("ev-jump") as HTMLInputElement;
                  const v = parseInt(el.value, 10);
                  if (v >= 1 && v <= totalPages.value) { page.value = v; el.value = ""; }
                }}
              >Ir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal EventForm ── */}
      {showForm.value && (
        <EventForm
          event={editingEvent.value?.event}
          patientId={(editingEvent.value?.patientId ?? patientFilter.value) || undefined}
          patients={patients.value}
          indicators={indicators.value}
          onSave={async () => { showForm.value = false; editingEvent.value = null; await loadData(); }}
          onClose={() => { showForm.value = false; editingEvent.value = null; }}
        />
      )}
    </div>
  );
}
