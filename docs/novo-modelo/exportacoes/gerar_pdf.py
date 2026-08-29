# -*- coding: utf-8 -*-
from exp_common import *
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, KeepTogether, PageBreak, NextPageTemplate)

PG = A4
LARG, ALT = PG
MARG = 18 * mm

c_pine = colors.HexColor("#" + PINE)
c_pine_l = colors.HexColor("#" + PINE_L)
c_brick = colors.HexColor("#" + BRICK)
c_brick_l = colors.HexColor("#" + BRICK_L)
c_ink = colors.HexColor("#" + INK)
c_ink2 = colors.HexColor("#" + INK2)
c_ink3 = colors.HexColor("#" + INK3)
c_line = colors.HexColor("#" + LINE)
c_surf2 = colors.HexColor("#" + SURF2)

st_h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=c_ink, spaceAfter=2)
st_eyebrow = ParagraphStyle("eb", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=c_ink3)
st_nota = ParagraphStyle("nota", fontName="Helvetica", fontSize=8.6, leading=12.4, textColor=c_ink2)
st_sec = ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=7.5, leading=10, textColor=c_ink3, spaceAfter=3)
st_td = ParagraphStyle("td", fontName="Helvetica", fontSize=8, leading=10.5, textColor=c_ink2)
st_td_b = ParagraphStyle("tdb", fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=c_ink)
st_th = ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=7.2, leading=9.5, textColor=colors.white)
st_kpi_k = ParagraphStyle("kk", fontName="Helvetica-Bold", fontSize=6.4, leading=8.4, textColor=c_ink3)
st_kpi_d = ParagraphStyle("kd", fontName="Helvetica", fontSize=6.6, leading=8.4, textColor=c_ink3)


def kpi_v(cor):
    return ParagraphStyle("kv" + str(cor), fontName="Helvetica-Bold", fontSize=15, leading=17, textColor=cor)


def P(txt, s=st_td):
    return Paragraph(limpa(txt).replace("&", "&amp;").replace("<", "&lt;"), s)


class Doc(BaseDocTemplate):
    def __init__(self, arq):
        BaseDocTemplate.__init__(self, arq, pagesize=PG,
                                 leftMargin=MARG, rightMargin=MARG,
                                 topMargin=MARG + 6 * mm, bottomMargin=MARG,
                                 title="Painel de Indicadores " + COMP,
                                 author="HealthMais Atendimento Domiciliar")
        frame = Frame(MARG, MARG, LARG - 2 * MARG, ALT - 2 * MARG - 6 * mm, id="f")
        self.addPageTemplates([PageTemplate(id="capa", frames=[frame], onPage=self.capa),
                               PageTemplate(id="corpo", frames=[frame], onPage=self.corpo)])

    def capa(self, cv, doc):
        cv.setFillColor(c_pine)
        cv.rect(0, 0, LARG, ALT, stroke=0, fill=1)

    def corpo(self, cv, doc):
        cv.setFillColor(c_pine)
        cv.rect(0, ALT - 3.2 * mm, LARG, 3.2 * mm, stroke=0, fill=1)
        cv.setFont("Helvetica", 7.2)
        cv.setFillColor(c_ink3)
        cv.drawString(MARG, ALT - MARG - 1 * mm, "Painel de Indicadores  ·  competência " + COMP)
        cv.drawRightString(LARG - MARG, ALT - MARG - 1 * mm, "HealthMais · Atendimento Domiciliar")
        cv.setStrokeColor(c_line)
        cv.setLineWidth(0.4)
        cv.line(MARG, ALT - MARG - 3.4 * mm, LARG - MARG, ALT - MARG - 3.4 * mm)
        cv.drawCentredString(LARG / 2, MARG - 5 * mm, str(doc.page))


fl = []

# ── Capa ──────────────────────────────────────────────────
br = lambda h: Spacer(1, h * mm)
fl.append(br(58))
fl.append(Paragraph("HEALTHMAIS &nbsp;·&nbsp; ATENDIMENTO DOMICILIAR",
                    ParagraphStyle("c0", fontName="Helvetica-Bold", fontSize=9, leading=12,
                                   textColor=colors.HexColor("#BFD8CF"))))
fl.append(br(6))
fl.append(Paragraph("Painel de Indicadores",
                    ParagraphStyle("c1", fontName="Helvetica-Bold", fontSize=34, leading=38,
                                   textColor=colors.white)))
