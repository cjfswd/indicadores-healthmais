# -*- coding: utf-8 -*-
"""Catálogo da recategorização, transcrito de docs/novo-modelo/Recategorizacao-dos-indicadores.pdf.

O PDF é vetorizado (não tem texto extraível), então esta transcrição é a única
forma legível por máquina do documento. Se o PDF mudar, este arquivo muda junto.

Os rótulos são exibidos ao usuário — na interface de decisão, na planilha e nos
CSVs. Ficam aqui exatamente como o documento escreve, com acento. O console do
Windows é cp1252 e não dá conta; quem se adapta é o console (os scripts usam
errors="replace"), não o dado.

Fonte: branch claude/verificar-repositorio-novidades-98ce57.
"""

# code -> (nome do card, {subcódigo: nome}, nota)
CARDS = {
    "01": ("Movimentação da Carteira", {
        "1.1": "Admissão",
        "1.2": "Alta por objetivo terapêutico alcançado",
        "1.3": "Alta por transição de nível de cuidado",
        "1.4": "Saída por óbito",
        "1.5": "Saída por internação prolongada",
        "1.6": "Desligamento administrativo",
        "1.7": "Transferência para outra prestadora",
    }, "1.6 registra quem solicitou: operadora, família ou prestadora."),

    "02": ("Intercorrências e Resolutividade", {
        "2.1": "Resolvida pela equipe no domicílio",
        "2.2": "Resolvida com suporte médico",
        "2.3": "Remoção APH com retorno em até 24h",
        "2.4": "Remoção com internação hospitalar",
        "2.5": "Óbito durante a intercorrência",
    }, "2.3 e 2.4 são desfechos diferentes. O antigo card 03 deixa de existir: "
       "a taxa de internação passa a ser calculada a partir de 2.4."),

    "03": ("Óbitos", {
        "3.1": "Esperado, com plano paliativo formalizado",
        "3.2": "Esperado, sem plano formalizado",
        "3.3": "Não esperado",
    }, "ESPELHO DE 1.4 — NÃO SOMA AO PAINEL. Óbito em até 48h e óbito 3.3 "
       "disparam alerta de revisão para a diretoria médica."),

    "04": ("Adequação e Execução do PAD", {
        "4.1": "Ampliação do plano",
        "4.2": "Redução do plano",
        "4.3": "Mudança de modalidade AD ↔ ID",
        "4.4": "Suspensão ou encerramento do plano",
    }, "Tem bloco próprio de execução: previstos, realizados, aderência."),

    "05": ("Eventos Adversos", {
        "5.1": "Queda sem dano",
        "5.2": "Queda com dano",
        "5.3": "Broncoaspiração",
        "5.4": "Decanulação acidental",
        "5.5": "Saída acidental de GTT ou SNE",
        "5.6": "Saída acidental de SVD, cistostomia ou PICC",
        "5.7": "Erro ou omissão de medicação",
        "5.8": "Falha ou falta de equipamento",
        "5.9": "Near miss — não atingiu o paciente",
    }, "Lesão por pressão sai deste card e passa para o 06."),

    "06": ("Lesões de Pele", {
        "6.1": "LPP estágio 1",
        "6.2": "LPP estágio 2",
        "6.3": "LPP estágio 3 ou 4",
        "6.4": "LPP não classificável ou tissular profunda",
        "6.5": "Lesão por dispositivo médico",
        "6.6": "Dermatite associada à incontinência",
        "6.7": "Úlcera venosa, arterial ou pé diabético",
        "6.8": "Ferida operatória ou skin tear",
    }, "Sem avaliação de pele com foto em até 48h da implantação, o sistema "
       "grava a lesão como adquirida."),

    "07": ("Custo e Evitabilidade das Lesões", {
        "7.1": "Coberturas e insumos de curativo",
        "7.2": "Horas de enfermagem em curativo",
        "7.3": "Visitas extras de enfermeiro ou estomaterapeuta",
        "7.4": "Equipamentos de prevenção e terapia",
        "7.5": "Rateio de antimicrobianos e exames de ferida",
        "7.6": "Rateio de internação atribuída à lesão",
    }, "CAMPO DE VALOR, NÃO CONTADOR. Todo lançamento é vinculado ao episódio "
       "de lesão do card 06, não apenas ao paciente."),

    "08": ("Infecção e Antimicrobianos", {
        "8.1": "ITU associada a cateter vesical",
        "8.2": "ITU sem cateter",
        "8.3": "Respiratória com traqueostomia ou VM",
        "8.4": "Pneumonia aspirativa",
        "8.5": "Sítio de inserção de GTT, PICC ou TQT",
        "8.6": "Ferida ou lesão por pressão infectada",
        "8.7": "Pele e partes moles",
        "8.8": "Outras topografias",
    }, "O corte antigo por tempo de antibiótico deixa de existir. Alerta "
       "automático para uso igual ou superior a 10 dias sem reavaliação."),

    "09": ("Ouvidoria", {
        "9.1": "Reclamação",
        "9.2": "Solicitação",
        "9.3": "Sugestão",
        "9.4": "Elogio",
        "9.5": "Dúvida ou pedido de informação",
    }, "A categoria 'Reclamações e Solicitações' é extinta. Manifestação com "
       "mais de um teor é classificada pelo de maior criticidade."),

    "10": ("Vulnerabilidade e Proteção Social", {
        "10.1": "Negligência ou abandono do cuidado",
        "10.2": "Violência física",
        "10.3": "Violência psicológica",
        "10.4": "Violência sexual",
        "10.5": "Violência financeira ou patrimonial",
        "10.6": "Ausência ou insuficiência de cuidador",
        "10.7": "Moradia inadequada ou ambiente inseguro",
        "10.8": "Conflito familiar que interfere no plano",
        "10.9": "Recusa ou sabotagem do cuidado",
    }, "'Em triagem' substitui a antiga 'não categorizada' e é um status "
       "temporário com prazo de 7 dias."),
}


