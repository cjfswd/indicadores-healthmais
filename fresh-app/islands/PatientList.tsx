import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { Calendar, Download, Paperclip, Pencil, Search, Trash2, Users, X } from "../components/icons.tsx";
import PatientForm from "./PatientForm.tsx";

interface Patient {
  _id: string;
  name: string;
  operator?: { _id: string; name: string };
  admissionDate?: string;
  birthDate?: string;
  observations?: string;
  file?: { name: string; type: string; size: number; data: string };
  events?: Array<{
    _id: string;
    occurrenceDate: string;
    indicator: { name: string };
    subindicator: { name: string };
  }>;
}

interface Operator {
  _id: string;
  name: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

export default function PatientList() {
  const patients = useSignal<Patient[]>([]);
  const total = useSignal(0);
  const page = useSignal(1);
  const nameFilter = useSignal("");
  const operatorFilter = useSignal("");
  const operators = useSignal<Operator[]>([]);
  const isLoading = useSignal(false);
  const showForm = useSignal(false);
  const editingPatient = useSignal<Patient | null>(null);
  const confirmDeleteId = useSignal<string | null>(null);
  const isDeleting = useSignal(false);

  const totalPages = useComputed(() => Math.ceil(total.value / 10) || 1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getToken() {
    return typeof globalThis.localStorage !== "undefined"
      ? (globalThis.localStorage.getItem("auth_token") ?? "")
      : "";
  }

  async function dbExec(meta: Record<string, unknown>) {
    const res = await fetch("/api/db/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
        "x-db-meta": JSON.stringify(meta),
      },
      body: JSON.stringify({}),
    });
    return res.json();
  }

  async function fetchPatients() {
    isLoading.value = true;
    try {
      const query: Record<string, unknown> = {};
      if (nameFilter.value.trim()) query.name = { $regex: nameFilter.value.trim(), $options: "i" };
      if (operatorFilter.value) query["operator._id"] = operatorFilter.value;
      const json = await dbExec({ action: "find", collection: "patients", skip: (page.value - 1) * 10, limit: 10, query });
      if (json.success) { patients.value = json.result as Patient[]; total.value = json.total as number; }
    } finally { isLoading.value = false; }
  }

  async function fetchOperators() {
    const json = await dbExec({ action: "find", collection: "operators", limit: 200, query: {} });
    if (json.success) operators.value = json.result as Operator[];
  }

  useEffect(() => { fetchOperators(); }, []);
  useEffect(() => { fetchPatients(); }, [page.value, operatorFilter.value]);

