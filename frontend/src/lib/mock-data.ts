// Mock data for development mode — mirrors backend/seed_data.py exactly.
// Never bundled in production builds (only imported when import.meta.env.DEV).

// ── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 1
const id = () => String(_idCounter++).padStart(24, '0')

function date(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).toISOString()
}

// ── Indicators — mirrors backend/seed_data.py ─────────────────────────────────

export const INDICATORS = [
  {
    _id: id(),
    name: '01 - Indicador de Fluxo Assistencial',
    targetType: 'PERCENTUAL', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '1.1 - Alta Domiciliar' },
      { name: '1.2 - Admissão' },
    ],
  },
  {
    _id: id(),
    name: '02 - Nº de Intercorrências',
    targetType: 'NÚMERICO', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '2.1 - Resolvidas em domicílio' },
      { name: '2.2 - Necessidade de Remoção APH' },
    ],
  },
  {
    _id: id(),
    name: '03 - Taxa de Internação Hospitalar',
    targetType: 'PERCENTUAL', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '3.1 - Deterioração clínica' },
      { name: '3.2 - Não aderência ao tratamento' },
    ],
  },
  {
    _id: id(),
    name: '04 - Nº de óbitos',
    targetType: 'NÚMERICO', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '4.1 - Menos de 48 horas após implantação' },
      { name: '4.2 - Mais de 48 horas de implantação' },
    ],
  },
  {
    _id: id(),
    name: '05 - Taxa de Alterações de PAD',
    targetType: 'PERCENTUAL', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '5.1 - ↑ PAD' },
      { name: '5.2 - ↓ PAD' },
    ],
  },
  {
    _id: id(),
    name: '06 - Quantitativo de pacientes AD e ID',
    targetType: 'NÚMERICO', targetDirection: 'MAIOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '6.1 - AD (Assistência Domiciliar)' },
      { name: '6.2 - ID (Internação Domiciliar)' },
    ],
  },
  {
    _id: id(),
    name: '07 - Nº de pacientes infectados',
    targetType: 'PERCENTUAL', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '7.1 - <48h Início de Antibiótico' },
      { name: '7.2 - >48h Pós-Antibiótico' },
    ],
  },
  {
    _id: id(),
    name: '08 - Nº de eventos adversos',
    targetType: 'NÚMERICO', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '8.1 - Quedas' },
      { name: '8.2 - Broncoaspiração' },
      { name: '8.3 - Lesão por pressão' },
      { name: '8.4 - Decanulação' },
      { name: '8.5 - Saída acidental da GTT' },
    ],
  },
  {
    _id: id(),
    name: '09 - Nº de ouvidorias',
    targetType: 'NÚMERICO', targetDirection: 'MENOR', targetValue: 0, comparisonInterval: 'ABSOLUTO',
    subindicators: [
      { name: '9.1 - Elogios' },
      { name: '9.2 - Sugestões' },
      { name: '9.3 - Reclamações e Solicitações' },
    ],
  },
]

// Lookup by indicator name
const IND = INDICATORS.reduce<Record<string, typeof INDICATORS[0]>>((acc, i) => {
  acc[i.name] = i
  return acc
}, {})

function event(indicatorName: string, subName: string, year: number, month: number, day: number) {
  const ind = IND[indicatorName]
  return {
    _id: id(),
    indicator: { name: ind.name },
    subindicator: { name: subName },
    occurrenceDate: date(year, month, day),
    description: `Registro de ${subName}.`,
    createdAt: date(year, month, day),
  }
}

// ── Operators — mirrors backend/seed_data.py ──────────────────────────────────

export const OPERATORS = [
  { _id: id(), name: 'Unimed' },
  { _id: id(), name: 'Camperj' },
  { _id: id(), name: 'Particular' },
]

// ── Patients — real names from backend/seed_data.py, with mock events ─────────

