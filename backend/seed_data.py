default_operators = [
    {"name": "Unimed"},
    {"name": "Camperj"}
]

default_indicators = [
  {
    "name": "01 - Indicador de Fluxo Assistencial",
    "targetType": "PERCENTUAL",
    "targetDirection": "MAIOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "1.1 - Alta Domiciliar", "targetType": "PERCENTUAL", "targetDirection": "MAIOR", "targetValue": 5 },
      { "name": "1.2 - Admissão", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 }
    ]
  },
  {
    "name": "02 - Nº de Intercorrências",
    "targetType": "NÚMERICO",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "2.1 - Resolvidas em domicílio", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 },
      { "name": "2.2 - Necessidade de Remoção APH", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  },
  {
    "name": "03 - Taxa de Internação Hospitalar",
    "targetType": "PERCENTUAL",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "3.1 - Deterioração clínica", "targetType": "PERCENTUAL", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "3.2 - Não aderência ao tratamento", "targetType": "PERCENTUAL", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  },
  {
    "name": "04 - Nº de óbitos",
    "targetType": "NÚMERICO",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "4.1 - Menos de 48 horas após implantação", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "4.2 - Mais de 48 horas de implantação", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  },
  {
    "name": "05 - Taxa de Alterações de PAD",
    "targetType": "PERCENTUAL",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "5.1 - ↑ PAD", "targetType": "PERCENTUAL", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "5.2 - ↓ PAD", "targetType": "PERCENTUAL", "targetDirection": "MAIOR", "targetValue": 10 }
    ]
  },
  {
    "name": "06 - Quantitativo de pacientes AD e ID",
    "targetType": "NÚMERICO",
    "targetDirection": "MAIOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "6.1 - AD (Atenção Domiciliar)", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 },
      { "name": "6.2 - ID (Internação Domiciliar)", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 }
    ]
  },
  {
    "name": "07 - Nº de pacientes infectados",
    "targetType": "PERCENTUAL",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "observations": "INÍCIO DE USO DE ANTIBIÓTICO EM 48H, META 0%",
    "subindicators": [
      { "name": "7.1 - <48h Início de Antibiótico", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "7.2 - >48h Pós-Antibiótico", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  },
  {
    "name": "08 - Nº de eventos adversos",
    "targetType": "NÚMERICO",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "8.1 - Quedas", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "8.2 - Broncoaspiração", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "8.3 - Lesão por pressão", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "8.4 - Decanulação", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 },
      { "name": "8.5 - Saída acidental da GTT", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  },
  {
    "name": "09 - Nº de ouvidorias",
    "targetType": "NÚMERICO",
    "targetDirection": "MENOR",
    "targetValue": 0,
    "comparisonInterval": "ABSOLUTO",
    "subindicators": [
      { "name": "9.1 - Elogios", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 },
      { "name": "9.2 - Sugestões", "targetType": "NÚMERICO", "targetDirection": "MAIOR", "targetValue": 0 },
      { "name": "9.3 - Reclamações e Solicitações", "targetType": "NÚMERICO", "targetDirection": "MENOR", "targetValue": 0 }
    ]
  }
]

camperj_patients = [
    "AGRIPINA CUNHA MONTEIRO", "ALBERTO JORGE DE OLIVEIRA PESTANA", "ALTAIR RAMOS DA SILVA CORREA", "ANGELICA DIAS NUNES", "ANTONIO DE PAIUA",
    "ANTONIO REIS", "ARCIDIO GONCALVES PEREIRA", "CEZAR CORREIA MACHADO", "DÉCIO SILVA ALVES DE OLIVEIRA", "DELZA GOMES DA SILVA ROCHA",
    "DEUSA CORTEZ PEREIRA", "DJALMA FIALHO DOS SANTOS", "ELISABETH MONTEIRO CARNEIRO", "ELZA GOMES RODRIGUES", "ETELVINA GONÇALVES MACHADO CORDEIRO",
    "EVANIR VIEIRA ROQUE", "FRANCISCO SANTIAGO BICHARA", "GENOVEVA LOUREIRO MARTINS", "IBAIR ALVES SILVA", "IRACI MONTEIRO DE ABREU",
    "IRAILDES BRAGA MAIA", "JANDIRA CINTRA ALMEIDA", "JAYME MOREIRA JUNIOR", "JAYR DE CASTRO NUNES", "JOSÉ AUGUSTO BASTOS MACEDO",
    "JOSE EDUARDO BROM", "JOSÉ ROBERTO DE MENDONÇA BARRETO", "JOSE ROBERTO FARIAS DA SILVA", "JUCELINA BARBOZA", "LAZARA PEREIRA FURLAN",
    "LINDOLFO JOSE DE ALMEIDA FILHO", "LUDMILLA COSTA DE ALMEIDA", "LUIZ ROBERTO BARROS OLYMPIO", "MARIA CANDIDA MENDES FERNANDES",
    "MARIA CILENE BARRETO DOS SANTOS", "MARIA DE LOURDES GUIMARAES FERREIRA", "MARIA DE LOURDES ROSA", "MARIA ISABEL MARINS BASTOS DIAS",
    "MARIA LUIZA TAVARES", "MARIA NIDIA CARVALHAES GUIMARÃES", "MARLENE TEIXEIRA DA SILVA", "MURILLO BAPTISTA JUNIOR", "NATHALIA TIBURCIO PINHEIRO",
    "NEIDA SANTOS ALMEIDA", "NELY MONTEIRO DE CARVALHO", "NEUSA ROCHA ALVES", "NIVAL DA SILVA NEVES", "NYCIA BRUNO DO CARMO", "RAPHAEL CORREA ROCHA",
    "SAHADE JORGE CHERFAN", "SEBASTIÃO CORDEIRO DE MORAES", "SOLANGE BUSTAMANTE BORGES", "UBIRATAN FERNANDES DE CARVALHO", "VANTUIR FERNANDES",
    "WALDIR NUNES RIBEIRO", "ZARIFE RANGEL DE CASTRO", "ZELIA DE SOUSA E SILVA COELHO"
]

unimed_patients = [
    "ADA JARDIM MACHADO", "ALBERTINA LOURENCO ALVES", "ALBINA DA SILVA PEREIRA TANNUS", "ALDA VIEIRA BRANDAO", "ANADIA MOREIRA AMARAL",
    "ANGELICA REIS RAMOS PEREIRA", "ANTONIO PEREZ PEREZ", "DANIEL VIEIRA BARBOSA", "DELAIR MACHADO", "EDELZUITE PEREIRA BARRETO",
    "ENY MARTINS VILLELA", "EULER TEIXEIRA VILLELA", "GLAUCE DE CASTRO PEIXOTO RODRIGUES", "HELIODORO NATIVIDAD CASTILLO CASTILLO",
    "ILCA COIMBRA MAZARINI", "ITALIA REGINA CARNEIRO PAIS", "LEILA BRAGA", "LEONILA GOMES BAPTISTA", "LIGIA RODRIGUES BAPTISTA",
    "MARIA BATISTA DE ARAÚJO", "MARIA DA PENHA BRAGA DA CUNHA", "MARIA DE LOURDES DE AZEVEDO CINTRA", "MARIA EDNEA CHAGAS DE SOUSA",
    "MARIA ENIL VIEIRA DE CASTRO MACHADO", "MARIA JOSE FERREIRA CAMPOS", "MARINA DA SILVA SOARES", "NILMA MARINS TAVARES",
    "RUTH REZENDE BICALHO", "SHIRLEY DUARTE GUIMARÃES", "SONIA DE SOUSA BARRETO CANGUSSU", "WALDINEA GOMES RANGEL NUNES", "ZILDA FERNANDES FREITAS"
]
