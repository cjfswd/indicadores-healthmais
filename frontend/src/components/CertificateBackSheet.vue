<template lang="pug">
.certificate-sheet.certificate-back
  .cert-back-inner
    .cert-back-header
      .cert-back-title Conteúdo Programático
      .cert-back-course(v-if="data.title") {{ data.title }}

    .cert-back-content
      .cert-back-tables(v-if="itemGroups.length")
        table.cert-table(v-for="(group, gi) in itemGroups" :key="gi")
          thead
            tr
              th.cert-table-num Nº
              th Tópico
          tbody
            tr(v-for="item in group" :key="item.n")
              td.cert-table-num {{ item.n }}
              td {{ item.text }}
      .cert-back-empty(v-else) —

    .cert-back-meta
      span(v-if="data.hours") Carga horária: #[strong {{ data.hours }}]
      span(v-if="data.participant") Participante: #[strong {{ data.participant }}]

    .cert-back-footer
      img.cert-back-logo(src="/certificates/healthmais-logo.png" alt="HealthMais Atendimento Domiciliar")
      .cert-back-company
        .cert-back-company-name {{ COMPANY.name }}
        .cert-back-company-line CNPJ {{ COMPANY.cnpj }}
        .cert-back-company-line {{ COMPANY.address }}
        .cert-back-company-line {{ COMPANY.email }} · {{ COMPANY.phone }}
        .cert-back-company-line {{ COMPANY.site }}
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CertificateData } from '@/components/CertificateSheet.vue'

/** Dados cadastrais da emitente, impressos no verso de todo certificado. */
const COMPANY = {
  name: 'HEALTHMAIS CUIDADOS E GESTÃO LTDA',
  cnpj: '56.028.702/0001-38',
  address: 'Rua Ministro Edgar da Costa, nº 80, Grupo 408 — Centro, Nova Iguaçu/RJ',
  email: 'contato@healthmaiscuidados.com',
  phone: '(21) 97982-8951',
  site: 'www.healthmaiscuidados.com',
}

const props = defineProps<{ data: CertificateData }>()

/** Cada tópico vira uma linha da tabela. Aceita o conteúdo digitado em
 *  várias linhas, separado por ponto e vírgula, ou como enumeração por
 *  vírgulas (3+ itens); um texto corrido único ocupa uma linha só. */
const contentItems = computed(() => {
  const raw = (props.data.content || '').trim().replace(/\.$/, '')
  if (!raw) return []
  const split = (sep: string | RegExp) => raw.split(sep).map((s) => s.trim()).filter(Boolean)

  const byLine = split(/\r?\n/)
  if (byLine.length > 1) return byLine

  const bySemicolon = split(';')
  if (bySemicolon.length > 1) return bySemicolon

  const byComma = split(',')
  if (byComma.length > 2) return byComma

  return [raw]
})

/** A folha tem altura fixa: acima de 8 tópicos a tabela é dividida em duas,
 *  lado a lado, para aproveitar a largura do A4 paisagem sem cortar linhas. */
const itemGroups = computed(() => {
  const rows = contentItems.value.map((text, i) => ({ n: i + 1, text }))
  if (!rows.length) return []
  if (rows.length <= 8) return [rows]
  const half = Math.ceil(rows.length / 2)
  return [rows.slice(0, half), rows.slice(half)]
})
</script>

<style scoped>
.certificate-back {
  width: 297mm;
  height: 210mm;
  background-color: #ffffff;
  background-image: url('/certificates/certificate-bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  color: #1f3a63;
  font-family: Georgia, 'Times New Roman', serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  overflow: hidden;
}

.cert-back-inner {
  width: 100%;
  height: 100%;
  padding: 26mm 34mm 22mm;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.cert-back-header {
  text-align: center;
}

.cert-back-title {
  font-size: 19pt;
  font-weight: bold;
  letter-spacing: 1.6mm;
  margin-right: -1.6mm;
  text-transform: uppercase;
  color: #1f3a63;
}

.cert-back-course {
  font-size: 12.5pt;
  line-height: 1.4;
  color: #5a6f8f;
  margin-top: 3mm;
  max-width: 200mm;
  margin-left: auto;
  margin-right: auto;
}

/* Ocupa a área entre o cabeçalho e o rodapé, com o conteúdo centrado
   verticalmente para que listas curtas não deixem um vazio na página. */
.cert-back-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* min-height/overflow impedem que uma tabela longa empurre o rodapé
     para cima da moldura decorativa. */
  min-height: 0;
  overflow: hidden;
  padding: 5mm 0;
  font-size: 13pt;
  line-height: 1.35;
  color: #33507d;
}

.cert-back-tables {
  display: flex;
  justify-content: center;
  gap: 12mm;
  width: 100%;
}

.cert-table {
  flex: 1 1 0;
  max-width: 200mm;
  border-collapse: collapse;
  text-align: left;
}

.cert-table th,
.cert-table td {
  border: 0.3mm solid rgba(31, 58, 99, 0.35);
  padding: 1.6mm 4mm;
  vertical-align: top;
}

.cert-table thead th {
  background: rgba(31, 58, 99, 0.08);
  font-size: 12.5pt;
  font-weight: bold;
  letter-spacing: 0.4mm;
  text-transform: uppercase;
  color: #1f3a63;
}

.cert-table tbody tr:nth-child(even) td {
  background: rgba(31, 58, 99, 0.035);
}

.cert-table-num {
  width: 12mm;
  text-align: center;
  white-space: nowrap;
}

.cert-back-empty {
  color: #8b9ab3;
}

.cert-back-meta {
  padding-top: 5mm;
  display: flex;
  gap: 16mm;
  font-size: 11.5pt;
  color: #33507d;
}

.cert-back-footer {
  margin-top: 5mm;
  padding-top: 4mm;
  border-top: 0.35mm solid rgba(31, 58, 99, 0.35);
  display: flex;
  align-items: center;
  gap: 8mm;
}

/* A faixa transparente do PNG é absorvida pelas margens negativas,
   como na frente do certificado. */
.cert-back-logo {
  height: 26mm;
  object-fit: contain;
  margin: -7mm 0 -8mm;
}

.cert-back-company {
  font-size: 10.5pt;
  line-height: 1.5;
  color: #33507d;
}

.cert-back-company-name {
  font-weight: bold;
  font-size: 11.5pt;
  color: #1f3a63;
}
</style>