fl.append(br(3))
fl.append(Paragraph("Competência " + COMP + " &nbsp;·&nbsp; modelo recategorizado em dez cards",
                    ParagraphStyle("c2", fontName="Helvetica", fontSize=13, leading=18,
                                   textColor=colors.HexColor("#D8E8E1"))))
fl.append(br(10))
linha = Table([[""]], colWidths=[38 * mm], rowHeights=[1.2])
linha.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#8FC0B2"))]))
fl.append(linha)
fl.append(br(8))
fl.append(Paragraph("Gerado em 28/08/2026<br/>Recorte: todos os períodos · todas as operadoras · AD e ID",
                    ParagraphStyle("c3", fontName="Helvetica", fontSize=9, leading=14,
                                   textColor=colors.HexColor("#A9CCC0"))))
fl.append(NextPageTemplate("corpo"))
fl.append(PageBreak())

LC = LARG - 2 * MARG

# ── Sumário executivo ─────────────────────────────────────
fl.append(P("SUMÁRIO EXECUTIVO", st_sec))
fl.append(P("Os dez cards no período", st_h1))
fl.append(br(1))
fl.append(P("Cada card traz seu valor principal e a situação frente à meta. O card 03 é espelho da saída "
            "por óbito registrada no card 01 e não soma ao painel; o card 07 é campo de valor, não contador.",
            st_nota))
fl.append(br(4))

dados = [[P("Card", st_th), P("Indicador", st_th), P("Principal", st_th),
          P("Referência", st_th), P("Meta", st_th), P("Situação", st_th)]]
estilo = [("BACKGROUND", (0, 0), (-1, 0), c_pine),
          ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
          ("TOPPADDING", (0, 0), (-1, -1), 5),
          ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
          ("LEFTPADDING", (0, 0), (-1, -1), 6),
          ("LINEBELOW", (0, 1), (-1, -1), 0.4, c_line)]
for i, c in enumerate(CARDS, 1):
    st = c['stats'][0]
    fora = c['meta'] and not c['meta']['ok']
    sit = "Sem meta" if not c['meta'] else ("Atingida" if c['meta']['ok'] else "Fora da meta")
    dados.append([P(c['code'], st_td_b), P(c['nome'], st_td_b), P(st['v'], st_td_b),
                  P(st['k'], st_td), P(c['meta']['txt'] if c['meta'] else "—", st_td),
                  Paragraph(sit, ParagraphStyle("s", fontName="Helvetica-Bold", fontSize=8,
                                                textColor=c_brick if fora else (c_pine if c['meta'] else c_ink3)))])
    if i % 2 == 0:
        estilo.append(("BACKGROUND", (0, i), (-1, i), c_surf2))
t = Table(dados, colWidths=[13 * mm, 46 * mm, 22 * mm, 32 * mm, 42 * mm, 19 * mm], repeatRows=1)
t.setStyle(TableStyle(estilo))
fl.append(t)
fl.append(PageBreak())

