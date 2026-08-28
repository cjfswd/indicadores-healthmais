"""Sugestao de destino para os eventos ambiguos, a partir das observacoes.

Nao decide nada: devolve (destino, confianca, motivo) para a interface exibir
com a opcao ja marcada. Quem confirma e o usuario.

Confianca:
  alta   -- o proprio texto rotula o teor ('Reclamacao:', 'Solicitacao:')
  media  -- palavra-chave forte, sem rotulo explicito
  baixa  -- so evidencia indireta (situacao do paciente, evento vizinho)
  nenhuma-- nada no dado sustenta um palpite
"""
import re
import unicodedata


def normaliza(s: str) -> str:
    """Minusculas sem acento, para casar 'Reclamacao' com 'Reclamação'."""
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


# Ordem de criticidade do card 09. O PDF: "Manifestacao com mais de um teor e
# classificada pelo de maior criticidade e os demais teores entram como motivo
# adicional."
CRITICIDADE_09 = ["9.1", "9.2", "9.5", "9.3", "9.4"]

# Rotulos que o proprio registro usa, no inicio de linha.
ROTULOS_09 = [
    (r"^\s*-?\s*reclamac(ao|oes)\s*:", "9.1"),
    (r"^\s*-?\s*solicitac(ao|oes)\s+de\s+informac", "9.5"),
    (r"^\s*-?\s*solicitac(ao|oes)\s*:", "9.2"),
    (r"^\s*-?\s*sugest(ao|oes)\s*:", "9.3"),
    (r"^\s*-?\s*elogios?\s*:", "9.4"),
    (r"^\s*-?\s*duvidas?\s*:", "9.5"),
]

# Sem rotulo: palavras que denunciam o teor.
CHAVES_09 = [
    ("9.5", ["informacao", "informacoes", "duvida", "esclarecimento"]),
    ("9.2", ["solicit", "pedido", "troca/reparo", "gostaria de"]),
    ("9.1", ["nao recebeu", "nao foi realizado", "falta de", "atraso",
             "inadequad", "sem fono", "sem fisio", "suspensao", "reducao",
             "queixa", "insatisfa", "nao quer", "nao deseja"]),
    ("9.4", ["parabens", "agradec", "elogi"]),
]

TOPOGRAFIA_08 = [
    ("8.1", ["cateter vesical", "sonda vesical", "svd"]),
    ("8.2", ["itu", "urinaria", "urinario"]),
    ("8.3", ["traqueo", "tqt", "ventilacao", "vm "]),
    ("8.4", ["aspirativa", "broncoaspira"]),
    ("8.5", ["gtt", "picc", "sitio de insercao"]),
    ("8.6", ["ferida infectada", "lesao por pressao infect", "lpp infect"]),
    ("8.7", ["pele", "partes moles", "celulite", "erisipela"]),
]

ESTAGIO_06 = [
    ("6.1", ["estagio 1", "estagio i", "grau 1", "hiperemia"]),
    ("6.2", ["estagio 2", "estagio ii", "grau 2", "flictena", "bolha"]),
    ("6.3", ["estagio 3", "estagio 4", "estagio iii", "estagio iv", "grau 3", "grau 4"]),
    ("6.4", ["nao classificav", "tissular profunda", "necrose"]),
]


def _por_chaves(texto: str, tabela: list, original: str = ""):
    """Casa contra o texto normalizado, mas devolve o trecho como foi escrito.

    As listas de chaves sao ASCII de proposito -- elas rodam sobre a saida de
    normaliza(). Ecoar a chave crua ao usuario mostrava 'nao recebeu' no lugar
    de 'Nao recebeu'/'não recebeu'. normaliza() nao muda o comprimento (cada
    caractere acentuado volta a um caractere), entao o indice serve nos dois.
    """
    for destino, chaves in tabela:
        for c in chaves:
            i = texto.find(c)
            if i >= 0:
                trecho = original[i:i + len(c)] if original else c
                return destino, (trecho or c)
    return None, None


