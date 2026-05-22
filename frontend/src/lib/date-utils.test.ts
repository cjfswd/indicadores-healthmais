import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate } from './date-utils'

describe('formatDate', () => {
  // Guardamos o fuso original caso seja necessário,
  // mas o teste principal lida com o formato retornado local.
  const originalTimezone = process.env.TZ

  beforeEach(() => {
    // Definimos o timezone para algo bem problemático, que faria o shift para trás.
    // UTC-3 para simular o Brasil
    process.env.TZ = 'America/Sao_Paulo'
  })

  afterEach(() => {
    process.env.TZ = originalTimezone
  })

  it('deve retornar string vazia se a data for null ou undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('deve formatar data no formato YYYY-MM-DD mantendo o dia exato', () => {
    // "2026-05-22" sem o fix viraria "21/05/2026" no fuso America/Sao_Paulo
    // Com o fix, garante que continue sendo o dia 22.
    const result = formatDate('2026-05-22')
    expect(result).toBe('22/05/2026')
  })

  it('deve processar normalmente datas que já vem com T e formato ISO completo', () => {
    // "2026-05-22T15:30:00Z" será formatada respeitando as horas relativas (timezone conversion expected here, 
    // mas depende do Date local; o que testamos é que ele não injeta T12 se já tem T).
    // Num fuso UTC-3, 15:30 UTC seria 12:30, então a data no Brasil é 22.
    const result = formatDate('2026-05-22T15:30:00Z')
    expect(result).toBe('22/05/2026')
  })
  
  it('deve formatar datas de início do mês sem voltar para o mês anterior', () => {
    const result = formatDate('2026-06-01')
    expect(result).toBe('01/06/2026')
  })
})
