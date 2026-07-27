<template lang="pug">
.certificate-sheet.certificate-back
  .cert-back-inner
    .cert-back-header
      .cert-back-title Conteúdo Programático
      .cert-back-course(v-if="data.title") {{ data.title }}

    .cert-back-content
      ul.cert-back-list(v-if="contentItems.length > 1")
        li(v-for="(item, i) in contentItems" :key="i") {{ item }}
      .cert-back-text(v-else-if="contentItems.length === 1") {{ contentItems[0] }}
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

/** Vira lista quando o conteúdo é digitado em várias linhas, separado por
 *  ponto e vírgula, ou é uma enumeração por vírgulas (3+ itens). Um texto
 *  corrido curto permanece como parágrafo. */
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
  font-size: 17pt;
  font-weight: bold;
  letter-spacing: 1.6mm;
  margin-right: -1.6mm;
  text-transform: uppercase;
  color: #1f3a63;
}

.cert-back-course {
  font-size: 11.5pt;
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
  padding: 9mm 0;
  font-size: 12pt;
  line-height: 1.65;
  color: #33507d;
}

.cert-back-list {
  margin: 0;
  padding-left: 7mm;
  columns: 2;
  column-gap: 14mm;
}

.cert-back-list li {
  margin-bottom: 2.5mm;
  break-inside: avoid;
}

.cert-back-text {
  text-align: justify;
}

.cert-back-empty {
  color: #8b9ab3;
}

.cert-back-meta {
  padding-top: 8mm;
  display: flex;
  gap: 16mm;
  font-size: 10.5pt;
  color: #33507d;
}

.cert-back-footer {
  margin-top: 8mm;
  padding-top: 5mm;
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
  font-size: 9.5pt;
  line-height: 1.5;
  color: #33507d;
}

.cert-back-company-name {
  font-weight: bold;
  font-size: 10.5pt;
  color: #1f3a63;
}
</style>
