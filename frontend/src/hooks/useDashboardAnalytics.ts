import { useMemo } from 'react';
import { type Indicator, type Patient, type Event, ModalityLabels } from '@/lib/domain-schemas';

export function useDashboardAnalytics(patients: Patient[], indicators: Indicator[], subindicators: any[], events: Event[]) {
  return useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentEvents = events.filter(e => new Date(e.occurrenceDate) >= thirtyDaysAgo);
    const previousEvents = events.filter(e => {
      const d = new Date(e.occurrenceDate);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const eventTrend = previousEvents.length > 0
      ? ((recentEvents.length - previousEvents.length) / previousEvents.length * 100).toFixed(0)
      : null;

    // Modality distribution
    const modalityCounts: Record<string, number> = {};
    patients.forEach(p => {
      const label = p.modality ? (ModalityLabels[p.modality as keyof typeof ModalityLabels] || p.modality) : 'Não informada';
      modalityCounts[label] = (modalityCounts[label] || 0) + 1;
    });
    const modalityData = Object.entries(modalityCounts).map(([name, value]) => ({ name, value }));

    // Events per day (last 14 days)
    const eventsPerDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      eventsPerDay[key] = 0;
    }
    events.forEach(e => {
      const d = new Date(e.occurrenceDate);
      if (d >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)) {
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (eventsPerDay[key] !== undefined) {
          eventsPerDay[key]++;
        }
      }
    });
    const timelineData = Object.entries(eventsPerDay).map(([date, count]) => ({ date, eventos: count }));

    // Events per indicator (bar chart)
    const eventsPerIndicator: Record<string, number> = {};
    events.forEach(e => {
      if (e.indicatorId) {
        const ind = indicators.find(i => i._id === e.indicatorId);
        const label = ind?.name || 'Desconhecido';
        eventsPerIndicator[label] = (eventsPerIndicator[label] || 0) + 1;
      } else {
        eventsPerIndicator['Avulso'] = (eventsPerIndicator['Avulso'] || 0) + 1;
      }
    });
    const indicatorBarData = Object.entries(eventsPerIndicator)
      .map(([name, count]) => ({ name: name.length > 18 ? name.substring(0, 16) + '…' : name, eventos: count }))
      .sort((a, b) => b.eventos - a.eventos)
      .slice(0, 6);

    // Recent events (last 5)
    const latestEvents = [...events]
      .sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
      .slice(0, 5);

    // Eventos Adversos Subindicators
    const adverseEventsIndicator = indicators.find(i => i.name.toLowerCase().includes('adverso'));
    let adverseEventsData: { name: string, eventos: number }[] = [];
    
    if (adverseEventsIndicator) {
      const adverseEvents = events.filter(e => e.indicatorId === adverseEventsIndicator._id && e.subindicatorId);
      const subCounts: Record<string, number> = {};
      
      adverseEvents.forEach(e => {
        const sub = subindicators.find(s => s._id === e.subindicatorId);
        const label = sub?.name || 'Desconhecido';
        subCounts[label] = (subCounts[label] || 0) + 1;
      });
      
      adverseEventsData = Object.entries(subCounts)
        .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + '…' : name, eventos: count }))
        .sort((a, b) => b.eventos - a.eventos);
    }

    // Ouvidorias Subindicators
    const ouvidoriasIndicator = indicators.find(i => i.name.toLowerCase().includes('ouvidoria'));
    let ouvidoriasData: { name: string, eventos: number }[] = [];
    
    if (ouvidoriasIndicator) {
      const ouvidoriasEvents = events.filter(e => e.indicatorId === ouvidoriasIndicator._id && e.subindicatorId);
      const subCounts: Record<string, number> = {};
      
      ouvidoriasEvents.forEach(e => {
        const sub = subindicators.find(s => s._id === e.subindicatorId);
        const label = sub?.name || 'Desconhecido';
        subCounts[label] = (subCounts[label] || 0) + 1;
      });
      
      ouvidoriasData = Object.entries(subCounts)
        .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + '…' : name, eventos: count }))
        .sort((a, b) => b.eventos - a.eventos);
    }

    return {
      totalPatients: patients.length,
      totalIndicators: indicators.length,
      totalEvents: events.length,
      recentEventCount: recentEvents.length,
      eventTrend,
      eventTrendDirection: eventTrend !== null ? (Number(eventTrend) >= 0 ? 'up' : 'down') : undefined,
      modalityData,
      timelineData,
      indicatorBarData,
      latestEvents,
      adverseEventsData,
      ouvidoriasData,
    };
  }, [patients, indicators, subindicators, events]);
}