# ── Um bloco por card ─────────────────────────────────────
for c in CARDS:
    bloco = [P("CARD " + c['code'], st_sec), P(c['nome'], st_h1), br(1), P(c['nota'], st_nota)]

    if c['espelho']:
        e = Table([[P(c['espelho'], ParagraphStyle("esp", fontName="Helvetica-Bold", fontSize=7,
                                                   textColor=colors.HexColor("#" + SAND)))]],
                  colWidths=[LC])
        e.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#" + SAND)),
                               ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                               ("LEFTPADDING", (0, 0), (-1, -1), 6)]))
        bloco += [br(2.5), e]

    if c['meta']:
        ok = c['meta']['ok']
        m = Table([[Paragraph(("META ATINGIDA" if ok else "FORA DA META") + "  ·  " + c['meta']['txt'],
                              ParagraphStyle("m", fontName="Helvetica-Bold", fontSize=7.6,
                                             textColor=c_pine if ok else c_brick))]], colWidths=[LC])
        m.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), c_pine_l if ok else c_brick_l),
                               ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                               ("LEFTPADDING", (0, 0), (-1, -1), 7)]))
        bloco += [br(2.5), m]

    kpis, est_k = [[], [], []], []
    for i, s in enumerate(c['stats'][:4]):
        cor = c_brick if s['warn'] else (c_pine if i == 0 else c_ink)
        kpis[0].append(P(s['k'].upper(), st_kpi_k))
        kpis[1].append(Paragraph(s['v'], kpi_v(cor)))
        kpis[2].append(P(s['d'], st_kpi_d))
        fundo = c_brick_l if s['warn'] else (c_pine_l if i == 0 else c_surf2)
        est_k.append(("BACKGROUND", (i, 0), (i, 2), fundo))
    cw = (LC - 6) / max(1, len(kpis[0]))
    tk = Table(kpis, colWidths=[cw] * len(kpis[0]))
    tk.setStyle(TableStyle(est_k + [("TOPPADDING", (0, 0), (-1, 0), 6),
                                    ("BOTTOMPADDING", (0, 2), (-1, 2), 6),
                                    ("TOPPADDING", (0, 1), (-1, 2), 1),
                                    ("BOTTOMPADDING", (0, 0), (-1, 1), 1),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                                    ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    bloco += [br(4), tk, br(5), P("EVOLUÇÃO MENSAL", st_sec)]

    piv = c['pivot']
    ncols = len(piv['cols'])
    linhas = [[P(h, st_th) for h in piv['cols']]]
    est_p = [("BACKGROUND", (0, 0), (-1, 0), c_pine),
             ("ALIGN", (1, 0), (-1, -1), "CENTER"),
             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
             ("LEFTPADDING", (0, 0), (-1, -1), 6),
             ("LINEBELOW", (0, 1), (-1, -1), 0.4, c_line)]
    for i, row in enumerate(piv['rows'], 1):
        sty = st_td_b if row['pai'] else st_td
        cel = [P(row['cells'][0], sty)] + [P(v, sty) for v in row['cells'][1:]]
        linhas.append(cel)
        if row['pai']:
            est_p.append(("BACKGROUND", (0, i), (-1, i), c_pine_l))
    prim = 62 * mm
    resto = (LC - prim) / max(1, ncols - 1)
    tp = Table(linhas, colWidths=[prim] + [resto] * (ncols - 1), repeatRows=1)
    tp.setStyle(TableStyle(est_p))
    bloco += [tp]

    if c['alertas']:
        bloco += [br(5), P("PENDÊNCIAS DO CARD", st_sec)]
        la = []
        for a in c['alertas'][:6]:
            la.append([P(a['registro'], st_td_b), P(a['quem'], st_td),
                       Paragraph(limpa(a['texto']), ParagraphStyle("al", fontName="Helvetica",
                                                                   fontSize=7.6, leading=10, textColor=c_brick))])
        ta = Table(la, colWidths=[22 * mm, 38 * mm, LC - 60 * mm])
        ta.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), c_brick_l),
                                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.white)]))
        bloco += [ta]

    fl.append(KeepTogether(bloco))
    fl.append(PageBreak())

# ── Retrocompatibilidade ──────────────────────────────────
fl.append(P("VIRADA DE MODELO", st_sec))
fl.append(P("O que vem do sistema atual", st_h1))
fl.append(br(1))
fl.append(P("Nenhuma função existente se perde. Para cada página do sistema em uso, o que é mantido, "
            "o que muda de forma e o que passa a existir.", st_nota))
fl.append(br(4))
for p in D['paginas']:
    linhas = [[P(p['nome'], ParagraphStyle("pn", fontName="Helvetica-Bold", fontSize=9.5, textColor=c_ink)), ""]]
    est = [("SPAN", (0, 0), (1, 0)), ("BACKGROUND", (0, 0), (-1, 0), c_pine_l),
           ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
           ("LEFTPADDING", (0, 0), (-1, -1), 6), ("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LINEBELOW", (0, 1), (-1, -1), 0.4, c_line)]
    for k, v in p['itens']:
        linhas.append([P(k, st_td_b), P(v, st_td)])
    t = Table(linhas, colWidths=[20 * mm, LC - 20 * mm])
    t.setStyle(TableStyle(est))
    fl.append(KeepTogether([t, br(4)]))

fl.append(br(8))
fl.append(P("Aprovação da competência " + COMP, st_h1))
fl.append(br(6))
ass = Table([["", ""], [P("Coordenação de enfermagem", st_td), P("Diretoria médica", st_td)]],
            colWidths=[(LC - 10 * mm) / 2] * 2, rowHeights=[14 * mm, None])
ass.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, 0), 0.6, c_ink3),
                         ("TOPPADDING", (0, 1), (-1, 1), 4)]))
fl.append(ass)

doc = Doc("Painel_Indicadores_08-2026.pdf")
doc.build(fl)
print("pdf ok")
