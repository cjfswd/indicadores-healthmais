import { computed, type Ref } from 'vue';

export function useDashboardAnalytics(
  patients: Ref<any[] | undefined>,
  indicators: Ref<any[] | undefined>,
  startDate?: Ref<string>,
  endDate?: Ref<string>
) {
  return computed(() => {
    const pList = patients.value || [];
    const iList = [...(indicators.value || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    
    const start = startDate?.value ? new Date(startDate.value + 'T00:00:00') : null;
    const end = endDate?.value ? new Date(endDate.value + 'T23:59:59') : null;

    // events array is already flattened in EventsView, but here we can just map all events from all patients
    let eList = pList.flatMap(p => 
      (p.events || []).map((e: any) => ({ ...e, patientId: p._id, patientName: p.name }))
    );

    if (start || end) {
      eList = eList.filter(e => {
        const d = new Date(e.occurrenceDate);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentEvents = eList.filter((e: any) => new Date(e.occurrenceDate) >= thirtyDaysAgo);
    const previousEvents = eList.filter((e: any) => {
      const d = new Date(e.occurrenceDate);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const eventTrend = previousEvents.length > 0
      ? ((recentEvents.length - previousEvents.length) / previousEvents.length * 100).toFixed(0)
      : null;

    // Build dynamic cards for each indicator
    const indicatorsCards = iList.map(ind => {
      const isAdId = ind.name.includes('06'); // Indicator 06: AD/ID
      
      const card = {
        id: ind._id,
        name: ind.name,
        totalEvents: 0,
        subindicators: [] as { name: string, eventos: number }[]
      };

      if (isAdId) {
        // Special logic for AD/ID: count the *current* state per patient
        const modalityCounts: Record<string, number> = { 'AD': 0, 'ID': 0 };
        pList.forEach(p => {
          const adIdEvents = (p.events || [])
            .filter((e: any) => e.indicator?.name === ind.name)
            .filter((e: any) => {
              const d = new Date(e.occurrenceDate);
              if (start && d < start) return false;
              if (end && d > end) return false;
              return true;
            })
            .sort((a: any, b: any) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime());
          
          if (adIdEvents.length > 0) {
            const subName = adIdEvents[0].subindicator?.name || '';
            if (subName.includes('AD')) modalityCounts['AD']++;
            else if (subName.includes('ID')) modalityCounts['ID']++;
          }
        });
        
        card.subindicators = (ind.subindicators || []).map((sub: any) => {
          const isAd = sub.name.includes('AD');
          const isId = sub.name.includes('ID');
          const count = isAd ? modalityCounts['AD'] : isId ? modalityCounts['ID'] : 0;
          return { name: sub.name, eventos: count };
        });
        card.totalEvents = card.subindicators.reduce((acc, curr) => acc + curr.eventos, 0);

      } else {
        // Normal logic: count total historical events
        const indEvents = eList.filter((e: any) => e.indicator?.name === ind.name);
        card.totalEvents = indEvents.length;

        const subCounts: Record<string, number> = {};
        indEvents.forEach((e: any) => {
          if (e.subindicator?.name) {
            subCounts[e.subindicator.name] = (subCounts[e.subindicator.name] || 0) + 1;
          }
        });

        card.subindicators = (ind.subindicators || []).map((sub: any) => ({
          name: sub.name,
          eventos: subCounts[sub.name] || 0
        }));
      }

      return card;
    });

    // Eventos Adversos Subindicators
    const adverseEvents = eList.filter((e: any) => e.indicator?.name.toLowerCase().includes('adverso') && e.subindicator);
    const subCountsAdv: Record<string, number> = {};
    adverseEvents.forEach((e: any) => {
      const label = e.subindicator.name;
      subCountsAdv[label] = (subCountsAdv[label] || 0) + 1;
    });
    const adverseEventsData = Object.entries(subCountsAdv)
      .map(([name, count]) => ({ name: name.length > 30 ? name.substring(0, 28) + '…' : name, eventos: count }))
      .sort((a, b) => b.eventos - a.eventos);

    // Ouvidorias Subindicators
    const ouvidoriasEvents = eList.filter((e: any) => e.indicator?.name.toLowerCase().includes('ouvidoria') && e.subindicator);
    const subCountsOuv: Record<string, number> = {};
    ouvidoriasEvents.forEach((e: any) => {
      const label = e.subindicator.name;
      subCountsOuv[label] = (subCountsOuv[label] || 0) + 1;
    });
    const ouvidoriasData = Object.entries(subCountsOuv)
      .map(([name, count]) => ({ name: name.length > 30 ? name.substring(0, 28) + '…' : name, eventos: count }))
      .sort((a, b) => b.eventos - a.eventos);

    return {
      totalPatients: pList.length,
      totalEvents: eList.length,
      recentEventCount: recentEvents.length,
      eventTrend,
      eventTrendDirection: eventTrend !== null ? (Number(eventTrend) >= 0 ? 'up' : 'down') : undefined,
      indicatorsCards,
      adverseEventsData,
      ouvidoriasData,
    };
  });
}
