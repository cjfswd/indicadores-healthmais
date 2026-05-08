import { useState, useEffect, useCallback } from 'react';
import { PatientSchema, ModalityLabels } from '@/lib/domain-schemas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, RotateCcw } from 'lucide-react';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-fields';
import { useCollection } from '@/hooks/useCollection';
import type { z } from 'zod';

type PatientFormData = z.infer<typeof PatientSchema>;

function getErrors(data: PatientFormData) {
  const result = PatientSchema.safeParse(data);
  const errors = (result.success ? {} : result.error.flatten().fieldErrors) as Record<string, string[]>;
  
  if (!data.modality) {
    errors.modality = ["A modalidade é obrigatória"];
  }
  
  return errors;
}

function parsePatient(patient?: any): PatientFormData {
  return PatientSchema.parse(patient || {});
}

export function PatientFormModal({ patient, onClose }: { patient?: any; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setFormState] = useState<PatientFormData>(() => parsePatient(patient));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { save, isSaving } = useCollection('patients');
  const { data: operators = [] } = useCollection<any>('operators');

  // Sync form with latest patient data every time the dialog opens
  useEffect(() => {
    if (open) {
      const parsed = parsePatient(patient);
      setFormState(parsed);
      setErrors({});
    }
  }, [open, patient]);

  const setField = useCallback(<K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    setFormState(prev => {
      const next = { ...prev, [field]: value };
      setErrors(getErrors(next));
      return next;
    });
  }, []);

  const handleReset = () => {
    const parsed = parsePatient(patient);
    setFormState(parsed);
    setErrors({});
  };

  const isValid = Object.keys(getErrors(form)).length === 0;

  const handleSave = () => {
    const errs = getErrors(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    save(form, {
      onSuccess: () => {
        setOpen(false);
        if (onClose) onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          patient
            ? <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" />
            : <Button className="gap-2" />
        }
      >
        {patient ? <Edit2 className="w-4 h-4" /> : <><Plus className="w-4 h-4" /> Novo Paciente</>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{patient ? 'Editar Paciente' : 'Cadastrar Paciente'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <InputField
            label="Nome Completo *"
            value={form.name}
            onChange={(v: string) => setField('name', v)}
            error={errors.name}
            placeholder="Nome do paciente"
          />
          <SelectField
            label="Operadora *"
            value={form.operatorId}
            onChange={(v: string) => setField('operatorId', v)}
            options={operators.map((op: any) => ({ value: op._id, label: op.name }))}
            error={errors.operatorId}
          />
          <SelectField
            label="Modalidade *"
            value={form.modality}
            onChange={(v: string) => setField('modality', v as any)}
            options={Object.entries(ModalityLabels).map(([val, lbl]) => ({ value: val, label: lbl }))}
            error={errors.modality}
          />
          <DatePickerField
            label="Nascimento"
            value={form.birthDate}
            onChange={val => setField('birthDate', val ?? '')}
          />
          <DatePickerField
            label="Data de Admissão"
            value={form.admissionDate}
            onChange={val => setField('admissionDate', val ?? '')}
          />
          <TextareaField
            label="Observações / Detalhes"
            placeholder="Descreva mais detalhes sobre o paciente..."
            value={form.observations}
            onChange={(v: string) => setField('observations', v)}
            error={errors.observations}
            maxLength={500}
          />
          {/* File input hidden — reserved for future implementation */}

        </div>

        <div className="flex justify-between items-center mt-4 pt-2 border-t">
          <div>
            {patient && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-muted-foreground hover:text-foreground"
                title="Restaurar valores originais"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button disabled={!isValid || isSaving} onClick={handleSave}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
