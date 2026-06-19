import type { IDb } from "./db.interface.ts";
import { DevObjectId } from "./db.dev.ts";

function id(s?: string) {
  return new DevObjectId(s);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function isoAgo(n: number): string {
  return daysAgo(n).toISOString();
}

// ─── Operators — iguais ao backend Python ────────────────────────────────────

const operators = [
  { _id: id("op1"), name: "Unimed",     createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null },
  { _id: id("op2"), name: "Camperj",    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null },
  { _id: id("op3"), name: "Particular", createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null },
];

// ─── Indicators — 9 indicadores do backend Python ────────────────────────────

const indicators = [
  {
    _id: id("ind1"),
    name: "01 - Indicador de Fluxo Assistencial",
    targetType: "PERCENTUAL", targetDirection: "MAIOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub1a"), name: "1.1 - Alta Domiciliar" },
      { _id: id("sub1b"), name: "1.2 - Admissão" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind2"),
    name: "02 - Nº de Intercorrências",
    targetType: "NÚMERICO", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub2a"), name: "2.1 - Resolvidas em domicílio" },
      { _id: id("sub2b"), name: "2.2 - Necessidade de Remoção APH" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind3"),
    name: "03 - Taxa de Internação Hospitalar",
    targetType: "PERCENTUAL", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub3a"), name: "3.1 - Deterioração clínica" },
      { _id: id("sub3b"), name: "3.2 - Não aderência ao tratamento" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind4"),
    name: "04 - Nº de óbitos",
    targetType: "NÚMERICO", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub4a"), name: "4.1 - Menos de 48 horas após implantação" },
      { _id: id("sub4b"), name: "4.2 - Mais de 48 horas de implantação" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind5"),
    name: "05 - Taxa de Alterações de PAD",
    targetType: "PERCENTUAL", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub5a"), name: "5.1 - ↑ PAD" },
      { _id: id("sub5b"), name: "5.2 - ↓ PAD" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind6"),
    name: "06 - Quantitativo de pacientes AD e ID",
    targetType: "NÚMERICO", targetDirection: "MAIOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub6a"), name: "6.1 - AD (Assistência Domiciliar)" },
      { _id: id("sub6b"), name: "6.2 - ID (Internação Domiciliar)" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind7"),
    name: "07 - Nº de pacientes infectados",
    targetType: "PERCENTUAL", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    observations: "INÍCIO DE USO DE ANTIBIÓTICO EM 48H, META 0%",
    subindicators: [
      { _id: id("sub7a"), name: "7.1 - <48h Início de Antibiótico" },
      { _id: id("sub7b"), name: "7.2 - >48h Pós-Antibiótico" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind8"),
    name: "08 - Nº de eventos adversos",
    targetType: "NÚMERICO", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub8a"), name: "8.1 - Quedas" },
      { _id: id("sub8b"), name: "8.2 - Broncoaspiração" },
      { _id: id("sub8c"), name: "8.3 - Lesão por pressão" },
      { _id: id("sub8d"), name: "8.4 - Decanulação" },
      { _id: id("sub8e"), name: "8.5 - Saída acidental da GTT" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
  {
    _id: id("ind9"),
    name: "09 - Nº de ouvidorias",
    targetType: "NÚMERICO", targetDirection: "MENOR", targetValue: 0, comparisonInterval: "ABSOLUTO",
    subindicators: [
      { _id: id("sub9a"), name: "9.1 - Elogios" },
      { _id: id("sub9b"), name: "9.2 - Sugestões" },
      { _id: id("sub9c"), name: "9.3 - Reclamações e Solicitações" },
    ],
    createdAt: daysAgo(365), updatedAt: daysAgo(365), deletedAt: null,
  },
];

// ─── Helpers para referências inline ─────────────────────────────────────────

const ind = (n: number) => indicators[n - 1];
const sub = (indN: number, subN: number) => indicators[indN - 1].subindicators[subN - 1];
const op = (n: number) => operators[n - 1];

// ─── Patients com nomes reais do sistema ─────────────────────────────────────

const patients = [
  {
    _id: id("pat01"),
    name: "ALVARO JOSE DA SILVA MELO",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(180),
    birthDate: "1945-03-12T00:00:00.000Z",
    observations: "Paciente com sequelas de AVC. Reabilitação motora.",
    createdAt: daysAgo(180), updatedAt: daysAgo(10), deletedAt: null,
    events: [
      { _id: id("ev01a"), occurrenceDate: isoAgo(150), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "fisioterapia", observations: "AD iniciada." },
      { _id: id("ev01b"), occurrenceDate: isoAgo(90),  indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,1)._id, name: sub(8,1).name }, assistanceType: "fisioterapia", observations: "Queda ao tentar deambular sem apoio." },
      { _id: id("ev01c"), occurrenceDate: isoAgo(30),  indicator: { _id: ind(2)._id, name: ind(2).name }, subindicator: { _id: sub(2,1)._id, name: sub(2,1).name }, assistanceType: "medicina", observations: "Intercorrência resolvida em domicílio." },
    ],
  },
  {
    _id: id("pat02"),
    name: "ANA CAROLINA MENDES NOGUEIRA GOMES",
    operator: { _id: op(2)._id, name: op(2).name },
    admissionDate: isoAgo(120),
    birthDate: "1952-07-22T00:00:00.000Z",
    observations: "ICC descompensada, DPOC.",
    createdAt: daysAgo(120), updatedAt: daysAgo(5), deletedAt: null,
    events: [
      { _id: id("ev02a"), occurrenceDate: isoAgo(110), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID após piora respiratória." },
      { _id: id("ev02b"), occurrenceDate: isoAgo(80),  indicator: { _id: ind(7)._id, name: ind(7).name }, subindicator: { _id: sub(7,1)._id, name: sub(7,1).name }, assistanceType: "medicina", observations: "Pneumonia, antibiótico iniciado < 48h." },
      { _id: id("ev02c"), occurrenceDate: isoAgo(20),  indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,1)._id, name: sub(9,1).name }, assistanceType: "medicina", observations: "Família elogiou cuidado da equipe." },
    ],
  },
  {
    _id: id("pat03"),
    name: "ANGELA MARIA MENEZES DE LIMA",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(90),
    birthDate: "1938-11-08T00:00:00.000Z",
    observations: "Neoplasia de mama, cuidados paliativos.",
    createdAt: daysAgo(90), updatedAt: daysAgo(3), deletedAt: null,
    events: [
      { _id: id("ev03a"), occurrenceDate: isoAgo(85), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID paliativa." },
      { _id: id("ev03b"), occurrenceDate: isoAgo(60), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,3)._id, name: sub(8,3).name }, assistanceType: "enfermagem", observations: "Lesão por pressão em região sacral estágio II." },
      { _id: id("ev03c"), occurrenceDate: isoAgo(15), indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,3)._id, name: sub(9,3).name }, assistanceType: "medicina", observations: "Familiar reclamou do tempo de espera da visita médica." },
    ],
  },
  {
    _id: id("pat04"),
    name: "ANIBAL GONCALVES ALVES",
    operator: { _id: op(3)._id, name: op(3).name },
    admissionDate: isoAgo(75),
    birthDate: "1947-02-14T00:00:00.000Z",
    observations: "Parkinson avançado, disfagia.",
    createdAt: daysAgo(75), updatedAt: daysAgo(7), deletedAt: null,
    events: [
      { _id: id("ev04a"), occurrenceDate: isoAgo(70), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "medicina", observations: "AD com acompanhamento neurológico." },
      { _id: id("ev04b"), occurrenceDate: isoAgo(50), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,2)._id, name: sub(8,2).name }, assistanceType: "fonoaudiologia", observations: "Episódio de broncoaspiração durante refeição." },
      { _id: id("ev04c"), occurrenceDate: isoAgo(10), indicator: { _id: ind(2)._id, name: ind(2).name }, subindicator: { _id: sub(2,2)._id, name: sub(2,2).name }, assistanceType: "medicina", observations: "Crise aguda, necessitou remoção para UPA." },
    ],
  },
  {
    _id: id("pat05"),
    name: "BENEDIR DE OLIVEIRA GASPAR",
    operator: { _id: op(2)._id, name: op(2).name },
    admissionDate: isoAgo(60),
    birthDate: "1955-09-30T00:00:00.000Z",
    observations: "Fratura de fêmur pós-cirúrgica, reabilitação.",
    createdAt: daysAgo(60), updatedAt: daysAgo(2), deletedAt: null,
    events: [
      { _id: id("ev05a"), occurrenceDate: isoAgo(55), indicator: { _id: ind(1)._id, name: ind(1).name }, subindicator: { _id: sub(1,2)._id, name: sub(1,2).name }, assistanceType: "medicina", observations: "Admissão no programa." },
      { _id: id("ev05b"), occurrenceDate: isoAgo(40), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "fisioterapia", observations: "AD reabilitação motora pós-cirúrgica." },
      { _id: id("ev05c"), occurrenceDate: isoAgo(12), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,1)._id, name: sub(8,1).name }, assistanceType: "fisioterapia", observations: "Queda sem lesão durante exercício físico." },
    ],
  },
  {
    _id: id("pat06"),
    name: "DAISY AMOEDO BARREIRA",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(50),
    birthDate: "1961-04-18T00:00:00.000Z",
    observations: "Diabetes tipo 2, neuropatia periférica.",
    createdAt: daysAgo(50), updatedAt: daysAgo(4), deletedAt: null,
    events: [
      { _id: id("ev06a"), occurrenceDate: isoAgo(45), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "enfermagem", observations: "AD, curativos em pé diabético." },
      { _id: id("ev06b"), occurrenceDate: isoAgo(25), indicator: { _id: ind(7)._id, name: ind(7).name }, subindicator: { _id: sub(7,2)._id, name: sub(7,2).name }, assistanceType: "medicina", observations: "Infecção de pé diabético, antibiótico > 48h." },
    ],
  },
  {
    _id: id("pat07"),
    name: "DANILO DOMINGUES DE CARVALHO FILHO",
    operator: { _id: op(2)._id, name: op(2).name },
    admissionDate: isoAgo(45),
    birthDate: "1942-06-05T00:00:00.000Z",
    observations: "Insuficiência renal crônica em diálise.",
    createdAt: daysAgo(45), updatedAt: daysAgo(6), deletedAt: null,
    events: [
      { _id: id("ev07a"), occurrenceDate: isoAgo(40), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID para diálise domiciliar." },
      { _id: id("ev07b"), occurrenceDate: isoAgo(20), indicator: { _id: ind(5)._id, name: ind(5).name }, subindicator: { _id: sub(5,1)._id, name: sub(5,1).name }, assistanceType: "medicina", observations: "Aumento de PAD, ajuste medicamentoso." },
      { _id: id("ev07c"), occurrenceDate: isoAgo(5),  indicator: { _id: ind(3)._id, name: ind(3).name }, subindicator: { _id: sub(3,1)._id, name: sub(3,1).name }, assistanceType: "medicina", observations: "Internação por deterioração clínica." },
    ],
  },
  {
    _id: id("pat08"),
    name: "DEA ARAUJO DE AZEVEDO",
    operator: { _id: op(3)._id, name: op(3).name },
    admissionDate: isoAgo(40),
    birthDate: "1948-12-20T00:00:00.000Z",
    observations: "Alzheimer moderado, dependente para AVDs.",
    createdAt: daysAgo(40), updatedAt: daysAgo(8), deletedAt: null,
    events: [
      { _id: id("ev08a"), occurrenceDate: isoAgo(38), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "medicina", observations: "AD com suporte cognitivo." },
      { _id: id("ev08b"), occurrenceDate: isoAgo(18), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,4)._id, name: sub(8,4).name }, assistanceType: "enfermagem", observations: "Decanulação acidental durante higiene." },
    ],
  },
  {
    _id: id("pat09"),
    name: "EDISON SANTOS CORREA",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(35),
    birthDate: "1950-08-10T00:00:00.000Z",
    observations: "DPOC grave, oxigenoterapia domiciliar.",
    createdAt: daysAgo(35), updatedAt: daysAgo(2), deletedAt: null,
    events: [
      { _id: id("ev09a"), occurrenceDate: isoAgo(32), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID com ventilação não-invasiva." },
      { _id: id("ev09b"), occurrenceDate: isoAgo(15), indicator: { _id: ind(2)._id, name: ind(2).name }, subindicator: { _id: sub(2,1)._id, name: sub(2,1).name }, assistanceType: "medicina", observations: "Crise de broncoespasmo resolvida em domicílio." },
      { _id: id("ev09c"), occurrenceDate: isoAgo(7),  indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,2)._id, name: sub(9,2).name }, assistanceType: "medicina", observations: "Família sugeriu aumento da frequência de visitas." },
    ],
  },
  {
    _id: id("pat10"),
    name: "EDUARDO CARLOS CARDOSO",
    operator: { _id: op(2)._id, name: op(2).name },
    admissionDate: isoAgo(28),
    birthDate: "1963-05-25T00:00:00.000Z",
    observations: "Esclerose lateral amiotrófica, ventilação invasiva.",
    createdAt: daysAgo(28), updatedAt: daysAgo(1), deletedAt: null,
    events: [
      { _id: id("ev10a"), occurrenceDate: isoAgo(25), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID com ventilação mecânica domiciliar." },
      { _id: id("ev10b"), occurrenceDate: isoAgo(10), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,5)._id, name: sub(8,5).name }, assistanceType: "enfermagem", observations: "Saída acidental da GTT durante troca de curativo." },
    ],
  },
  {
    _id: id("pat11"),
    name: "ELZA GUDULA MARIA DELBAERE",
    operator: { _id: op(3)._id, name: op(3).name },
    admissionDate: isoAgo(110),
    birthDate: "1936-01-15T00:00:00.000Z",
    observations: "Osteoporose grave, múltiplas fraturas.",
    createdAt: daysAgo(110), updatedAt: daysAgo(15), deletedAt: null,
    events: [
      { _id: id("ev11a"), occurrenceDate: isoAgo(105), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "fisioterapia", observations: "AD reabilitação pós-fratura vertebral." },
      { _id: id("ev11b"), occurrenceDate: isoAgo(70),  indicator: { _id: ind(4)._id, name: ind(4).name }, subindicator: { _id: sub(4,2)._id, name: sub(4,2).name }, assistanceType: "medicina", observations: "Óbito mais de 48h após implantação." },
    ],
  },
  {
    _id: id("pat12"),
    name: "HUGO GOLDEMBERG",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(95),
    birthDate: "1941-09-03T00:00:00.000Z",
    observations: "Cardiopatia isquêmica, marca-passo.",
    createdAt: daysAgo(95), updatedAt: daysAgo(12), deletedAt: null,
    events: [
      { _id: id("ev12a"), occurrenceDate: isoAgo(90), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "medicina", observations: "AD monitoramento cardíaco." },
      { _id: id("ev12b"), occurrenceDate: isoAgo(65), indicator: { _id: ind(5)._id, name: ind(5).name }, subindicator: { _id: sub(5,2)._id, name: sub(5,2).name }, assistanceType: "medicina", observations: "Redução de PAD após ajuste de antihipertensivo." },
      { _id: id("ev12c"), occurrenceDate: isoAgo(40), indicator: { _id: ind(2)._id, name: ind(2).name }, subindicator: { _id: sub(2,1)._id, name: sub(2,1).name }, assistanceType: "medicina", observations: "Palpitação, revertida em domicílio sem remoção." },
      { _id: id("ev12d"), occurrenceDate: isoAgo(10), indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,1)._id, name: sub(9,1).name }, assistanceType: "medicina", observations: "Paciente e família elogiaram toda a equipe." },
    ],
  },
  {
    _id: id("pat13"),
    name: "JOAO BOSCO FLEURY",
    operator: { _id: op(2)._id, name: op(2).name },
    admissionDate: isoAgo(55),
    birthDate: "1958-11-22T00:00:00.000Z",
    observations: "Lesão medular, tetraplegia C5.",
    createdAt: daysAgo(55), updatedAt: daysAgo(9), deletedAt: null,
    events: [
      { _id: id("ev13a"), occurrenceDate: isoAgo(50), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID multidisciplinar." },
      { _id: id("ev13b"), occurrenceDate: isoAgo(35), indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,3)._id, name: sub(8,3).name }, assistanceType: "enfermagem", observations: "Lesão por pressão grau III região isquiática." },
      { _id: id("ev13c"), occurrenceDate: isoAgo(20), indicator: { _id: ind(7)._id, name: ind(7).name }, subindicator: { _id: sub(7,1)._id, name: sub(7,1).name }, assistanceType: "medicina", observations: "ITU, antibiótico iniciado em < 48h." },
    ],
  },
  {
    _id: id("pat14"),
    name: "LUCIA HELENA DOS SANTOS LUSQUINOS RODRIGUES",
    operator: { _id: op(3)._id, name: op(3).name },
    admissionDate: isoAgo(130),
    birthDate: "1944-03-07T00:00:00.000Z",
    observations: "Demência vascular, disfagia grave.",
    createdAt: daysAgo(130), updatedAt: daysAgo(20), deletedAt: null,
    events: [
      { _id: id("ev14a"), occurrenceDate: isoAgo(125), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,2)._id, name: sub(6,2).name }, assistanceType: "medicina", observations: "ID com suporte nutricional por SNE." },
      { _id: id("ev14b"), occurrenceDate: isoAgo(100), indicator: { _id: ind(1)._id, name: ind(1).name }, subindicator: { _id: sub(1,1)._id, name: sub(1,1).name }, assistanceType: "medicina", observations: "Alta domiciliar do programa ID, continuidade em AD." },
      { _id: id("ev14c"), occurrenceDate: isoAgo(80),  indicator: { _id: ind(8)._id, name: ind(8).name }, subindicator: { _id: sub(8,2)._id, name: sub(8,2).name }, assistanceType: "fonoaudiologia", observations: "Broncoaspiração grave, engasgamento com líquidos." },
      { _id: id("ev14d"), occurrenceDate: isoAgo(30),  indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,3)._id, name: sub(9,3).name }, assistanceType: "medicina", observations: "Reclamação sobre demora no agendamento de exames." },
    ],
  },
  {
    _id: id("pat15"),
    name: "MARIA EDUARDA PACHECO NEVARES ALVES",
    operator: { _id: op(1)._id, name: op(1).name },
    admissionDate: isoAgo(70),
    birthDate: "1967-07-14T00:00:00.000Z",
    observations: "Esclerose múltipla, surto-remissão.",
    createdAt: daysAgo(70), updatedAt: daysAgo(11), deletedAt: null,
    events: [
      { _id: id("ev15a"), occurrenceDate: isoAgo(65), indicator: { _id: ind(6)._id, name: ind(6).name }, subindicator: { _id: sub(6,1)._id, name: sub(6,1).name }, assistanceType: "medicina", observations: "AD em fase de remissão." },
      { _id: id("ev15b"), occurrenceDate: isoAgo(45), indicator: { _id: ind(3)._id, name: ind(3).name }, subindicator: { _id: sub(3,2)._id, name: sub(3,2).name }, assistanceType: "medicina", observations: "Internação por não aderência ao tratamento imunomodulador." },
      { _id: id("ev15c"), occurrenceDate: isoAgo(20), indicator: { _id: ind(9)._id, name: ind(9).name }, subindicator: { _id: sub(9,2)._id, name: sub(9,2).name }, assistanceType: "medicina", observations: "Sugestão de teleconsulta quinzenal." },
    ],
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedDevDb(db: IDb): Promise<void> {
  const alreadySeeded = await db.collection("operators").findOne({ deletedAt: null });
  if (alreadySeeded) return;

  console.log("[db] seeding in-memory database with dev fixtures…");

  for (const op of operators) {
    await db.collection("operators").insertOne(op as unknown as Record<string, unknown>);
  }
  for (const ind of indicators) {
    await db.collection("indicators").insertOne(ind as unknown as Record<string, unknown>);
  }
  for (const pat of patients) {
    await db.collection("patients").insertOne(pat as unknown as Record<string, unknown>);
  }

  console.log(
    `[db] seeded ${operators.length} operators, ${indicators.length} indicators, ${patients.length} patients.`,
  );
}