export const PATIENTS: any[] = [
  {
    _id: id(), name: 'ALVARO JOSE DA SILVA MELO', birthDate: '1940-03-12', cpf: '111.111.111-11',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('08 - Nº de eventos adversos', '8.1 - Quedas', 2026, 2, 10),
      event('09 - Nº de ouvidorias', '9.1 - Elogios', 2026, 4, 15),
    ],
  },
  {
    _id: id(), name: 'ANA CAROLINA MENDES NOGUEIRA GOMES', birthDate: '1955-07-22', cpf: '222.222.222-22',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('02 - Nº de Intercorrências', '2.1 - Resolvidas em domicílio', 2026, 1, 18),
      event('07 - Nº de pacientes infectados', '7.2 - >48h Pós-Antibiótico', 2026, 3, 5),
    ],
  },
  {
    _id: id(), name: 'ANGELA MARIA MENEZES DE LIMA', birthDate: '1948-11-30', cpf: '333.333.333-33',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('05 - Taxa de Alterações de PAD', '5.1 - ↑ PAD', 2026, 2, 14),
      event('08 - Nº de eventos adversos', '8.3 - Lesão por pressão', 2026, 5, 20),
    ],
  },
  {
    _id: id(), name: 'ANIBAL GONCALVES ALVES', birthDate: '1935-05-08', cpf: '444.444.444-44',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('03 - Taxa de Internação Hospitalar', '3.1 - Deterioração clínica', 2026, 3, 22),
      event('04 - Nº de óbitos', '4.2 - Mais de 48 horas de implantação', 2026, 4, 1),
    ],
  },
  {
    _id: id(), name: 'DAISY AMOEDO BARREIRA', birthDate: '1962-09-14', cpf: '555.555.555-55',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('01 - Indicador de Fluxo Assistencial', '1.1 - Alta Domiciliar', 2026, 5, 7),
      event('09 - Nº de ouvidorias', '9.3 - Reclamações e Solicitações', 2026, 5, 28),
    ],
  },
  {
    _id: id(), name: 'DANILO DOMINGUES DE CARVALHO FILHO', birthDate: '1945-12-01', cpf: '666.666.666-66',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('07 - Nº de pacientes infectados', '7.1 - <48h Início de Antibiótico', 2026, 2, 3),
      event('08 - Nº de eventos adversos', '8.2 - Broncoaspiração', 2026, 4, 19),
    ],
  },
  {
    _id: id(), name: 'EDISON SANTOS CORREA', birthDate: '1950-04-19', cpf: '777.777.777-77',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('02 - Nº de Intercorrências', '2.2 - Necessidade de Remoção APH', 2026, 2, 25),
      event('09 - Nº de ouvidorias', '9.2 - Sugestões', 2026, 6, 3),
    ],
  },
  {
    _id: id(), name: 'EDUARDO CARLOS CARDOSO', birthDate: '1938-08-27', cpf: '888.888.888-88',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('03 - Taxa de Internação Hospitalar', '3.2 - Não aderência ao tratamento', 2026, 1, 16),
      event('05 - Taxa de Alterações de PAD', '5.2 - ↓ PAD', 2026, 3, 8),
    ],
  },
  {
    _id: id(), name: 'ELZA GUDULA MARIA DELBAERE', birthDate: '1943-02-03', cpf: '121.212.121-21',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('08 - Nº de eventos adversos', '8.4 - Decanulação', 2026, 3, 12),
      event('09 - Nº de ouvidorias', '9.1 - Elogios', 2026, 5, 22),
    ],
  },
  {
    _id: id(), name: 'FABIO CAVALCANTI DE ALBUQUERQUE MASSA', birthDate: '1960-10-25', cpf: '232.323.232-32',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('01 - Indicador de Fluxo Assistencial', '1.2 - Admissão', 2026, 1, 8),
      event('08 - Nº de eventos adversos', '8.5 - Saída acidental da GTT', 2026, 4, 30),
    ],
  },
  {
    _id: id(), name: 'FERNANDO CABRAL GOMES', birthDate: '1957-06-11', cpf: '343.434.343-43',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('07 - Nº de pacientes infectados', '7.2 - >48h Pós-Antibiótico', 2026, 2, 20),
      event('05 - Taxa de Alterações de PAD', '5.1 - ↑ PAD', 2026, 6, 1),
    ],
  },
  {
    _id: id(), name: 'HUGO GOLDEMBERG', birthDate: '1932-03-30', cpf: '454.545.454-54',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('02 - Nº de Intercorrências', '2.1 - Resolvidas em domicílio', 2026, 3, 14),
      event('09 - Nº de ouvidorias', '9.3 - Reclamações e Solicitações', 2026, 5, 9),
    ],
  },
  {
    _id: id(), name: 'JANAINA MARQUES CORREA MELO', birthDate: '1968-07-04', cpf: '565.656.565-65',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('08 - Nº de eventos adversos', '8.1 - Quedas', 2026, 4, 6),
      event('09 - Nº de ouvidorias', '9.2 - Sugestões', 2026, 6, 8),
    ],
  },
  {
    _id: id(), name: 'JOAO BOSCO FLEURY', birthDate: '1944-01-17', cpf: '676.767.676-76',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('03 - Taxa de Internação Hospitalar', '3.1 - Deterioração clínica', 2026, 2, 28),
      event('08 - Nº de eventos adversos', '8.3 - Lesão por pressão', 2026, 6, 4),
    ],
  },
  {
    _id: id(), name: 'LUCIA HELENA DOS SANTOS LUSQUINOS RODRIGUES', birthDate: '1952-09-21', cpf: '787.878.787-87',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('07 - Nº de pacientes infectados', '7.1 - <48h Início de Antibiótico', 2026, 1, 27),
      event('05 - Taxa de Alterações de PAD', '5.2 - ↓ PAD', 2026, 4, 11),
    ],
  },
  {
    _id: id(), name: 'LUIZ FERNANDO DA COSTA GOMES', birthDate: '1939-12-08', cpf: '898.989.898-98',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('01 - Indicador de Fluxo Assistencial', '1.1 - Alta Domiciliar', 2026, 3, 31),
      event('02 - Nº de Intercorrências', '2.2 - Necessidade de Remoção APH', 2026, 5, 17),
    ],
  },
  {
    _id: id(), name: 'MARIA CRISTINA DA SILVA GAERTNER', birthDate: '1961-05-15', cpf: '909.090.909-09',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('04 - Nº de óbitos', '4.1 - Menos de 48 horas após implantação', 2026, 2, 7),
    ],
  },
  {
    _id: id(), name: 'NILDA MARIA BENEVIDES DE MIRANDA', birthDate: '1946-08-02', cpf: '101.010.101-01',
    operator: OPERATORS[0]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('09 - Nº de ouvidorias', '9.1 - Elogios', 2026, 3, 19),
      event('08 - Nº de eventos adversos', '8.2 - Broncoaspiração', 2026, 5, 30),
    ],
  },
  {
    _id: id(), name: 'PAULO OSCAR DE FARIAS', birthDate: '1953-11-09', cpf: '112.211.112-21',
    operator: OPERATORS[1]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.2 - ID (Internação Domiciliar)', 2026, 1, 1),
      event('03 - Taxa de Internação Hospitalar', '3.2 - Não aderência ao tratamento', 2026, 4, 23),
      event('07 - Nº de pacientes infectados', '7.2 - >48h Pós-Antibiótico', 2026, 6, 9),
    ],
  },
  {
    _id: id(), name: 'VERA MARIA FLORENCIO BERTO', birthDate: '1936-04-13', cpf: '223.322.223-32',
    operator: OPERATORS[2]._id, status: 'ativo',
    events: [
      event('06 - Quantitativo de pacientes AD e ID', '6.1 - AD (Assistência Domiciliar)', 2026, 1, 1),
      event('08 - Nº de eventos adversos', '8.1 - Quedas', 2026, 1, 31),
      event('05 - Taxa de Alterações de PAD', '5.1 - ↑ PAD', 2026, 3, 25),
      event('09 - Nº de ouvidorias', '9.3 - Reclamações e Solicitações', 2026, 6, 6),
    ],
  },
]

