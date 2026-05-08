import { useState, useEffect, useCallback } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { EventSchema } from '@/lib/domain-schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TextareaField } from '@/components/ui/form-fields';
import { Calendar } from '@/components/ui/calendar';
import { Plus, CalendarIcon, Edit2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { z } from 'zod';

type EventFormData = z.infer<typeof EventSchema>;

function getErrors(data: EventFormData) {
  const result = EventSchema.safeParse(data);
  return result.success ? {} : result.error.flatten().fieldErrors as Record<string, string[]>;
}

function parseEvent(event?: any): EventFormData {
  return EventSchema.parse(event || {});
}

export function EventFormModal({ event, onSuccess, onClose }: { event?: any, onSuccess?: () => void, onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setFormState] = useState<EventFormData>(() => parseEvent(event));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const [indicatorPopoverOpen, setIndicatorPopoverOpen] = useState(false);
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const { data: patients } = useCollection<any>('patients');
  const { data: indicators } = useCollection<any>('indicators');
  const { data: subindicators } = useCollection<any>('subindicators');
  const { save, isSaving } = useCollection('events');

  const NON_EVENT_INDICATOR_PREFIXES = ['06-'];

  useEffect(() => {
    if (open) {
      setFormState(parseEvent(event));
      setErrors({});
    }
  }, [open, event]);

  const setField = useCallback(<K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormState(prev => {
      const next = { ...prev, [field]: value };
      setErrors(getErrors(next));
      return next;
    });
  }, []);

  const indicatorOptions: { label: string; value: string; indicatorId: string; subindicatorId: string }[] = [];
  if (indicators) {
    indicators
      .filter(ind => !NON_EVENT_INDICATOR_PREFIXES.some(prefix => ind.name.startsWith(prefix)))
      .forEach(ind => {
      const subs = subindicators?.filter(sub => sub.parentIndicatorId === ind._id) || [];
      if (subs.length === 0) {
        indicatorOptions.push({
          label: ind.name,
          value: `${ind._id}|`,
          indicatorId: ind._id,
          subindicatorId: ""
        });
      } else {
        subs.forEach(sub => {
          indicatorOptions.push({
            label: `${ind.name} > ${sub.name}`,
            value: `${ind._id}|${sub._id}`,
            indicatorId: ind._id,
            subindicatorId: sub._id
          });
        });
      }
    });
  }

  const handleSave = () => {
    const errs = getErrors(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    save(form, {
      onSuccess: () => {
        setOpen(false);
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    });
  };

  const handleReset = () => {
    setFormState(parseEvent(event));
    setErrors({});
  };

  const isValid = Object.keys(getErrors(form)).length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={event 
          ? <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" />
          : <Button className="gap-2" />
        }
      >
        {event ? <Edit2 className="w-4 h-4" /> : <><Plus className="w-4 h-4" /> Registrar Evento</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Intercorrência' : 'Registrar Intercorrência / Evento'}</DialogTitle>
        </DialogHeader>
        
        <button type="button" className="sr-only" tabIndex={0} aria-hidden="true" />
        
        <div className="flex flex-col gap-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2 flex flex-col">
            <Label>Paciente *</Label>
            <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                />
              }>
                <span className={form.patientId ? 'text-foreground' : 'text-muted-foreground'}>
                  {form.patientId
                    ? (patients?.find((p: any) => p._id === form.patientId)?.name || 'Paciente selecionado')
                    : 'Buscar paciente...'}
                </span>
                <span className="shrink-0 ml-2 opacity-40 text-xs">&#9660;</span>
              </PopoverTrigger>
              <PopoverContent
                className="p-2"
                style={{ width: 'var(--anchor-width)' }}
                side="bottom"
                align="start"
              >
                <input
                  autoFocus
                  className="w-full text-sm px-2 py-1.5 rounded border border-input bg-background outline-none mb-2 placeholder:text-muted-foreground"
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-0.5">
                  {(patients || [])
                    .filter((p: any) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))
                    .map((p: any) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setField('patientId', p._id);
                          setPatientPopoverOpen(false);
                          setPatientSearch('');
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors hover:bg-muted',
                          form.patientId === p._id && 'bg-primary/10 text-primary font-medium'
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  {(patients || []).filter((p: any) => p.name.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Nenhum paciente encontrado.</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {errors.patientId && <p className="text-xs text-destructive">{errors.patientId}</p>}
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Indicador / Sub-indicador *</Label>
            <Popover open={indicatorPopoverOpen} onOpenChange={setIndicatorPopoverOpen}>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  className="w-full justify-between text-left font-normal h-auto min-h-9 py-1.5 px-3"
                />
              }>
                {form.indicatorId ? (() => {
                  const opt = indicatorOptions.find(o => o.value === `${form.indicatorId}|${form.subindicatorId || ""}`);
                  if (!opt) return <span className="text-muted-foreground text-sm">Selecione...</span>;
                  const parts = opt.label.split(' > ');
                  return (
                    <span className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground leading-tight">{parts[0]}</span>
                      {parts[1] && <span className="text-xs font-medium leading-tight">{parts[1]}</span>}
                    </span>
                  );
                })() : <span className="text-muted-foreground text-sm">Selecione...</span>}
                <span className="shrink-0 ml-2 opacity-40 text-xs">&#9660;</span>
              </PopoverTrigger>
              <PopoverContent
                className="p-0.5 max-h-[220px] overflow-y-auto custom-scrollbar"
                style={{ width: 'var(--anchor-width)' }}
                side="bottom"
                align="start"
              >
                {indicatorOptions.map(opt => {
                  const [indName, subName] = opt.label.split(' > ');
                  const isSelected = form.indicatorId === opt.indicatorId && (form.subindicatorId || "") === (opt.subindicatorId || "");
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          indicatorId: opt.indicatorId,
                          subindicatorId: opt.subindicatorId
                        }));
                        setErrors(getErrors({ ...form, indicatorId: opt.indicatorId, subindicatorId: opt.subindicatorId }));
                        setIndicatorPopoverOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded transition-colors hover:bg-muted flex flex-col",
                        isSelected && "bg-primary/10"
                      )}
                    >
                      <span className={cn("text-[10px] leading-tight", isSelected ? "text-primary" : "text-muted-foreground")}>{indName}</span>
                      {subName && <span className={cn("text-xs font-medium leading-tight", isSelected && "text-primary")}>{subName}</span>}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
            {(errors.indicatorId || errors.subindicatorId) && (
              <p className="text-xs text-destructive">
                {errors.subindicatorId || errors.indicatorId}
              </p>
            )}
          </div>

          <div className="space-y-1 flex flex-col">
            <Label>Data da Ocorrência *</Label>
            <Popover>
              <PopoverTrigger render={<Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.occurrenceDate && "text-muted-foreground"
                  )}
                />}>
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {form.occurrenceDate
                    ? format(new Date(form.occurrenceDate.split('T')[0] + 'T00:00:00'), 'dd/MM/yyyy')
                    : <span>Selecione a data</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.occurrenceDate ? new Date(form.occurrenceDate.split('T')[0] + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setField('occurrenceDate', date.toISOString().split('T')[0]);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {errors.occurrenceDate && <p className="text-xs text-destructive">{errors.occurrenceDate}</p>}
          </div>

          <TextareaField 
            label="Observações / Detalhes" 
            placeholder="Descreva mais detalhes sobre o evento..." 
            value={form.observations} 
            onChange={(v: string) => setField('observations', v)} 
            error={errors.observations} 
            maxLength={500}
          />

          {/* File input hidden — reserved for future implementation */}
        </div>

        <div className="flex justify-between items-center mt-4 pt-2 border-t">
          <div>
            {event && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-muted-foreground hover:text-foreground" title="Restaurar valores originais">
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