def sugerir(pi: str, ps: str, observacoes: str, pista: str, opcoes: list):
    """Devolve (destino, confianca, motivo). destino None = sem palpite."""
    txt = normaliza(observacoes)

    # --- Card 09: o registro costuma rotular o proprio teor ---------------
    if pi == "09" and ps == "9.3":
        achados = []
        for linha in (observacoes or "").splitlines():
            n = normaliza(linha)
            for padrao, destino in ROTULOS_09:
                if re.search(padrao, n) and destino not in achados:
                    achados.append(destino)
        if achados:
            principal = min(achados, key=lambda d: CRITICIDADE_09.index(d))
            if len(achados) > 1:
                extras = [a for a in achados if a != principal]
                return (principal, "alta",
                        "o registro traz mais de um teor (%s); pelo PDF vale o de maior "
                        "criticidade, os demais viram motivo adicional"
                        % ", ".join(achados))
            return principal, "alta", "o próprio registro rotula o teor"

        destino, chave = _por_chaves(txt, CHAVES_09, observacoes)
        if destino:
            return destino, "media", "sem rótulo; texto contém '%s'" % chave
        return None, "nenhuma", "texto não indica o teor"

    # --- Card 01: alta domiciliar -----------------------------------------
    if pi == "01" and ps == "1.1":
        if "transic" in txt or "mudanca de nivel" in txt:
            return "1.3", "media", "texto menciona transição de nível"
        if "objetivo" in txt or "alta melhorad" in txt:
            return "1.2", "media", "texto menciona objetivo alcançado"
        if pista.startswith("paciente segue ativo"):
            return "1.3", "baixa", "paciente segue ativo após a alta"
        if pista.startswith("paciente inativado") or pista.startswith("paciente excluído"):
            return "1.2", "baixa", "alta encerrou o cuidado do paciente"
        return None, "nenhuma", ""

    # --- Card 02: remocao APH ---------------------------------------------
    if pi == "02" and ps == "2.2":
        if "interna" in txt:
            return "2.4", "media", "texto menciona internação"
        if "retorno" in txt or "24h" in txt:
            return "2.3", "media", "texto menciona retorno"
        if "sugere 2.4" in pista:
            return "2.4", "baixa", "internação registrada no card 03 em ±2 dias"
        if "sugere 2.3" in pista:
            return "2.3", "baixa", "nenhuma internação próxima registrada"
        return None, "nenhuma", ""

    # --- Card 02: resolucao em domicilio ----------------------------------
    if pi == "02" and ps == "2.1":
        if "medic" in txt or "plantonista" in txt or "teleconsulta" in txt:
            return "2.2", "media", "texto menciona suporte médico"
        if "equipe" in txt or "enfermagem" in txt or "tecnic" in txt:
            return "2.1", "media", "texto menciona resolução pela equipe"
        return None, "nenhuma", ""

    # --- Card 08 -> 06: lesao por pressao ---------------------------------
    if pi == "08" and ps == "8.3":
        destino, chave = _por_chaves(txt, ESTAGIO_06, observacoes)
        if destino:
            return destino, "media", "texto indica '%s'" % chave
        return None, "nenhuma", "estágio não registrado"

    # --- Card 07 -> 08: infeccao ------------------------------------------
    if pi == "07":
        destino, chave = _por_chaves(txt, TOPOGRAFIA_08, observacoes)
        if destino:
            return destino, "media", "texto indica '%s'" % chave
        if txt:
            return "8.8", "baixa", "há texto, mas sem topografia reconhecível"
        return None, "nenhuma", "topografia não registrada"

    # --- Card 04: obito ----------------------------------------------------
    if pi == "04":
        if "paliativ" in txt:
            dest = "3.1" if "formalizad" in txt else "3.2"
            return dest, "media", "texto menciona plano paliativo"
        if "inesperad" in txt or "subito" in txt or "nao esperad" in txt:
            return "3.3", "media", "texto indica óbito não esperado"
        return None, "nenhuma", "expectativa não registrada no dado antigo"

    return None, "nenhuma", ""
