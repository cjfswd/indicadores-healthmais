import { useState } from 'react';
import { useCollection } from '@/hooks/useCollection';
import { dbExecute } from '@/lib/proxy-client';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Indicator, type Patient, type Event, VIRTUAL_SUBINDICATORS } from '@/lib/domain-schemas';
import { 
  Users, 
  HeartPulse, Target,
  FileText, FilterX,
  Activity, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format as formatDate } from 'date-fns';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CHART_COLORS = [
  'hsl(210, 100%, 56%)', // blue
  'hsl(160, 65%, 45%)',  // green
  'hsl(35, 92%, 55%)',   // amber
  'hsl(350, 72%, 55%)',  // red
  'hsl(270, 60%, 58%)',  // purple
  'hsl(190, 80%, 42%)',  // teal
];

const NON_EVENT_INDICATOR_PREFIXES = ['06-'];

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
      <div className="rounded-full bg-muted p-4">
        <Icon className="w-6 h-6 opacity-50" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { data: patients = [], isLoading: loadingPatients } = useCollection<Patient>('patients');
  const { data: indicators = [], isLoading: loadingIndicators } = useCollection<Indicator>('indicators');
  const { data: events = [], isLoading: loadingEvents } = useCollection<Event>('events');
  const { data: subindicators = [] } = useCollection<any>('subindicators');

  const isLoading = loadingPatients || loadingIndicators || loadingEvents;

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDate(prevMonth, 'yyyy-MM-dd'),
      end: formatDate(endOfCurrent, 'yyyy-MM-dd')
    };
  });

  const filteredEvents = events.filter(e => {
    // If user cleared filters explicitly, we still show the filtered set based on what's in the state
    // (which by default is now the 2-month range)
    if (dateRange.start && e.occurrenceDate < dateRange.start) return false;
    if (dateRange.end && e.occurrenceDate > dateRange.end) return false;
    return true;
  });

  const analytics = useDashboardAnalytics(patients, indicators, subindicators, filteredEvents);

  const handleDownloadReport = async (format: 'pdf' | 'xlsx' | 'pptx') => {
    try {
      // 1. Identify all months in range
      const months: string[] = [];
      const counts: Record<string, Record<string, number>> = {};
      
      // Calculate months from dateRange
      let current = dateRange.start ? new Date(dateRange.start + "T00:00:00") : null;
      const end = dateRange.end ? new Date(dateRange.end + "T00:00:00") : new Date();
      
      if (!current && filteredEvents.length > 0) {
        // Find earliest event if no start date
        current = new Date(Math.min(...filteredEvents.map(e => new Date(e.occurrenceDate).getTime())));
      } else if (!current) {
        current = new Date();
      }

      // Fill months array
      let temp = new Date(current.getFullYear(), current.getMonth(), 1);
      const stop = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (temp <= stop) {
        months.push(formatDate(temp, 'MM/yyyy'));
        temp.setMonth(temp.getMonth() + 1);
        if (months.length > 24) break; // Safety limit
      }

      if (months.length === 0) {
        months.push(formatDate(new Date(), 'MM/yyyy'));
      }
      
      filteredEvents.forEach(e => {
        const d = new Date(e.occurrenceDate);
        const monthKey = formatDate(d, 'MM/yyyy');
        const key = `${e.indicatorId}|${e.subindicatorId || ""}`;
        if (!counts[key]) counts[key] = {};
        counts[key][monthKey] = (counts[key][monthKey] || 0) + 1;
      });

      // 2. Build rows including subindicators
      const reportData: any[] = [];
      
      (indicators || [])
        .filter(ind => !NON_EVENT_INDICATOR_PREFIXES.some(prefix => ind.name.startsWith(prefix)))
        .forEach(ind => {
          // Check if this indicator has subindicators
          const subs = subindicators.filter(s => s.parentIndicatorId === ind._id);
          
          if (subs.length === 0) {
            // No subindicators, just one row for the indicator
            const row: any = { indicador: ind.name };
            const key = `${ind._id}|`;
            months.forEach(m => { row[m] = counts[key]?.[m] || 0; });
            row.total = Object.values(counts[key] || {}).reduce((a, b) => a + b, 0);
            reportData.push(row);
          } else {
            // Add a summary row for the parent indicator
            const parentRow: any = { indicador: ind.name };
            months.forEach(m => {
              // Sum of all subindicators for this month
              parentRow[m] = subs.reduce((acc, sub) => acc + (counts[`${ind._id}|${sub._id}`]?.[m] || 0), 0);
            });
            parentRow.total = months.reduce((acc, m) => acc + parentRow[m], 0);
            reportData.push(parentRow);

            // List subindicators
            subs.forEach(sub => {
              const row: any = { indicador: `${ind.name} > ${sub.name}` };
              const key = `${ind._id}|${sub._id}`;
              months.forEach(m => { row[m] = counts[key]?.[m] || 0; });
              row.total = Object.values(counts[key] || {}).reduce((a, b) => a + b, 0);
              reportData.push(row);
            });
          }
        });

      const headers: Record<string, string> = { indicador: 'Indicador > Sub-indicador' };
      months.forEach(m => { headers[m] = m; });
      headers.total = 'Total';

      const metadata = {
        collection: 'reports',
        action: 'generateReport' as const,
        data: {
          format,
          title: `Relatório Comparativo de Indicadores`,
          subtitle: `${dateRange.start ? formatDate(new Date(dateRange.start + "T00:00:00"), 'dd/MM/yyyy') : 'Início'} a ${dateRange.end ? formatDate(new Date(dateRange.end + "T00:00:00"), 'dd/MM/yyyy') : 'Hoje'}`,
          headers,
          data: reportData
        }
      };

      const { data: finalData, ...metaOnly } = metadata.data;
      
      const response: any = await dbExecute({
        ...metadata,
        data: metaOnly as any // Send metadata without the large data array in header
      }, new Blob([JSON.stringify(finalData)], { type: 'application/json' }));

      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-indicadores.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao baixar relatório: ${error.message}`);
    }
  };

  const resetFilters = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({
      start: formatDate(prevMonth, 'yyyy-MM-dd'),
      end: formatDate(endOfCurrent, 'yyyy-MM-dd')
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50 border-0 h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50 border-0 h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-muted-foreground">
          Visão geral consolidada e relatórios da plataforma Indicadores Healthmais.
        </p>
      </div>

      {/* Main Filter Card */}
      <Card className="p-4 bg-muted/30 border-primary/10">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="space-y-2 flex flex-col w-full md:w-auto">
            <Label>Período de Apuração</Label>
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
          <Button 
            variant="outline" 
            className="gap-2 shrink-0" 
            onClick={resetFilters}
          >
            <FilterX className="w-4 h-4" /> Limpar Filtro
          </Button>
        </div>
      </Card>

      {/* Indicadores Detalhados */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold tracking-tight">Indicadores e Metas</h3>
          <p className="text-sm text-muted-foreground">Acompanhamento detalhado por métrica.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {loadingIndicators ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50 border-0 h-32" />
          ))
        ) : indicators?.length === 0 ? (
          <div className="col-span-full p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Target className="w-8 h-8 opacity-50" />
            <p>Nenhum indicador cadastrado.</p>
          </div>
        ) : (
          indicators?.map((ind) => {
            const isPercentage = ind.targetType === 'PERCENTAGE';
            const realSubs = subindicators?.filter(s => s.parentIndicatorId === ind._id) || [];
            const virtualSubs = VIRTUAL_SUBINDICATORS
              .filter(vs => ind.name.startsWith(vs.parentIndicatorPrefix))
              .map(vs => ({ ...vs, parentIndicatorId: ind._id, targetValue: null, targetType: null }));
            const subs = [...realSubs, ...virtualSubs];
            const uniqueSubs = Array.from(new Map(subs.map(s => [s.name, s])).values());
            
            const isPatientQuantitative = ind.name.startsWith('06-');

            const indEvents = filteredEvents.filter(e => e.indicatorId === ind._id);
            let displayValue = indEvents.length.toString();
            let displaySuffix = isPercentage ? '%' : '';

            if (isPatientQuantitative) {
              displayValue = (patients?.length || 0).toString();
              displaySuffix = ' pac.';
            } else if (isPercentage) {
              const totalP = patients?.length || 1;
              const perc = (indEvents.length / totalP) * 100;
              displayValue = perc % 1 === 0 ? perc.toString() : perc.toFixed(1);
            }

            return (
              <Card key={ind._id} className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group border-primary/10 flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Activity className="w-16 h-16" />
                </div>
                <CardHeader className="pb-2 flex-none">
                  <CardTitle className="text-lg flex items-center justify-between z-10 relative">
                    <span className="truncate pr-4" title={ind.name}>{ind.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="z-10 relative flex-1 flex flex-col">
                  <div className="flex items-end justify-between mt-2 mb-4">
                    <div>
                      <div className="text-3xl font-black text-primary">
                        {displayValue}{displaySuffix}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        {isPatientQuantitative ? 'Total de Pacientes' : 'Apurado no Período'}
                      </p>
                    </div>
                    {!isPatientQuantitative && (
                      <Badge variant={ind.targetDirection === 'HIGHER_BETTER' ? 'default' : 'secondary'} className="shrink-0 mb-1">
                        {ind.targetDirection === 'HIGHER_BETTER' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        Meta: {ind.targetValue}{isPercentage ? '%' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {uniqueSubs.length > 0 && (
                    <div className="mt-auto pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subindicadores</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {uniqueSubs.map(sub => {
                          // Virtual subs (AD/ID): count patients by modality
                          const subCount = sub.nonSelectable
                            ? (patients?.filter((p: any) => p.modality === sub.name).length || 0)
                            : filteredEvents.filter(e => e.subindicatorId === sub._id).length;
                          return (
                            <div key={sub._id} className="flex items-center justify-between text-sm group/sub py-0.5">
                              <span className="text-foreground truncate pr-2 group-hover/sub:text-primary transition-colors" title={sub.name}>{sub.name}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md" title="Total Apurado">
                                  {subCount}
                                </span>
                                {sub.targetValue !== null && (
                                  <span className="font-mono text-[10px] font-semibold tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-md" title="Meta do Subindicador">
                                    META {sub.targetValue}{sub.targetType === 'PERCENTAGE' ? '%' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Gráficos Section Header */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold tracking-tight">Gráficos Analíticos</h3>
          <p className="text-sm text-muted-foreground">Distribuição e tendências de ocorrências.</p>
        </div>
      </div>

      {/* Charts List */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Modality Pie Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="w-4 h-4 text-primary" />
              Modalidade de Atendimento
            </CardTitle>
            <CardDescription>Distribuição dos pacientes</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.modalityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={analytics.modalityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.modalityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Users} message="Nenhum paciente cadastrado." />
            )}
          </CardContent>
        </Card>

        {/* Adverse Events Subitems */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Eventos Adversos
            </CardTitle>
            <CardDescription>Detalhamento por subitens</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.adverseEventsData && analytics.adverseEventsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.adverseEventsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={180} 
                    tick={{ fontSize: 11 }} 
                    className="fill-muted-foreground" 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="eventos" name="Ocorrências" radius={[0, 4, 4, 0]}>
                    {analytics.adverseEventsData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Activity} message="Nenhum evento adverso no período." />
            )}
          </CardContent>
        </Card>

        {/* Ouvidorias Subitems */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Ouvidorias
            </CardTitle>
            <CardDescription>Detalhamento por subitens</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.ouvidoriasData && analytics.ouvidoriasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.ouvidoriasData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={180} 
                    tick={{ fontSize: 11 }} 
                    className="fill-muted-foreground" 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="eventos" name="Ocorrências" radius={[0, 4, 4, 0]}>
                    {analytics.ouvidoriasData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Activity} message="Nenhuma ouvidoria no período." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full-width Relatórios Card at the bottom */}
      <Card className="w-full bg-muted/20 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" />
            Geração de Relatórios
          </CardTitle>
          <CardDescription>Gere relatórios consolidados dos indicadores com comparação mensal com base no Período de Apuração definido.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="min-w-[120px] gap-2" onClick={() => handleDownloadReport('pdf')} title="Baixar PDF">
              <FileText className="w-4 h-4 text-red-500" /> Gerar Relatório PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
