import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { X } from "../components/icons.tsx";

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

interface EventFormProps {
  event?: PatientEvent;
  patientId?: string;
  patients: Patient[];
  indicators: Indicator[];
  onSave: () => void;
  onClose: () => void;
}

const ASSISTANCE_TYPES = [
  "enfermagem",
  "fisioterapia",
  "fonoaudiologia",
  "medicina",
  "nutrição",
  "psicologia",
] as const;

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

export default function EventForm({ event, patientId, patients, indicators, onSave, onClose }: EventFormProps) {
  const selectedPatientId = useSignal(patientId ?? event?._id ? (patientId ?? "") : "");
  const occurrenceDate = useSignal((event?.occurrenceDate ?? "").split("T")[0]);
  const selectedIndicatorId = useSignal(event?.indicator._id ?? "");
  const selectedSubindicatorId = useSignal(event?.subindicator._id ?? "");
  const selectedAssistanceType = useSignal<string>(event?.assistanceType ?? "");
  const observations = useSignal(event?.observations ?? "");
  const fileData = useSignal<{ name: string; type: string; size: number; data: string } | null>(event?.file ?? null);
  const saving = useSignal(false);
  const error = useSignal("");

  useEffect(() => {
    if (patientId) selectedPatientId.value = patientId;
  }, [patientId]);

  const selectedIndicator = useComputed(() =>
    indicators.find((ind) => ind._id === selectedIndicatorId.value) ?? null
  );

  const availableSubindicators = useComputed(() =>
    selectedIndicator.value?.subindicators ?? []
  );

  const showAssistanceType = useComputed(() => {
    const ind = selectedIndicator.value;
    return ind ? ind.name.toLowerCase().includes("pad") : false;
  });

  function handleIndicatorChange(id: string) {
    selectedIndicatorId.value = id;
    selectedSubindicatorId.value = "";
    selectedAssistanceType.value = "";
  }

  async function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      error.value = "Arquivo deve ter no máximo 5MB.";
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      fileData.value = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string,
      };
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error.value = "";

    const patient = patients.find((p) => p._id === selectedPatientId.value);
    if (!patient) { error.value = "Selecione um paciente."; return; }
    if (!occurrenceDate.value) { error.value = "Informe a data."; return; }
    if (!selectedIndicatorId.value) { error.value = "Selecione um indicador."; return; }
    if (!selectedSubindicatorId.value) { error.value = "Selecione um sub-indicador."; return; }

    const indicator = indicators.find((i) => i._id === selectedIndicatorId.value);
    const subindicator = indicator?.subindicators.find((s) => s._id === selectedSubindicatorId.value);
    if (!indicator || !subindicator) { error.value = "Indicador ou sub-indicador inválido."; return; }

    const newEvent: PatientEvent = {
      _id: event?._id ?? crypto.randomUUID(),
      occurrenceDate: occurrenceDate.value,
      indicator: { _id: indicator._id, name: indicator.name },
      subindicator: { _id: subindicator._id, name: subindicator.name },
      ...(showAssistanceType.value && selectedAssistanceType.value
        ? { assistanceType: selectedAssistanceType.value as PatientEvent["assistanceType"] }
        : {}),
      ...(observations.value ? { observations: observations.value } : {}),
      ...(fileData.value ? { file: fileData.value } : {}),
    };

    const existingEvents = patient.events ?? [];
    const updatedEvents = event
      ? existingEvents.map((ev) => (ev._id === event._id ? newEvent : ev))
      : [...existingEvents, newEvent];

    saving.value = true;
    try {
      const res = await dbExecute({
        action: "update",
        collection: "patients",
        id: patient._id,
        data: { events: updatedEvents },
      });
      if (!res.success) {
        error.value = res.message ?? "Erro ao salvar evento.";
        return;
      }
      onSave();
    } catch {
      error.value = "Erro ao salvar evento.";
    } finally {
      saving.value = false;
    }
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold text-gray-800">
            {event ? "Editar Evento" : "Novo Evento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            class="inline-flex items-center justify-center w-8 h-8 rounded transition hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            style="background: none; border: none; cursor: pointer;"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-4 space-y-4">
          {error.value && (
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error.value}
            </div>
          )}

          {/* Paciente */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Paciente <span class="text-red-500">*</span>
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPatientId.value}
              onChange={(e) => { selectedPatientId.value = (e.target as HTMLSelectElement).value; }}
              required
            >
              <option value="">Selecione um paciente...</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Data de Ocorrência <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              lang="pt-BR"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={occurrenceDate.value}
              onChange={(e) => { occurrenceDate.value = (e.target as HTMLInputElement).value; }}
              required
            />
          </div>

          {/* Indicador */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Indicador <span class="text-red-500">*</span>
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedIndicatorId.value}
              onChange={(e) => handleIndicatorChange((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">Selecione um indicador...</option>
              {indicators.map((ind) => (
                <option key={ind._id} value={ind._id}>{ind.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-indicador */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Sub-indicador <span class="text-red-500">*</span>
            </label>
            <select
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={selectedSubindicatorId.value}
              onChange={(e) => { selectedSubindicatorId.value = (e.target as HTMLSelectElement).value; }}
              required
              disabled={availableSubindicators.value.length === 0}
            >
              <option value="">
                {availableSubindicators.value.length === 0
                  ? "Selecione um indicador primeiro..."
                  : "Selecione um sub-indicador..."}
              </option>
              {availableSubindicators.value.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Assistência (condicional: indicador PAD) */}
          {showAssistanceType.value && (
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Assistência
              </label>
              <select
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedAssistanceType.value}
                onChange={(e) => { selectedAssistanceType.value = (e.target as HTMLSelectElement).value; }}
              >
                <option value="">Selecione...</option>
                {ASSISTANCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Observações */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={observations.value}
              onInput={(e) => { observations.value = (e.target as HTMLTextAreaElement).value; }}
              placeholder="Observações opcionais..."
            />
          </div>

          {/* Arquivo */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Arquivo (máx. 5MB)
            </label>
            {fileData.value && (
              <div class="flex items-center gap-2 mb-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2">
                <span class="truncate flex-1">{fileData.value.name}</span>
                <button
                  type="button"
                  onClick={() => { fileData.value = null; }}
                  class="text-red-500 hover:text-red-700 shrink-0 font-medium"
                >
                  Remover
                </button>
              </div>
            )}
            <input
              type="file"
              class="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
            />
          </div>

          {/* Ações */}
          <div class="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={saving.value}
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              disabled={saving.value}
            >
              {saving.value ? "Salvando..." : (event ? "Salvar Alterações" : "Criar Evento")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
