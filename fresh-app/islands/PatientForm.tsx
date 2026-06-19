import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Loader2, X } from "../components/icons.tsx";

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

interface PatientFormProps {
  patient?: Patient;
  operators: Operator[];
  onSave: () => void;
  onClose: () => void;
}

async function fileToBase64(
  file: File,
): Promise<{ name: string; type: string; size: number; data: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const data = result.split(",")[1];
      resolve({ name: file.name, type: file.type, size: file.size, data });
    };
    reader.readAsDataURL(file);
  });
}

export default function PatientForm(
  { patient, operators, onSave, onClose }: PatientFormProps,
) {
  const name = useSignal(patient?.name ?? "");
  const operatorId = useSignal(patient?.operator?._id ?? "");
  const admissionDate = useSignal((patient?.admissionDate ?? "").split("T")[0]);
  const birthDate = useSignal((patient?.birthDate ?? "").split("T")[0]);
  const observations = useSignal(patient?.observations ?? "");
  const selectedFile = useSignal<File | null>(null);
  const isSubmitting = useSignal(false);
  const formErrors = useSignal<Record<string, string>>({});

  useEffect(() => {
    name.value = patient?.name ?? "";
    operatorId.value = patient?.operator?._id ?? "";
    admissionDate.value = (patient?.admissionDate ?? "").split("T")[0];
    birthDate.value = (patient?.birthDate ?? "").split("T")[0];
    observations.value = patient?.observations ?? "";
    selectedFile.value = null;
    formErrors.value = {};
  }, [patient]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.value.trim()) {
      errs.name = "Nome é obrigatório";
    }
    if (observations.value.length > 500) {
      errs.observations = "Observações não podem ultrapassar 500 caracteres";
    }
    if (selectedFile.value && selectedFile.value.size > 5 * 1024 * 1024) {
      errs.file = "Arquivo não pode ultrapassar 5MB";
    }
    formErrors.value = errs;
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;

    isSubmitting.value = true;
    try {
      let fileData:
        | { name: string; type: string; size: number; data: string }
        | undefined;
      if (selectedFile.value) {
        fileData = await fileToBase64(selectedFile.value);
      }

      const data: Record<string, unknown> = {
        name: name.value.trim(),
        admissionDate: admissionDate.value || undefined,
        birthDate: birthDate.value || undefined,
        observations: observations.value || undefined,
        file: fileData ?? patient?.file,
      };

      if (operatorId.value) {
        const op = operators.find((o) => o._id === operatorId.value);
        if (op) {
          data.operator = { _id: op._id, name: op.name };
        }
      } else {
        data.operator = undefined;
      }

      const isEdit = Boolean(patient?._id);

      const res = await fetch("/api/db/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          "x-db-meta": JSON.stringify({
            action: isEdit ? "update" : "insert",
            collection: "patients",
            ...(isEdit ? { id: patient!._id } : {}),
            data,
          }),
        },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!json.success) {
        formErrors.value = { form: json.message ?? "Erro ao salvar paciente" };
        return;
      }

      onSave();
    } catch (err) {
      formErrors.value = {
        form: err instanceof Error ? err.message : "Erro inesperado",
      };
    } finally {
      isSubmitting.value = false;
    }
  }

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {patient ? "Editar Paciente" : "Novo Paciente"}
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

        {formErrors.value.form && (
          <div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {formErrors.value.form}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          {/* Nome */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nome <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name.value}
              onInput={(e) =>
                (name.value = (e.target as HTMLInputElement).value)}
              class={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                formErrors.value.name
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="Nome completo do paciente"
            />
            {formErrors.value.name && (
              <p class="mt-1 text-xs text-red-600">{formErrors.value.name}</p>
            )}
          </div>

          {/* Operadora */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Operadora
            </label>
            <select
              value={operatorId.value}
              onChange={(e) =>
                (operatorId.value = (e.target as HTMLSelectElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="">Selecione uma operadora</option>
              {operators.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          {/* Datas */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Data de Admissão
              </label>
              <input
                type="date"
                lang="pt-BR"
                value={admissionDate.value}
                onInput={(e) =>
                  (admissionDate.value =
                    (e.target as HTMLInputElement).value)}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                lang="pt-BR"
                value={birthDate.value}
                onInput={(e) =>
                  (birthDate.value = (e.target as HTMLInputElement).value)}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observations.value}
              onInput={(e) =>
                (observations.value =
                  (e.target as HTMLTextAreaElement).value)}
              rows={4}
              maxLength={500}
              class={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none ${
                formErrors.value.observations
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder="Observações sobre o paciente"
            />
            <div class="flex justify-between mt-1">
              {formErrors.value.observations
                ? (
                  <p class="text-xs text-red-600">
                    {formErrors.value.observations}
                  </p>
                )
                : <span />}
              <span class="text-xs text-gray-400">
                {observations.value.length}/500
              </span>
            </div>
          </div>

          {/* Arquivo */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Arquivo (máx. 5MB)
            </label>
            {patient?.file && !selectedFile.value && (
              <p class="text-xs text-gray-500 mb-2">
                Arquivo atual:{" "}
                <span class="font-medium">{patient.file.name}</span>
              </p>
            )}
            <input
              type="file"
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                selectedFile.value = files?.[0] ?? null;
              }}
              class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
            />
            {formErrors.value.file && (
              <p class="mt-1 text-xs text-red-600">{formErrors.value.file}</p>
            )}
          </div>

          {/* Actions */}
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting.value}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting.value}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting.value && <Loader2 size={16} class="animate-spin" />}
              {patient ? "Salvar Alterações" : "Criar Paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
