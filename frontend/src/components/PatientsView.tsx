import { useState } from 'react';
import { ModalityLabels } from '@/lib/domain-schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserCircle, FilterX } from 'lucide-react';
import { PatientFormModal } from './PatientFormModal';
import { useCollection } from '@/hooks/useCollection';
import { SelectField } from '@/components/ui/form-fields';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';

export function PatientsView() {
  const { data: patients, isLoading } = useCollection('patients');
  const { data: operators = [] } = useCollection<any>('operators');

  const [filters, setFilters] = useState({
    name: '',
    operatorId: 'all',
    modality: 'all',
    birthStart: '',
    birthEnd: '',
    admissionStart: '',
    admissionEnd: ''
  });

  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const clearFilters = () => {
    setFilters({
      name: '',
      operatorId: 'all',
      modality: 'all',
      birthStart: '',
      birthEnd: '',
      admissionStart: '',
      admissionEnd: ''
    });
  };

  const filteredPatients = patients?.filter(p => {
    if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.operatorId !== 'all' && p.operatorId !== filters.operatorId) return false;
    if (filters.modality !== 'all' && p.modality !== filters.modality) return false;
    
    if (filters.birthStart && p.birthDate && p.birthDate < filters.birthStart) return false;
    if (filters.birthEnd && p.birthDate && p.birthDate > filters.birthEnd) return false;
    
    if (filters.admissionStart && p.admissionDate && p.admissionDate < filters.admissionStart) return false;
    if (filters.admissionEnd && p.admissionDate && p.admissionDate > filters.admissionEnd) return false;
    
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">Gestão de pacientes e modalidades de atendimento.</p>
        </div>
        <PatientFormModal />
      </div>

      <Card className="p-4 bg-muted/30">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 flex flex-col w-full">
              <Label>Buscar por Nome</Label>
              <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  />
                }>
                  <div className="flex items-center gap-2 truncate">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className={filters.name ? 'text-foreground' : 'text-muted-foreground truncate'}>
                      {filters.name || 'Buscar paciente...'}
                    </span>
                  </div>
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
                    placeholder="Filtrar por nome..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(f => ({ ...f, name: '' }));
                        setPatientPopoverOpen(false);
                        setPatientSearch('');
                      }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors hover:bg-muted italic',
                        filters.name === '' && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      Todos os pacientes
                    </button>
                    {(patients || [])
                      .filter((p: any) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))
                      .slice(0, 50) // Limit to 50 for performance in the list
                      .map((p: any) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setFilters(f => ({ ...f, name: p.name }));
                            setPatientPopoverOpen(false);
                            setPatientSearch('');
                          }}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 rounded text-sm transition-colors hover:bg-muted',
                            filters.name === p.name && 'bg-primary/10 text-primary font-medium'
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
            </div>
            <SelectField 
              label="Operadora" 
              value={filters.operatorId} 
              onChange={(v: any) => setFilters(f => ({ ...f, operatorId: v }))} 
              options={[{ value: 'all', label: 'Todas' }, ...operators.map((op: any) => ({ value: op._id, label: op.name }))]} 
            />
            <SelectField 
              label="Modalidade" 
              value={filters.modality} 
              onChange={(v: any) => setFilters(f => ({ ...f, modality: v }))} 
              options={[{ value: 'all', label: 'Todas' }, ...Object.entries(ModalityLabels).map(([val, lbl]) => ({ value: val, label: lbl }))]} 
            />
            <div className="space-y-2 flex flex-col w-full">
              <Label>Período de Nascimento</Label>
              <div className="flex items-center gap-2">
                <DatePickerField placeholder="Data inicial" value={filters.birthStart} onChange={v => setFilters(f => ({ ...f, birthStart: v || '' }))} />
                <span className="text-muted-foreground">até</span>
                <DatePickerField placeholder="Data final" value={filters.birthEnd} onChange={v => setFilters(f => ({ ...f, birthEnd: v || '' }))} />
              </div>
            </div>
            <div className="space-y-2 flex flex-col w-full">
              <Label>Período de Admissão</Label>
              <div className="flex items-center gap-2">
                <DatePickerField placeholder="Data inicial" value={filters.admissionStart} onChange={v => setFilters(f => ({ ...f, admissionStart: v || '' }))} />
                <span className="text-muted-foreground">até</span>
                <DatePickerField placeholder="Data final" value={filters.admissionEnd} onChange={v => setFilters(f => ({ ...f, admissionEnd: v || '' }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="outline" className="gap-2" onClick={clearFilters}>
              <FilterX className="w-4 h-4" /> Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando pacientes...</p>
      ) : filteredPatients?.length === 0 ? (
        <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2">
          <UserCircle className="w-8 h-8 opacity-50" />
          <p>Nenhum paciente encontrado com estes filtros.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients?.map(p => (
            <Card key={p._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col gap-3">
                {/* Header: name + modality badge */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground break-words leading-tight flex-1">{p.name}</p>
                  <div className="inline-flex shrink-0 bg-muted/50 px-2 py-0.5 rounded text-xs text-muted-foreground">
                    {p.modality ? (ModalityLabels[p.modality as keyof typeof ModalityLabels] || p.modality) : 'Sem Modalidade'}
                  </div>
                </div>

                {/* Dates + operator */}
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border-t pt-3">
                  <div>
                    <span className="block font-medium mb-0.5 text-foreground/80">Nascimento</span>
                    {p.birthDate ? format(new Date(p.birthDate + 'T00:00:00'), 'dd/MM/yyyy') : '--'}
                  </div>
                  <div>
                    <span className="block font-medium mb-0.5 text-foreground/80">Admissão</span>
                    {p.admissionDate ? format(new Date(p.admissionDate + 'T00:00:00'), 'dd/MM/yyyy') : '--'}
                  </div>
                  <div>
                    <span className="block font-medium mb-0.5 text-foreground/80">Operadora</span>
                    {operators.find((op: any) => op._id === p.operatorId)?.name || '--'}
                  </div>
                </div>

                {/* Observations */}
                {p.observations && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5 border-l-2 border-primary/30 line-clamp-3">
                    {p.observations}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end pt-1 -mb-2">
                  <PatientFormModal patient={p} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