  function handleNameInput(value: string) {
    nameFilter.value = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { page.value = 1; fetchPatients(); }, 300);
  }

  function clearFilters() {
    nameFilter.value = ""; operatorFilter.value = ""; page.value = 1; fetchPatients();
  }

  async function confirmDelete() {
    if (!confirmDeleteId.value) return;
    isDeleting.value = true;
    try {
      const json = await dbExec({ action: "delete", collection: "patients", id: confirmDeleteId.value });
      if (json.success) { confirmDeleteId.value = null; fetchPatients(); }
    } finally { isDeleting.value = false; }
  }

  function downloadFile(file: Patient["file"], patientId: string) {
    if (!file) return;
    const a = document.createElement("a");
    a.href = `/api/db/file/patients/${patientId}/0`;
    a.download = file.name;
    a.click();
  }

  // ── Shared button styles ───────────────────────────────────────────────────
  const btnIcon = "inline-flex items-center justify-center w-8 h-8 rounded transition";
  const btnIconBlue = `${btnIcon}` + " " + "hover:bg-blue-50";
  const btnIconRed  = `${btnIcon}` + " " + "hover:bg-red-50";

  return (
    <div class="space-y-5">
      {/* ── Header ── */}
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold" style="color: var(--text-primary);">Pacientes</h1>
        <button
          type="button"
          onClick={() => { editingPatient.value = null; showForm.value = true; }}
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition"
          style="background: #1565C0; border: none; cursor: pointer;"
        >
          Novo Paciente
        </button>
      </div>

      {/* ── Filtros ── */}
      <div class="themed-card p-3">
        <div class="flex flex-col sm:flex-row gap-3 items-end">
          <div class="relative flex-1">
            <input
              type="text"
              value={nameFilter.value}
              onInput={(e) => handleNameInput((e.target as HTMLInputElement).value)}
              placeholder="Buscar por nome..."
              class="themed-input w-full pr-9"
            />
            <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;">
              <Search size={16} />
            </span>
          </div>
          <select
            value={operatorFilter.value}
            onChange={(e) => { operatorFilter.value = (e.target as HTMLSelectElement).value; page.value = 1; }}
            class="themed-input sm:w-56"
          >
            <option value="">Filtrar Operadora</option>
            {operators.value.map((op) => (
              <option key={op._id} value={op._id}>{op.name}</option>
            ))}
          </select>
          {(nameFilter.value || operatorFilter.value) && (
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
      {isLoading.value ? (
        <div class="flex items-center justify-center py-20" style="color: var(--text-secondary);">
          <svg class="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Carregando...
        </div>
      ) : patients.value.length === 0 ? (
        <div class="flex flex-col items-center justify-center py-20 gap-3" style="color: var(--text-secondary);">
          <Users size={56} class="opacity-30" />
          <p class="font-medium">Nenhum paciente encontrado</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.value.map((patient) => {
            const evCount = patient.events?.length ?? 0;
            return (
              <div key={patient._id} class="themed-card flex flex-col">
                {/* Card title */}
                <div class="p-4 pb-3">
                  <h3 class="font-bold text-base leading-snug" style="color: var(--text-primary);">
                    {patient.name}
                  </h3>
                </div>

                {/* Card body */}
                <div class="px-4 pb-3 flex flex-col gap-1.5 flex-1 text-sm">
                  <div style="color: var(--text-primary);">
                    <span class="font-bold">Operadora: </span>
                    <span style="color: var(--text-secondary);">{patient.operator?.name ?? <em style="color: #f59e0b;">Falta adicionar</em>}</span>
                  </div>
                  <div style="color: var(--text-primary);">
                    <span class="font-bold">Admissão: </span>
                    {patient.admissionDate
                      ? <span style="color: var(--text-secondary);">{formatDate(patient.admissionDate)}</span>
                      : <em style="color: #f59e0b;">Falta adicionar</em>}
                  </div>
                  <div style="color: var(--text-primary);">
                    <span class="font-bold">Nasc.: </span>
                    {patient.birthDate
                      ? <span style="color: var(--text-secondary);">{formatDate(patient.birthDate)}</span>
                      : <em style="color: #f59e0b;">Falta adicionar</em>}
                  </div>
                  <div style="color: var(--text-primary);">
                    <span class="font-bold">Obs: </span>
                    {patient.observations
                      ? <span style="color: var(--text-secondary);">{patient.observations}</span>
                      : <em style="color: var(--text-secondary); opacity: 0.6;">Nenhuma observação</em>}
                  </div>

                  {/* Chips */}
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    {evCount > 0 && (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style="background: #1565C018; color: #1565C0; border: 1px solid #1565C030;">
                        <Calendar size={12} />
                        {evCount} evento{evCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {patient.file ? (
                      <button
                        type="button"
                        onClick={() => downloadFile(patient.file, patient._id)}
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer"
                        style="background: #1565C018; color: #1565C0; border: 1px solid #1565C030;"
                      >
                        <Download size={12} />
                        {patient.file.name}
                      </button>
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
                <div class="px-3 py-2 flex items-center">
                  <a
                    href={`/eventos?patientId=${patient._id}`}
                    class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition"
                    style="color: #1565C0;"
                  >
                    <Calendar size={15} />
                    Eventos
                  </a>
                  <div class="flex-1" />
                  <button
                    type="button"
                    onClick={() => { editingPatient.value = patient; showForm.value = true; }}
                    class={btnIconBlue}
                    style="color: #1565C0; background: none; border: none; cursor: pointer;"
                    aria-label="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { confirmDeleteId.value = patient._id; }}
                    class={btnIconRed}
                    style="color: #d32f2f; background: none; border: none; cursor: pointer;"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginação ── */}
      {totalPages.value > 1 && (
        <div class="flex items-center justify-between pt-1 gap-3 flex-wrap">
          <span class="text-sm" style="color: var(--text-secondary);">
            Página {page.value} de {totalPages.value} — {total.value} paciente{total.value !== 1 ? "s" : ""}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (page.value > 1) page.value--; }}
              disabled={page.value <= 1 || isLoading.value}
              class="px-3 py-2 text-sm font-medium rounded-lg transition disabled:opacity-40"
              style="border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); cursor: pointer;"
            >Anterior</button>
            <button
              type="button"
              onClick={() => { if (page.value < totalPages.value) page.value++; }}
              disabled={page.value >= totalPages.value || isLoading.value}
              class="px-3 py-2 text-sm font-medium rounded-lg transition disabled:opacity-40"
              style="border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); cursor: pointer;"
            >Próxima</button>
            <div class="flex items-center gap-1">
              <input
                id="pat-jump"
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
                  const el = document.getElementById("pat-jump") as HTMLInputElement;
                  const v = parseInt(el.value, 10);
                  if (v >= 1 && v <= totalPages.value) { page.value = v; el.value = ""; }
                }}
              >Ir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal PatientForm ── */}
      {showForm.value && (
        <PatientForm
          patient={editingPatient.value ?? undefined}
          operators={operators.value}
          onSave={() => { showForm.value = false; editingPatient.value = null; fetchPatients(); }}
          onClose={() => { showForm.value = false; editingPatient.value = null; }}
        />
      )}

      {/* ── Dialog de confirmação de exclusão ── */}
      {confirmDeleteId.value && (
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl" style="background: var(--bg-surface);">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style="background: #fef2f2;">
                <Trash2 size={20} color="#d32f2f" />
              </div>
              <div>
                <h3 class="font-semibold" style="color: var(--text-primary);">Excluir paciente</h3>
                <p class="text-sm mt-0.5" style="color: var(--text-secondary);">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { confirmDeleteId.value = null; }}
                disabled={isDeleting.value}
                class="px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-40"
                style="border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); cursor: pointer;"
              >Cancelar</button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting.value}
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-40"
                style="background: #d32f2f; border: none; cursor: pointer;"
              >
                {isDeleting.value && (
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
