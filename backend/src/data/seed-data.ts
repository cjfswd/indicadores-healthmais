export const defaultOperators = [
  { name: "Unimed" },
  { name: "Camperj" }
];

export const defaultIndicators = [
  { name: "01- Indicador de Fluxo Assistencial", targetType: "PERCENTAGE", targetDirection: "HIGHER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "02- Nº de Intercorrências", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "03- Taxa de Internação Hospitalar", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "04- Nº de óbitos", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "05- Taxa de Alterações de PAD", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "06- Quantitativo de pacientes AD e ID", targetType: "NUMERIC", targetDirection: "HIGHER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "07- Nº de pacientes infectados", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE", observations: "INÍCIO DE USO DE ANTIBIÓTICO EM 48H, META 0%" },
  { name: "08- Nº de eventos adversos", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" },
  { name: "09- Nº de ouvidorias", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0, comparisonInterval: "ABSOLUTE" }
];

export const defaultSubindicatorsList = [
  { name: "1.1- Alta Domiciliar", parentPrefix: "01-", targetType: "PERCENTAGE", targetDirection: "HIGHER_BETTER", targetValue: 5 },
  { name: "1.2- Admissão", parentPrefix: "01-", targetType: "NUMERIC", targetDirection: "HIGHER_BETTER", targetValue: 0 },
  { name: "2.1- Resolvidas em domicílio", parentPrefix: "02-", targetType: "NUMERIC", targetDirection: "HIGHER_BETTER", targetValue: 0 },
  { name: "2.2- Necessidade de Remoção APH", parentPrefix: "02-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "3.1- Deterioração clínica", parentPrefix: "03-", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "3.2- Não aderência ao tratamento", parentPrefix: "03-", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "4.1- Menos de 48 horas após implantação", parentPrefix: "04-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "4.2- Mais de 48 horas de implantação", parentPrefix: "04-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "5.1- ↑ PAD", parentPrefix: "05-", targetType: "PERCENTAGE", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "5.2- ↓ PAD", parentPrefix: "05-", targetType: "PERCENTAGE", targetDirection: "HIGHER_BETTER", targetValue: 10 },
  { name: "8.1- Quedas", parentPrefix: "08-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "8.2 - Broncoaspiração", parentPrefix: "08-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "8.3 - Lesão por pressão", parentPrefix: "08-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "8.4 - Decanulação", parentPrefix: "08-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "8.5- Saida acidental da GTT", parentPrefix: "08-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "7.1- <48h Início de Antibiótico", parentPrefix: "07-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "7.2- >48h Pós-Antibiótico", parentPrefix: "07-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 },
  { name: "9.1- Elogios", parentPrefix: "09-", targetType: "NUMERIC", targetDirection: "HIGHER_BETTER", targetValue: 0 },
  { name: "9.2- Sugestões", parentPrefix: "09-", targetType: "NUMERIC", targetDirection: "HIGHER_BETTER", targetValue: 0 },
  { name: "9.3- Reclamações e Solicitações", parentPrefix: "09-", targetType: "NUMERIC", targetDirection: "LOWER_BETTER", targetValue: 0 }
];

export const camperjPatients = [
  "ALTIR DA ROCHA CUNHA", "ALVARO JOSE DA SILVA MELO", "ANA CAROLINA MENDES NOGUEIRA GOMES",
  "ANGELA MARIA MENEZES DE LIMA", "ANIBAL GONCALVES ALVES", "BENEDIR DE OLIVEIRA GASPAR",
  "DAISY AMOEDO BARREIRA", "DANILO DOMINGUES DE CARVALHO FILHO", "DEA ARAUJO DE AZEVEDO",
  "EDISON SANTOS CORREA", "EDUARDO CARLOS CARDOSO", "ELZA GUDULA MARIA DELBAERE",
  "EVANDRO DE OLIVEIRA SILVA", "FABIO CAVALCANTI DE ALBUQUERQUE MASSA", "FERNANDO CABRAL GOMES",
  "FERNANDO LÚCIO LAGOEIRO GUIMARÃES ABREU", "GENEIR HOLOSBACK ROSSES", "HUGO GOLDEMBERG",
  "IDE CORREA CARDOSO", "IZA MARIA BASTOS VIANNA", "JANAINA MARQUES CORREA MELO",
  "JOAO BOSCO FLEURY", "KATIA COSTA MARQUES DE FARIA", "LAIS FERNANDES GARCIA",
  "LEONEL DOS SANTOS", "LUCIA HELENA DOS SANTOS LUSQUINOS RODRIGUES", "LUCIA NEVES OLIVEIRA",
  "LUIZ FERNANDO DA COSTA GOMES", "LUIZ MARIO ROSSES FILHO", "MARCIA LEITE DE ABREU",
  "MARIA CRISTINA DA SILVA GAERTNER", "MARIA EDUARDA PACHECO NEVARES ALVES", "MARIA ELIANE GABRIEL ENNE",
  "MARIA GONCALVES SOARES", "MARILEA BARROSO MAGALHAES", "MARINA BRASIL FREITAS",
  "NEIDE RODRIGUES", "NILDA MARIA BENEVIDES DE MIRANDA", "NILZA COELHO BORDALLO",
  "ODAIA ALVES DOS REIS", "OZELINA DE SOUZA BARROS", "PAULO OSCAR DE FARIA",
  "RAMONA VIRGINIA ZACARIAS DE BECKERIG", "REGINA COELI TOSTES CALDAS", "RICARDO LUIZ DA SILVA REIS",
  "RUBINEIDE CAMPOS DOS REIS", "RUTE ELENA FERREIRA GOMES", "VERA LUCIA FERREIRA TAROUQUELA",
  "VERA MARIA FLORENCIO BERTO", "WANDA DE ALMEIDA VACITE", "ZENEIDE GAUDIE LEY LAGOEIRO DE MAGALHAES"
];

export const unimedPatients = [
  "BEATRIZ RIBEIRO ALVES", "CLARISSE JEANNE OLIVEIRA DOS SANTOS", "CLEUZA TEIXEIRA DE ARAUJO",
  "DENIZAR QUEIROZ", "DENIZE DE SOUZA BOM", "EMANUEL SOUZA MAIA", "GABRIELE CARDOSO MORAES",
  "GEANETTE DOROTHEIA PIMENTEL DA SILVA", "GILDA HELOISA DE SOUZA LIMA", "ISABELLE OLIVEIRA ROSA",
  "ITAMAR CHAVES DURAO", "JOAO LACERDA PEREIRA", "JOAQUIM PAULO MATOS", "JOE DAMIAO SESTELLO QUADROS",
  "JONAIR MACHADO DE ABREU", "JONAS MARIANO DE ALMEIDA", "JOSE ABELARDO SOUZA ANDRADE",
  "JOSE CARLOS DE LIMA", "LENICE SALLES PEREIRA", "LUCILIA DE CARVALHO GIMENEZ",
  "LUCIO DA SILVA RIBEIRO", "LUISA DO NASCIMENTO ELOI", "MARCIO LUIZ PISANI DE SOUZA",
  "MARIA ALICE SANTOS", "MARIA BATISTA DA SILVA LIRA", "MARIA DA GLÓRIA TOBIAS BARBOSA",
  "MARIA DA PENHA OLIVEIRA D ALMEIDA", "MARIA DAS GRACAS DOS SANTOS SILVA", "MARIA DE LOURDES DA SILVA SEMEDO",
  "MARIA DO CARMO LOURENCO DA SILVA", "MARIA LUIZA SOUZA NUNES", "MARIA ROSA DE JESUS",
  "MARINA FELIX DE SOUZA", "NELLY DE SOUZA BELEM RIBEIRO", "PEDRO PACHECO DE MATTOS",
  "REBECCA SIQUEIRA ROSA", "SIMONE DIAS LOPES", "WALDIR NUNES RIBEIRO"
];