// ── Users ─────────────────────────────────────────────────────────────────────

export const USERS = [
  { _id: id(), name: 'Desenvolvedor', email: 'dev@localhost', avatar: '', createdAt: date(2026, 1, 1) },
]

// ── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS: any[] = []

// ── In-memory store (mutable for CRUD in dev session) ─────────────────────────

const store: Record<string, any[]> = {
  patients: PATIENTS.map(p => ({ ...p })),
  indicators: INDICATORS.map(i => ({ ...i })),
  operators: OPERATORS.map(o => ({ ...o })),
  users: USERS.map(u => ({ ...u })),
  notifications: [...NOTIFICATIONS],
}

// ── Mock dbExecute handler ────────────────────────────────────────────────────

export async function mockDbExecute<T = any>(
  payload: any,
): Promise<{ result: T; total?: number; success: boolean; message?: string }> {
  await new Promise(r => setTimeout(r, 60)) // simulate minimal latency

  const { action, collection, query = {}, skip = 0, limit = 1000, sort, id: docId, data } = payload
  const col: any[] = store[collection] ?? []

  if (action === 'find' || action === 'aggregate') {
    const filtered = col.filter(doc => {
      if (doc.deletedAt) return false
      return Object.entries(query).every(([k, v]) => {
        if (v && typeof v === 'object' && '$exists' in v) return (v as any).$exists ? k in doc : !(k in doc)
        return doc[k] === v
      })
    })
    const sorted = sort ? [...filtered].sort((a, b) => {
      for (const [field, dir] of sort) {
        if (a[field] < b[field]) return -dir
        if (a[field] > b[field]) return dir
      }
      return 0
    }) : filtered
    const page = sorted.slice(skip, skip + limit)
    return { result: page as unknown as T, total: filtered.length, success: true }
  }

  if (action === 'insert') {
    const newDoc = { _id: id(), ...data, createdAt: new Date().toISOString() }
    store[collection] = [...col, newDoc]
    return { result: newDoc as unknown as T, success: true }
  }

  if (action === 'update') {
    store[collection] = col.map(doc =>
      doc._id === docId ? { ...doc, ...data, updatedAt: new Date().toISOString() } : doc,
    )
    return { result: store[collection].find(d => d._id === docId) as unknown as T, success: true }
  }

  if (action === 'delete') {
    store[collection] = col.map(doc =>
      doc._id === docId ? { ...doc, deletedAt: new Date().toISOString() } : doc,
    )
    return { result: { _id: docId } as unknown as T, success: true }
  }

  return { result: null as unknown as T, success: false, message: `Ação não suportada no mock: ${action}` }
}
