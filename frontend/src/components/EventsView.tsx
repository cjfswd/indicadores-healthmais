import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Event } from '@/lib/domain-schemas';
import { Search, Calendar, User as UserIcon, Trash2, FilterX, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { EventFormModal } from './EventFormModal';
import { useCollection } from '@/hooks/useCollection';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { format } from 'date-fns';

export function EventsView() {
  const { data: events, isLoading: loadingEvents, remove: deleteEvent } = useCollection<Event>('events');
  const { data: patients } = useCollection<any>('patients');
  const { data: indicators } = useCollection<any>('indicators');
  const { data: subindicators } = useCollection<any>('subindicators');
  
  const [searchPatient, setSearchPatient] = useState('');
  const [searchIndicator, setSearchIndicator] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const clearFilters = () => {
    setSearchPatient('');
    setSearchIndicator('');
    setDateRange({ start: '', end: '' });
  };

  const filteredEvents = events?.filter(ev => {
    const patient = patients?.find(p => p._id === ev.patientId);
    const patientName = patient ? patient.name.toLowerCase() : '';
    
    const indicator = indicators?.find(i => i._id === ev.indicatorId);
    const indicatorName = indicator ? indicator.name.toLowerCase() : '';
    
    const matchesPatient = searchPatient === '' || patientName.includes(searchPatient.toLowerCase());
    const matchesIndicator = searchIndicator === '' || indicatorName.includes(searchIndicator.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.start && ev.occurrenceDate < dateRange.start) matchesDate = false;
    if (dateRange.end && ev.occurrenceDate > dateRange.end) matchesDate = false;

    return matchesPatient && matchesIndicator && matchesDate;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Eventos e Intercorrências
          </h2>
          <p className="text-muted-foreground">Registro de todos os eventos da operação.</p>
        </div>
        <EventFormModal />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Card className="p-4 bg-muted/30 mb-6 border-primary/10">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 flex flex-col w-full">
                  <Label>Buscar por Paciente</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Search className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput 
                      placeholder="Nome do paciente..." 
                      value={searchPatient} 
                      onChange={e => setSearchPatient(e.target.value)} 
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2 flex flex-col w-full">
                  <Label>Buscar por Indicador</Label>
                  <InputGroup>
                    <InputGroupAddon>
                      <Search className="w-4 h-4" />
                    </InputGroupAddon>
                    <InputGroupInput 
                      placeholder="Nome do indicador..." 
                      value={searchIndicator} 
                      onChange={e => setSearchIndicator(e.target.value)} 
                    />
                  </InputGroup>
                </div>
                
                <div className="space-y-2 flex flex-col w-full">
                  <Label>Período de Ocorrência</Label>
                  <div className="flex items-center gap-2">
                    <DatePickerField 
                      value={dateRange.start}
                      onChange={(val) => setDateRange(prev => ({ ...prev, start: val || '' }))}
                      placeholder="Data inicial"
                    />
                    <span className="text-muted-foreground">até</span>
                    <DatePickerField 
                      value={dateRange.end}
                      onChange={(val) => setDateRange(prev => ({ ...prev, end: val || '' }))}
                      placeholder="Data final"
                    />
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

          {loadingEvents ? (
            <p className="text-sm text-muted-foreground py-4">Carregando eventos...</p>
          ) : filteredEvents?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg bg-card/50">Nenhum evento registrado.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents?.map((ev) => {
                const patient = patients?.find(p => p._id === ev.patientId);
                const indicator = indicators?.find(i => i._id === ev.indicatorId);
                const subindicator = subindicators?.find((s: any) => s._id === ev.subindicatorId);
                const fileUrl: string | undefined = (ev as any).fileUrl;

                const datePart = ev.occurrenceDate?.split('T')[0];
                const timePart = ev.occurrenceDate?.split('T')[1];
                const hasTime = timePart && timePart !== '00:00' && timePart !== '';

                return (
                <Card key={ev._id} className="border-l-4 border-l-primary hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                          <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground line-clamp-1" title={patient?.name || ev.patientId}>
                            {patient ? patient.name : `Paciente ${ev.patientId.substring(0, 8)}...`}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1" title={indicator?.name}>
                            {indicator ? indicator.name : 'Evento Avulso'}
                          </p>
                          {subindicator && (
                            <span className="inline-block mt-1 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {subindicator.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                        <Badge variant="outline" className="bg-background">Evento</Badge>
                      </div>
                    </div>

                    {(ev as any).observations && (
                      <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5 border-l-2 border-primary/30 line-clamp-3">
                        {(ev as any).observations}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {datePart ? format(new Date(datePart + 'T00:00:00'), 'dd/MM/yyyy') : '--'}
                        {hasTime && <> - {timePart}</>}
                      </div>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                          title="Baixar anexo"
                        >
                          <Paperclip className="w-3 h-3" />
                          Anexo
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
