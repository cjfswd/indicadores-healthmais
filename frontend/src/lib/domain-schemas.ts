import { z } from 'zod';

export const TargetTypeEnum = z.enum(['NUMERIC', 'PERCENTAGE']);
export const TargetDirectionEnum = z.enum(['HIGHER_BETTER', 'LOWER_BETTER']);
export const ComparisonIntervalEnum = z.enum(['ABSOLUTE', 'RELATIVE']);
export const ModalityEnum = z.enum(['ID', 'AD']);



export const BaseEntitySchema = z.object({
  _id: z.string().optional(),
  observations: z.string().max(500, "As observações devem ter no máximo 500 caracteres").optional().default(""),
  file: z.any().optional().refine((f) => !f || f.size <= 5 * 1024 * 1024, "O arquivo deve ter no máximo 5MB."),
  createdAt: z.union([z.date(), z.string()]).optional(),
  deletedAt: z.union([z.date(), z.string()]).nullable().optional(),
});

export const IndicatorSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "O nome do indicador é obrigatório").default(""),
  targetType: TargetTypeEnum.default("NUMERIC"),
  targetDirection: TargetDirectionEnum.default("HIGHER_BETTER"),
  targetValue: z.coerce.number().min(0, "O valor da meta é obrigatório").default(0),
  comparisonInterval: ComparisonIntervalEnum.default("ABSOLUTE"),
});

export const PatientSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "O nome é obrigatório").default(""),
  operatorId: z.string().min(1, "A operadora é obrigatória").default(""), 
  modality: ModalityEnum.or(z.literal("")).default(""),
  admissionDate: z.string().optional().default(""), 
  birthDate: z.string().optional().default(""),
});

export const EventSchema = BaseEntitySchema.extend({
  patientId: z.string().min(1, "O paciente do evento é obrigatório").default(""),
  indicatorId: z.string().min(1, "O indicador é obrigatório").default(""),
  subindicatorId: z.string().min(1, "O sub-indicador é obrigatório").default(""),
  occurrenceDate: z.string().min(1, "A data da ocorrência é obrigatória").default(""),
});

export const OperatorSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "O nome da operadora não pode estar em branco").default(""),
});

export const SubindicatorSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "O nome do subindicador é obrigatório").default(""),
  parentIndicatorId: z.string().min(1, "O indicador pai é obrigatório").default(""),
  targetType: TargetTypeEnum.default("NUMERIC"),
  targetDirection: TargetDirectionEnum.default("LOWER_BETTER"),
  targetValue: z.coerce.number().min(0, "O valor da meta é obrigatório").default(0),
});

// Zod types
export type Indicator = z.infer<typeof IndicatorSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Operator = z.infer<typeof OperatorSchema>;
export type Subindicator = z.infer<typeof SubindicatorSchema>;

// Dictionaries for Frontend UI
export const TargetTypeLabels: Record<z.infer<typeof TargetTypeEnum>, string> = {
  NUMERIC: 'Numérico',
  PERCENTAGE: 'Percentual (%)'
};

export const TargetDirectionLabels: Record<z.infer<typeof TargetDirectionEnum>, string> = {
  HIGHER_BETTER: 'Maior é Melhor',
  LOWER_BETTER: 'Menor é Melhor'
};

export const ComparisonIntervalLabels: Record<z.infer<typeof ComparisonIntervalEnum>, string> = {
  ABSOLUTE: 'Absoluto',
  RELATIVE: 'Relativo'
};

export const ModalityLabels: Record<z.infer<typeof ModalityEnum>, string> = {
  AD: 'AD',
  ID: 'ID'
};

/**
 * Subindicadores virtuais existentes apenas no frontend.
 * Não possuem meta e não aparecem na criação de eventos.
 * Usados para exibição visual nos dashboards e views de indicadores.
 */
export const VIRTUAL_SUBINDICATORS: Array<{
  _id: string;
  name: string;
  parentIndicatorPrefix: string;
  noTarget: true;
  nonSelectable: true;
}> = [
  { _id: 'virtual-06-AD', name: 'AD', parentIndicatorPrefix: '06-', noTarget: true, nonSelectable: true },
  { _id: 'virtual-06-ID', name: 'ID', parentIndicatorPrefix: '06-', noTarget: true, nonSelectable: true },
];