# De-para: (prefixo do indicador antigo, prefixo do subindicador antigo)
#   -> (tipo, destino, opções, nota)
#
# tipo:
#   direto    -- equivalência 1:1, o loader resolve sozinho
#   derivacao -- não vira fato no modelo novo; alimenta outra estrutura
#   ambiguo   -- o modelo novo pede uma distinção que o dado velho não tem;
#                precisa de decisão humana (planilha da Fase 2)
DE_PARA = {
    ("01", "1.1"): ("ambiguo", None, ["1.2", "1.3"],
                    "'Alta Domiciliar' não diz se foi por objetivo alcançado (1.2) "
                    "ou por transição de nível de cuidado (1.3)."),
    ("01", "1.2"): ("direto", "1.1", [], "Admissão → Admissão."),

    ("02", "2.1"): ("ambiguo", None, ["2.1", "2.2"],
                    "O modelo novo separa resolução pela equipe (2.1) de resolução "
                    "com suporte médico (2.2). O registro antigo não distingue."),
    ("02", "2.2"): ("ambiguo", None, ["2.3", "2.4"],
                    "'Necessidade de Remoção APH' não diz o desfecho. O PDF é "
                    "explícito: 2.3 (retorno em 24h) e 2.4 (internação) são "
                    "desfechos diferentes."),

    ("03", "3.1"): ("derivacao", "2.4", [],
                    "Card 03 extinto. Vira intercorrência com desfecho 2.4 e "
                    "causa 'descompensação da doença de base'."),
    ("03", "3.2"): ("derivacao", "2.4", [],
                    "Card 03 extinto. Vira intercorrência com desfecho 2.4 e "
                    "causa 'falha de adesão ou de suporte familiar'."),

    ("04", "4.1"): ("ambiguo", "1.4", ["3.1", "3.2", "3.3"],
                    "A saída por óbito (1.4) é direta, mas a classificação do card "
                    "03 é por expectativa, não por tempo. '<48h' vira o campo "
                    "'tempo desde a admissão', não a categoria."),
    ("04", "4.2"): ("ambiguo", "1.4", ["3.1", "3.2", "3.3"],
                    "Mesmo caso de 4.1: o tempo vira campo, a expectativa é "
                    "desconhecida no dado antigo."),

    ("05", "5.1"): ("direto", "4.1", [], "Aumento de PAD → Ampliação do plano."),
    ("05", "5.2"): ("direto", "4.2", [], "Redução de PAD → Redução do plano."),

    ("06", None): ("derivacao", None, [],
                   "Não é fato no modelo novo. Vira episodio_cuidado.modalidade: "
                   "o último evento por paciente é o estado atual, os anteriores "
                   "viram alteração de plano (4.3)."),

    ("07", "7.1"): ("ambiguo", None, ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"],
                    "O card novo classifica por topografia; o antigo só registrava "
                    "tempo de antibiótico. O PDF diz que esse corte deixa de existir."),
    ("07", "7.2"): ("ambiguo", None, ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"],
                    "Mesmo caso de 7.1."),

    ("08", "8.1"): ("ambiguo", None, ["5.1", "5.2"],
                    "'Quedas' não diz se houve dano. O modelo novo separa."),
    ("08", "8.2"): ("direto", "5.3", [], "Broncoaspiração → Broncoaspiração."),
    ("08", "8.3"): ("ambiguo", None, ["6.1", "6.2", "6.3", "6.4"],
                    "Lesão por pressão muda de card (05 → 06) e passa a exigir "
                    "estágio, que o registro antigo não tem."),
    ("08", "8.4"): ("direto", "5.4", [], "Decanulação → Decanulação acidental."),
    ("08", "8.5"): ("direto", "5.5", [], "Saída acidental da GTT → GTT ou SNE."),

    ("09", "9.1"): ("direto", "9.4", [], "Elogios → Elogio."),
    ("09", "9.2"): ("direto", "9.3", [], "Sugestões → Sugestão."),
    ("09", "9.3"): ("ambiguo", None, ["9.1", "9.2"],
                    "'Reclamações e Solicitações' é extinta pelo PDF: cada "
                    "registro tem que virar reclamação (9.1) ou solicitação (9.2)."),
    ("09", "9.4"): ("direto", "9.1", [], "Reclamações → Reclamação."),
    ("09", "9.5"): ("direto", "9.2", [], "Solicitações → Solicitação."),

    ("10", "10.1"): ("direto", "10.4", [], "Abuso sexual → Violência sexual."),
    ("10", "10.2"): ("ambiguo", None, ["10.2", "10.3", "10.5"],
                     "'Violência doméstica' não diz a natureza: física, "
                     "psicológica ou financeira."),
    ("10", "10.3"): ("ambiguo", None, ["10.2", "10.3"],
                     "'Agressão suspeita' não diz a natureza nem confirma."),
    ("10", "10.4"): ("direto", "10.1", [], "Abandono/negligência → Negligência ou abandono."),
    ("10", "10.5"): ("ambiguo", None, ["10.6", "10.8"],
                     "'Afastamento familiar' pode ser ausência de cuidador (10.6) "
                     "ou conflito familiar (10.8)."),
    ("10", "10.6"): ("ambiguo", None, [],
                     "'Intervenção com familiares' é conduta, não categoria de "
                     "caso. Não tem destino no modelo novo."),
    ("10", "10.7"): ("direto", "EM_TRIAGEM", [],
                     "'Denúncias não categorizadas' → status 'em triagem', que o "
                     "PDF define como substituto, com prazo de 7 dias."),
}
