<template lang="pug">
.certificate-sheet
  .cert-inner
    img.cert-logo(src="/certificates/healthmais-logo.png" alt="HealthMais Atendimento Domiciliar")

    .cert-heading
      .cert-title CERTIFICADO
      .cert-subtitle DE CAPACITAÇÃO

    .cert-body
      .cert-lead Certificamos que
      .cert-name {{ data.participant || '____________________________' }}
      .cert-text concluiu com aproveitamento a capacitação
      .cert-course {{ data.title }}
      .cert-text
        | com carga horária de #[strong {{ data.hours }}], realizada em #[strong {{ formattedDate }}].

    .cert-signatures(:class="{ 'cert-signatures--single': signatureCount === 1 }")
      .cert-sign
        .cert-sign-slot
          img.cert-sign-img(v-if="data.instructorSignature" :src="data.instructorSignature" alt="")
        .cert-sign-line
        .cert-sign-name(v-if="data.instructorName") {{ data.instructorName }}
        .cert-sign-role(v-if="data.instructorRole") {{ data.instructorRole }}
        .cert-sign-role(v-if="data.instructorRole2") {{ data.instructorRole2 }}
      .cert-sign(v-if="hasRepresentative")
        .cert-sign-slot
          img.cert-sign-img(v-if="data.repSignature" :src="data.repSignature" alt="")
        .cert-sign-line
        .cert-sign-name(v-if="data.repName") {{ data.repName }}
        .cert-sign-role(v-if="data.repRole") {{ data.repRole }}
        .cert-sign-role(v-if="data.repRole2") {{ data.repRole2 }}
      .cert-sign(v-if="data.studentLabel")
        //- Slot vazio: o aluno assina à mão, mas mantém as três linhas na mesma altura
        .cert-sign-slot
        .cert-sign-line
        .cert-sign-name(v-if="data.participant") {{ data.participant }}
        .cert-sign-role {{ data.studentLabel }}
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface CertificateData {
  participant: string
  title: string
  hours: string
  date: string
  content: string
  instructorName: string
  instructorRole: string
  instructorRole2: string
  instructorSignature: string
  repName: string
  repRole: string
  repRole2: string
  repSignature: string
  studentLabel: string
}

const props = defineProps<{ data: CertificateData }>()

/** A 2ª assinatura aparece se qualquer um dos campos do representante
 *  estiver preenchido — o nome pode ser omitido quando ele assina com carimbo. */
const hasRepresentative = computed(
  () => !!(props.data.repName || props.data.repRole || props.data.repRole2)
)

/** A 3ª assinatura é a do aluno: assina à mão, então leva o nome do
 *  participante impresso abaixo da linha. O rótulo vazio a oculta. */
const signatureCount = computed(
  () => 1 + (hasRepresentative.value ? 1 : 0) + (props.data.studentLabel ? 1 : 0)
)

const formattedDate = computed(() => {
  if (!props.data.date) return '____/____/________'
  const safe = props.data.date.includes('T') ? props.data.date : `${props.data.date}T12:00:00`
  return new Date(safe).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
})
</script>

<style scoped>
.certificate-sheet {
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

.cert-inner {
  width: 100%;
  height: 100%;
  padding: 15mm 30mm 19mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* O PNG da logo tem ~35% de área transparente abaixo do logotipo (≈13mm
   nesta altura). A margem negativa absorve parte dessa faixa vazia para
   aproximar o título, mantendo uma folga visual de ~7mm. */
.cert-logo {
  height: 37mm; /* ≈ 13mm de logotipo visível */
  object-fit: contain;
  margin-bottom: -7mm;
}

.cert-heading {
  margin-top: 1mm;
}

.cert-title {
  font-size: 30pt;
  line-height: 1.15;
  font-weight: bold;
  letter-spacing: 5mm;
  margin-right: -5mm; /* compensa o letter-spacing do último caractere para manter centralizado */
  color: #1f3a63;
}

.cert-subtitle {
  font-size: 12pt;
  line-height: 1.2;
  letter-spacing: 2.4mm;
  margin-right: -2.4mm;
  color: #5a6f8f;
}

/* Com o conteúdo programático no verso, as margens automáticas centram o
   corpo do texto entre o cabeçalho e as assinaturas. */
.cert-body {
  margin-top: auto;
  margin-bottom: auto;
  padding-top: 6mm;
}

.cert-lead {
  font-size: 13pt;
  color: #33507d;
}

.cert-name {
  font-family: 'Monotype Corsiva', 'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive;
  font-size: 31pt;
  font-style: normal;
  font-weight: normal;
  line-height: 0.85;
  color: #1f3a63;
  border-bottom: 0.4mm solid rgba(31, 58, 99, 0.45);
  display: inline-block;
  /* O padding inferior mantém a linha abaixo das descendentes (g, j, ç, y):
     com line-height reduzido a caixa termina acima delas e a borda cortaria
     as letras em nomes como "Jorge Gonçalves". */
  padding: 0 12mm 2.5mm;
  margin: 2mm 0 1mm;
}

.cert-text {
  font-size: 13pt;
  line-height: 1.5;
  color: #33507d;
}

.cert-course {
  font-size: 15.5pt;
  font-weight: bold;
  max-width: 230mm;
  margin: 3mm auto 3.5mm;
  line-height: 1.4;
  color: #1f3a63;
}

/* O conteúdo programático vive no verso (CertificateBackSheet); na frente
   o espaço livre fica todo acima das assinaturas, fixas no rodapé. */
.cert-signatures {
  margin-top: auto;
  padding-top: 6mm;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  align-items: flex-start;
  gap: 12mm;
}

.cert-signatures--single {
  justify-content: center;
}

/* Largura ideal de 88mm, que encolhe quando as três assinaturas
   não cabem lado a lado na área útil da folha (237mm). */
.cert-sign {
  flex: 0 1 88mm;
}

/* Slot de altura fixa: a rubrica repousa sobre a linha sem deslocar o layout */
.cert-sign-slot {
  height: 15mm;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: -2mm;
  overflow: visible;
}

.cert-sign-img {
  max-height: 22mm;
  max-width: 72mm;
  object-fit: contain;
}

.cert-sign-line {
  border-top: 0.35mm solid #1f3a63;
  margin-bottom: 2mm;
}

.cert-sign-name {
  font-size: 12pt;
  font-weight: bold;
  color: #1f3a63;
}

.cert-sign-role {
  font-size: 10pt;
  color: #33507d;
  line-height: 1.2;
}
</style>
