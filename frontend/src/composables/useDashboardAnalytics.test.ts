import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useDashboardAnalytics } from './useDashboardAnalytics'

describe('useDashboardAnalytics', () => {
  it('computes basic analytics correctly', () => {
    const patients = ref([
      {
        _id: 'p1',
        name: 'Patient 1',
        events: [
          {
            _id: 'e1',
            occurrenceDate: new Date().toISOString(),
            indicator: { name: 'Ind A' },
            subindicator: { name: 'Sub A1' }
          }
        ]
      }
    ])
    
    const indicators = ref([
      {
        _id: 'i1',
        name: 'Ind A',
        subindicators: [{ name: 'Sub A1' }]
      }
    ])

    const analytics = useDashboardAnalytics(patients, indicators)

    // Acessar .value porque o composable retorna um ComputedRef
    expect(analytics.value.totalPatients).toBe(1)
    expect(analytics.value.totalEvents).toBe(1)
    expect(analytics.value.indicatorsCards).toHaveLength(1)
    expect(analytics.value.indicatorsCards[0].name).toBe('Ind A')
    expect(analytics.value.indicatorsCards[0].totalEvents).toBe(1)
  })

  it('computes report structures (tables and charts)', () => {
    const today = new Date()
    const monthKey = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][today.getMonth()]
    
    const patients = ref([
      {
        _id: 'p1',
        name: 'Patient 1',
        events: [
          {
            _id: 'e1',
            occurrenceDate: today.toISOString(),
            indicator: { name: 'Ind A' },
            subindicator: { name: 'Sub A1' }
          }
        ]
      }
    ])
    
    const indicators = ref([
      {
        _id: 'i1',
        name: 'Ind A',
        subindicators: [{ name: 'Sub A1' }]
      }
    ])

    const analytics = useDashboardAnalytics(patients, indicators)
    const result = analytics.value

    // reportHeaders deve conter "indicador", o mês atual e "total"
    expect(result.reportHeaders).toHaveProperty('indicador')
    expect(result.reportHeaders).toHaveProperty(monthKey)
    expect(result.reportHeaders).toHaveProperty('total')

    // reportTableData deve ter 2 linhas: o indicador pai e o subindicador
    expect(result.reportTableData).toHaveLength(2)
    expect(result.reportTableData[0].indicador).toBe('Ind A')
    expect(result.reportTableData[0].total).toBe(1)
    expect(result.reportTableData[0][monthKey]).toBe(1)

    expect(result.reportTableData[1].indicador).toBe(' > Sub A1')
    expect(result.reportTableData[1].total).toBe(1)
    expect(result.reportTableData[1][monthKey]).toBe(1)

    // chartBarData
    expect(result.chartBarData.labels).toContain('Ind A')
    expect(result.chartBarData.datasets[0].data).toEqual([1])

    // chartLineData
    expect(result.chartLineData.labels).toHaveLength(1) // Only one active month
    expect(result.chartLineData.datasets[0].label).toBe('Ind A')
    expect(result.chartLineData.datasets[0].data).toEqual([1])
  })
})
