/**
 * @file domain-schemas.test.ts
 *
 * Testa validação Zod de todas as entidades do domínio.
 * Garante que dados válidos passam e dados inválidos são rejeitados.
 */
import { describe, it, expect } from 'vitest'
import {
  ObjectIdSchema,
  OperatorSchema,
  IndicatorSchema,
  SubindicatorSchema,
  PatientSchema,
  EventSchema,
  NotificationSchema,
  EventStoreSchema,
  EmbeddedRefSchema,
  FileAttachmentSchema,
} from '@/lib/domain-schemas'


describe('ObjectIdSchema', () => {
  it('aceita ObjectId válido de 24 caracteres hex', () => {
    const result = ObjectIdSchema.safeParse('507f1f77bcf86cd799439011')
    expect(result.success).toBe(true)
  })

  it('rejeita string muito curta', () => {
    const result = ObjectIdSchema.safeParse('abc123')
    expect(result.success).toBe(false)
  })

  it('rejeita string com caracteres não-hex', () => {
    const result = ObjectIdSchema.safeParse('507f1f77bcf86cd79943901z')
    expect(result.success).toBe(false)
  })

  it('rejeita string vazia', () => {
    const result = ObjectIdSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})


describe('EmbeddedRefSchema', () => {
  it('aceita referência com _id e name', () => {
    const result = EmbeddedRefSchema.safeParse({
      _id: '507f1f77bcf86cd799439011',
      name: 'Unimed',
    })
    expect(result.success).toBe(true)
  })

  it('aplica default vazio para name', () => {
    const result = EmbeddedRefSchema.safeParse({
      _id: '507f1f77bcf86cd799439011',
    })
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('')
  })

  it('rejeita _id inválido', () => {
    const result = EmbeddedRefSchema.safeParse({
      _id: 'invalid',
      name: 'Test',
    })
    expect(result.success).toBe(false)
  })
})


describe('OperatorSchema', () => {
  it('aceita operadora válida', () => {
    const result = OperatorSchema.safeParse({ name: 'Camperj' })
    expect(result.success).toBe(true)
    expect(result.data!.name).toBe('Camperj')
  })

  it('rejeita nome vazio', () => {
    const result = OperatorSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('aplica defaults para campos opcionais', () => {
    const result = OperatorSchema.safeParse({ name: 'Test' })
    expect(result.data!.observations).toBe('')
    expect(result.data!.deletedAt).toBeUndefined()
  })
})


describe('SubindicatorSchema', () => {
  it('aceita subindicador válido', () => {
    const result = SubindicatorSchema.safeParse({
      name: '1.1 - Alta Domiciliar',
      targetType: 'PERCENTUAL',
      targetDirection: 'MAIOR',
      targetValue: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = SubindicatorSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('aplica defaults', () => {
    const result = SubindicatorSchema.safeParse({ name: 'Test' })
    expect(result.data!.targetType).toBe('NÚMERICO')
    expect(result.data!.targetDirection).toBe('MAIOR')
    expect(result.data!.targetValue).toBe(0)
  })

  it('rejeita targetType inválido', () => {
    const result = SubindicatorSchema.safeParse({
      name: 'Test',
      targetType: 'INVALID',
    })
    expect(result.success).toBe(false)
  })
})


describe('IndicatorSchema', () => {
  it('aceita indicador completo com subindicadores', () => {
    const result = IndicatorSchema.safeParse({
      name: '01 - Indicador de Fluxo Assistencial',
      targetType: 'PERCENTUAL',
      targetDirection: 'MAIOR',
      targetValue: 0,
      comparisonInterval: 'ABSOLUTO',
      subindicators: [
        { name: '1.1 - Alta Domiciliar', targetType: 'PERCENTUAL', targetDirection: 'MAIOR', targetValue: 5 },
        { name: '1.2 - Admissão', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0 },
      ],
    })
    expect(result.success).toBe(true)
    expect(result.data!.subindicators).toHaveLength(2)
  })

  it('aplica array vazio para subindicators por default', () => {
    const result = IndicatorSchema.safeParse({ name: 'Indicador Simples' })
    expect(result.data!.subindicators).toEqual([])
  })

  it('rejeita nome vazio', () => {
    const result = IndicatorSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita comparisonInterval inválido', () => {
    const result = IndicatorSchema.safeParse({
      name: 'Test',
      comparisonInterval: 'MENSAL',
    })
    expect(result.success).toBe(false)
  })

  it('converte targetValue string para number', () => {
    const result = IndicatorSchema.safeParse({
      name: 'Test',
      targetValue: '42',
    })
    expect(result.success).toBe(true)
    expect(result.data!.targetValue).toBe(42)
  })
})


describe('FileAttachmentSchema', () => {
  it('aceita arquivo válido', () => {
    const result = FileAttachmentSchema.safeParse({
      name: 'doc.pdf',
      type: 'application/pdf',
      size: 1024,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita sem nome', () => {
    const result = FileAttachmentSchema.safeParse({
      type: 'application/pdf',
      size: 1024,
    })
    expect(result.success).toBe(false)
  })
})


describe('EventSchema', () => {
  it('aceita evento válido', () => {
    const result = EventSchema.safeParse({
      occurrenceDate: '2026-05-15',
      indicator: {
        name: '06 - Quantitativo de pacientes AD e ID',
        targetType: 'NÚMERICO',
        targetDirection: 'MAIOR',
        targetValue: 0,
        comparisonInterval: 'ABSOLUTO',
      },
      subindicator: {
        name: '6.1 - AD (Atenção Domiciliar)',
        targetType: 'NÚMERICO',
        targetDirection: 'MAIOR',
        targetValue: 0,
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita sem data de ocorrência', () => {
    const result = EventSchema.safeParse({
      occurrenceDate: '',
      indicator: { name: 'Test', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO' },
      subindicator: { name: 'Sub', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('aplica file null por default', () => {
    const result = EventSchema.safeParse({
      occurrenceDate: '2026-05-15',
      indicator: { name: 'Test', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO' },
      subindicator: { name: 'Sub', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0 },
    })
    expect(result.data!.file).toBeNull()
  })

  it('limita observations a 500 caracteres', () => {
    const result = EventSchema.safeParse({
      occurrenceDate: '2026-05-15',
      indicator: { name: 'Test', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO' },
      subindicator: { name: 'Sub', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0 },
      observations: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})


describe('PatientSchema', () => {
  const validOperator = { _id: '507f1f77bcf86cd799439011', name: 'Unimed' }

  it('aceita paciente válido', () => {
    const result = PatientSchema.safeParse({
      name: 'João Silva',
      operator: validOperator,
    })
    expect(result.success).toBe(true)
    expect(result.data!.events).toEqual([])
  })

  it('rejeita nome vazio', () => {
    const result = PatientSchema.safeParse({
      name: '',
      operator: validOperator,
    })
    expect(result.success).toBe(false)
  })

  it('aplica defaults para campos opcionais', () => {
    const result = PatientSchema.safeParse({
      name: 'Test',
      operator: validOperator,
    })
    expect(result.data!.admissionDate).toBe('')
    expect(result.data!.birthDate).toBe('')
    expect(result.data!.events).toEqual([])
    expect(result.data!.file).toBeNull()
  })

  it('aceita paciente com eventos aninhados', () => {
    const result = PatientSchema.safeParse({
      name: 'Com Eventos',
      operator: validOperator,
      events: [{
        occurrenceDate: '2026-05-15',
        indicator: { name: 'Ind', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO' },
        subindicator: { name: 'Sub', targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0 },
      }],
    })
    expect(result.success).toBe(true)
    expect(result.data!.events).toHaveLength(1)
  })
})


describe('NotificationSchema', () => {
  it('aceita notificação válida', () => {
    const result = NotificationSchema.safeParse({
      title: 'Novo Evento',
      message: 'Evento registrado com sucesso',
    })
    expect(result.success).toBe(true)
    expect(result.data!.type).toBe('info')
    expect(result.data!.isRead).toBe(false)
  })

  it('rejeita título vazio', () => {
    const result = NotificationSchema.safeParse({
      title: '',
      message: 'Msg',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita mensagem vazia', () => {
    const result = NotificationSchema.safeParse({
      title: 'Title',
      message: '',
    })
    expect(result.success).toBe(false)
  })

  it('aceita todos os tipos válidos', () => {
    for (const type of ['info', 'success', 'warning', 'error'] as const) {
      const result = NotificationSchema.safeParse({
        title: 'Test',
        message: 'Msg',
        type,
      })
      expect(result.success).toBe(true)
    }
  })
})


describe('EventStoreSchema', () => {
  it('aceita evento do store válido', () => {
    const result = EventStoreSchema.safeParse({
      streamId: '507f1f77bcf86cd799439011',
      streamType: 'patients',
      eventType: 'CREATE',
      version: 1,
      data: { name: 'Test' },
    })
    expect(result.success).toBe(true)
  })

  it('rejeita streamType vazio', () => {
    const result = EventStoreSchema.safeParse({
      streamId: '507f1f77bcf86cd799439011',
      streamType: '',
      eventType: 'CREATE',
      version: 1,
      data: {},
    })
    expect(result.success).toBe(false)
  })

  it('rejeita eventType inválido', () => {
    const result = EventStoreSchema.safeParse({
      streamId: '507f1f77bcf86cd799439011',
      streamType: 'patients',
      eventType: 'HARD_DELETE',
      version: 1,
      data: {},
    })
    expect(result.success).toBe(false)
  })

  it('rejeita version negativa', () => {
    const result = EventStoreSchema.safeParse({
      streamId: '507f1f77bcf86cd799439011',
      streamType: 'patients',
      eventType: 'CREATE',
      version: -1,
      data: {},
    })
    expect(result.success).toBe(false)
  })

  it('aceita todos os eventTypes válidos', () => {
    for (const eventType of ['CREATE', 'UPDATE', 'SOFT_DELETE'] as const) {
      const result = EventStoreSchema.safeParse({
        streamId: '507f1f77bcf86cd799439011',
        streamType: 'patients',
        eventType,
        version: 1,
        data: {},
      })
      expect(result.success).toBe(true)
    }
  })
})
