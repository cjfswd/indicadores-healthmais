/**
 * @file domain-schemas.ts
 *
 * Proposta de modelagem futura com dados aninhados (embedded documents).
 * Segue o padrão idiomático do MongoDB: documentos autossuficientes,
 * sem lookups cross-collection para exibição.
 *
 * Princípios:
 * 1. Cada documento deve conter tudo que precisa para ser exibido
 * 2. Referências são subdocumentos { _id, name } (EmbeddedRef)
 * 3. Relações 1:N onde N é limitado → array aninhada (events dentro de patient)
 * 4. Entidades raiz (Operator, Indicator) são standalone
 * 5. Subindicadores vivem dentro do indicador pai (array aninhada)
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                     MODELO DE DADOS                        │
 * │                                                            │
 * │  Operator ─────────────────────┐                           │
 * │  { _id, name }                 │ ref                       │
 * │                                ▼                           │
 * │  Patient ──────────────────────────────────────────────┐   │
 * │  { _id, name, operator, ...                             │   │
 * │    events: [                                           │   │
 * │      { _id, occurrenceDate, indicator, subindicator }  │   │
 * │    ]                                                   │   │
 * │  }                                                     │   │
 * │                                                        │   │
 * │  Indicator ────────────────────────────────────────┐   │   │
 * │  { _id, name, targetType, targetValue, ...         │   │   │
 * │    subindicators: [                                │   │   │
 * │      { _id, name, targetType, targetValue }  ◄─────┘   │   │
 * │    ]                                    ref to events  │   │
 * │  }                                                     │   │
 * └────────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────┘
 */
import { z } from 'zod';
// ─── Tipos Base MongoDB ──────────────────────────────────────
/** ObjectId do MongoDB: string hexadecimal de 24 caracteres. */
export const ObjectIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'ObjectId inválido (24 caracteres hex)');
// ─── Enums (valores em PT-BR) ──────────────────────────────────
export const TargetTypeEnum = z.enum(['NÚMERICO', 'PERCENTUAL']);
export const TargetDirectionEnum = z.enum(['MAIOR', 'MENOR']);
export const ComparisonIntervalEnum = z.enum(['ABSOLUTO', 'RELATIVO']);
// ─── Blocos Reutilizáveis ────────────────────────────────────
/** Referência aninhada a outra entidade. Snapshot do _id + name. */
export const EmbeddedRefSchema = z.object({
    _id: ObjectIdSchema,
    name: z.string().default(''),
});
/** Evento imutável do Event Store.
 *  Cada documento representa uma operação atômica sobre uma entidade.
 *  O estado atual é derivado (materializado) do replay de todos os eventos do stream.
 *  O event store é append-only — nunca atualiza ou deleta eventos.
 */
export const EventTypeEnum = z.enum(['CREATE', 'UPDATE', 'SOFT_DELETE']);
export const EventStoreSchema = z.object({
    _id: ObjectIdSchema.optional(),
    streamId: ObjectIdSchema,
    streamType: z.string().min(1, 'Stream type é obrigatório'),
    eventType: EventTypeEnum,
    version: z.number().int().positive(),
    data: z.any(),
    timestamp: z.union([z.date(), z.string()]).optional(),
    actor: z.email('Email inválido').optional().or(z.literal('')).default(''),
});
/** Campos comuns a toda entidade raiz. */
export const BaseEntitySchema = z.object({
    _id: ObjectIdSchema.optional(),
    observations: z.string().max(500).optional().default(''),
    createdAt: z.union([z.date(), z.string()]).optional(),
    updatedAt: z.union([z.date(), z.string()]).optional(),
    deletedAt: z.union([z.date(), z.string()]).nullable().optional()
});
// ─── Operator (entidade raiz standalone) ─────────────────────
export const OperatorSchema = BaseEntitySchema.extend({
    name: z.string().min(1, 'O nome da operadora é obrigatório').default(''),
});
// ─── Subindicator (embedded dentro de Indicator) ─────────────
export const SubindicatorSchema = z.object({
    _id: ObjectIdSchema.optional(),
    name: z.string().min(1, 'O nome do subindicador é obrigatório').default(''),
    targetType: TargetTypeEnum.default('NÚMERICO'),
    targetDirection: TargetDirectionEnum.default('MAIOR'),
    targetValue: z.coerce.number().min(0).default(0),
});
// ─── Indicator (entidade raiz, contém subindicators[]) ───────
// Vive no banco. Subindicadores são array aninhada, não coleção separada.
export const IndicatorSchema = BaseEntitySchema.extend({
    name: z.string().min(1, 'O nome do indicador é obrigatório').default(''),
    targetType: TargetTypeEnum.default('NÚMERICO'),
    targetDirection: TargetDirectionEnum.default('MAIOR'),
    targetValue: z.coerce.number().min(0).default(0),
    comparisonInterval: ComparisonIntervalEnum.default('ABSOLUTO'),
    subindicators: z.array(SubindicatorSchema).default([]),
});
// ─── File Attachment ───────────────────────────────────────────
// Frontend armazena apenas metadata. O conteúdo binário vive no MongoDB.
export const FileAttachmentSchema = z.object({
    name: z.string(),
    type: z.string(), // MIME type (ex: application/pdf)
    size: z.number(),
});
// ─── Event (embedded dentro de Patient) ──────────────────────
// Ao criar evento, salva o indicador e subindicador POR COMPLETO
// como snapshot. Sem referências, sem IDs externos, sem lookups.
// O custo de armazenamento é mínimo e a leitura é imediata.
export const EventSchema = z.object({
    _id: ObjectIdSchema.optional(),
    occurrenceDate: z.string().min(1, 'A data da ocorrência é obrigatória').default(''),
    indicator: IndicatorSchema.omit({ subindicators: true, _id: true }),
    subindicator: SubindicatorSchema,
    observations: z.string().max(500).optional().default(''),
    file: FileAttachmentSchema.nullable().optional().default(null),
    createdAt: z.union([z.date(), z.string()]).optional(),
    updatedBy: z.email('Email inválido').optional().or(z.literal('')).default(''),
});
// ─── Patient (entidade raiz, contém events[]) ────────────────
// Documento autossuficiente: operadora como ref, eventos como array.
export const PatientSchema = BaseEntitySchema.extend({
    name: z.string().min(1, 'O nome é obrigatório').default(''),
    operator: EmbeddedRefSchema,
    admissionDate: z.string().optional().default(''),
    birthDate: z.string().optional().default(''),
    events: z.array(EventSchema).default([]),
    file: FileAttachmentSchema.nullable().optional().default(null),
});
// ─── Notification (entidade raiz para alertas do sistema) ──────
export const NotificationSchema = BaseEntitySchema.extend({
    title: z.string().min(1, 'O título é obrigatório').default(''),
    message: z.string().min(1, 'A mensagem é obrigatória').default(''),
    type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
    isRead: z.boolean().default(false),
    link: z.string().optional(),
});
