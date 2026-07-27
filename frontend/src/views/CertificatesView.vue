<template lang="pug">
div(class="space-y-6 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    div
      h2.text-h5.font-weight-bold Certificados de Capacitação
      .text-body-2.text-medium-emphasis Preencha os dados e gere o certificado em A4 paisagem
    v-btn(color="primary" variant="elevated" prepend-icon="mdi-printer" @click="printCertificate") {{ printLabel }}

  v-row
    v-col(cols="12" lg="4")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Template
        v-card-text
          .d-flex.ga-2.align-center
            v-select(
              v-model="selectedTemplate"
              :items="templateNames"
              label="Template salvo"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              no-data-text="Nenhum template salvo"
              @update:model-value="applyTemplate"
            )
            v-btn(icon="mdi-content-save" size="small" variant="tonal" color="primary" title="Salvar campos atuais como template" @click="openSaveDialog")
            v-btn(icon="mdi-delete" size="small" variant="tonal" color="error" title="Excluir template selecionado" :disabled="!selectedTemplate" @click="deleteTemplate")
          .text-caption.text-medium-emphasis.mt-2 O template salva todos os campos, exceto o nome do participante.

      v-card.mt-4(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Dados do Certificado
        v-card-text
          v-text-field(
            v-model="cert.participant"
            label="Nome do participante"
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-account"
          )
          v-textarea(
            v-model="cert.title"
            label="Título do treinamento"
            density="compact"
            variant="outlined"
            rows="3"
            auto-grow
          )
          v-row(dense)
            v-col(cols="6")
              v-text-field(
                v-model="cert.hours"
                label="Carga horária"
                density="compact"
                variant="outlined"
                placeholder="03 horas"
              )
            v-col(cols="6")
              v-text-field(
                v-model="cert.date"
                label="Data de realização"
                type="date"
                density="compact"
                variant="outlined"
              )
          v-textarea(
            v-model="cert.content"
            label="Conteúdo programático (opcional)"
            density="compact"
            variant="outlined"
            rows="4"
            auto-grow
          )

          v-divider.my-3
          .text-subtitle-2.font-weight-bold.mb-2 Instrutor(a)
          v-text-field(
            v-model="cert.instructorName"
            label="Nome"
            density="compact"
            variant="outlined"
          )
          v-text-field(
            v-model="cert.instructorRole"
            label="Formação / Registro (opcional)"
            density="compact"
            variant="outlined"
            placeholder="Enfermeira – COREN-RJ nº XXXXXXX"
          )
          v-text-field(
            v-model="cert.instructorRole2"
            label="Função no treinamento (opcional)"
            density="compact"
            variant="outlined"
          )
          .text-caption.text-medium-emphasis Deixe formação e função vazias para exibir apenas o nome (ex.: quando a assinatura for feita com carimbo).

          v-divider.my-3
          .text-subtitle-2.font-weight-bold.mb-2 Representante da empresa (opcional)
          v-text-field(
            v-model="cert.repName"
            label="Nome (deixe vazio para ocultar a 2ª assinatura)"
            density="compact"
            variant="outlined"
          )
          v-text-field(
            v-if="cert.repName"
            v-model="cert.repRole"
            label="Profissão / Registro"
            density="compact"
            variant="outlined"
          )
          v-text-field(
            v-if="cert.repName"
            v-model="cert.repRole2"
            label="Cargo na empresa"
            density="compact"
            variant="outlined"
          )

      v-card.mt-4(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold Geração em Lote
        v-card-text
          v-textarea(
            v-model="bulkNames"
            label="Participantes (um nome por linha)"
            density="compact"
            variant="outlined"
            rows="5"
            placeholder="Maria da Silva Oliveira\nJoão Pereira dos Santos\n..."
            persistent-placeholder
          )
          .d-flex.align-center.ga-2(v-if="bulkList.length")
            v-chip(size="small" color="primary" variant="tonal") {{ bulkList.length }} certificado(s)
            .text-caption.text-medium-emphasis Ao imprimir, será gerada uma página por participante.

    v-col(cols="12" lg="8")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold.d-flex.align-center
          | Pré-visualização (A4 paisagem)
          v-chip.ml-2(v-if="bulkList.length" size="x-small" color="primary" variant="tonal") 1ª de {{ bulkList.length }} páginas
        v-card-text
          .cert-preview(ref="previewEl")
            .cert-preview-scaler(:style="scalerStyle")
              CertificateSheet(:data="previewData")

v-dialog(v-model="saveDialog" max-width="420")
  v-card
    v-card-title.text-subtitle-1.font-weight-bold Salvar template
    v-card-text
      v-text-field(
        v-model="templateName"
        label="Nome do template"
        density="compact"
        variant="outlined"
        autofocus
        hide-details
        @keyup.enter="saveTemplate"
      )
    v-card-actions
      v-spacer
      v-btn(variant="text" @click="saveDialog = false") Cancelar
      v-btn(color="primary" variant="elevated" :disabled="!templateName.trim()" @click="saveTemplate") Salvar

Teleport(to="body")
  .certificate-print-root
    CertificateSheet(v-for="(sheet, i) in printSheets" :key="i" :data="sheet")
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import CertificateSheet, { type CertificateData } from '@/components/CertificateSheet.vue'
import { useSnackbarStore } from '@/stores/snackbarStore'

const snackbar = useSnackbarStore()

const cert = reactive<CertificateData>({
  participant: 'Fulano de Tal',
  title: 'Assistência de Enfermagem no Home Care: Segurança do Paciente, Urgências e Boas Práticas Assistenciais',
  hours: '03 horas',
  date: new Date().toISOString().slice(0, 10),
  content: 'Prevenção de Lesão por Pressão, aspiração, cuidados com a TQT e GTT, intercorrências clínicas, manuseio de equipamentos, RCP, conduta e ética profissional.',
  instructorName: 'Larissa Lopes de Souza dos Santos',
  instructorRole: '',
  instructorRole2: '',
  repName: 'Dr. Raphael Figueiredo Pereira',
  repRole: 'Médico – CRM-RJ nº XXXXXXX',
  repRole2: 'Diretor Médico',
})

// Permite pré-preencher campos via query string, ex.: /certificates?participant=Fulano
const route = useRoute()
for (const key of Object.keys(cert) as (keyof CertificateData)[]) {
  const value = route.query[key]
  if (typeof value === 'string' && value) cert[key] = value
}

// ── Geração em lote ──
// Também aceita ?bulk=Nome 1|Nome 2 na query string
const bulkNames = ref(typeof route.query.bulk === 'string' ? route.query.bulk.split('|').join('\n') : '')
const bulkList = computed(() =>
  bulkNames.value
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean)
)

const printSheets = computed<CertificateData[]>(() =>
  bulkList.value.length ? bulkList.value.map((name) => ({ ...cert, participant: name })) : [{ ...cert }]
)

const previewData = computed<CertificateData>(() =>
  bulkList.value.length ? { ...cert, participant: bulkList.value[0] } : cert
)

const printLabel = computed(() =>
  bulkList.value.length > 1 ? `Imprimir ${bulkList.value.length} certificados` : 'Imprimir / Salvar PDF'
)

// ── Templates (localStorage) ──
interface CertTemplate {
  name: string
  data: Omit<CertificateData, 'participant'>
}

const TEMPLATE_KEY = 'healthmais_cert_templates'

function loadTemplates(): CertTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]')
  } catch {
    return []
  }
}

const templates = ref<CertTemplate[]>(loadTemplates())
const templateNames = computed(() => templates.value.map((t) => t.name))
const selectedTemplate = ref<string | null>(null)
const saveDialog = ref(false)
const templateName = ref('')

function persistTemplates() {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates.value))
}

function openSaveDialog() {
  templateName.value = selectedTemplate.value ?? ''
  saveDialog.value = true
}

function saveTemplate() {
  const name = templateName.value.trim()
  if (!name) return
  const { participant, ...data } = { ...cert }
  const idx = templates.value.findIndex((t) => t.name === name)
  if (idx >= 0) templates.value[idx] = { name, data }
  else templates.value.push({ name, data })
  persistTemplates()
  selectedTemplate.value = name
  saveDialog.value = false
  snackbar.show(`Template "${name}" salvo!`, 'success')
}

function applyTemplate(name: string | null) {
  if (!name) return
  const tpl = templates.value.find((t) => t.name === name)
  if (!tpl) return
  Object.assign(cert, tpl.data)
  snackbar.show(`Template "${name}" aplicado`, 'success')
}

function deleteTemplate() {
  if (!selectedTemplate.value) return
  const name = selectedTemplate.value
  templates.value = templates.value.filter((t) => t.name !== name)
  persistTemplates()
  selectedTemplate.value = null
  snackbar.show(`Template "${name}" excluído`, 'success')
}

// ── Pré-visualização em escala ──
// A4 paisagem em px CSS (297mm x 210mm a 96dpi)
const SHEET_W = 1122.5
const SHEET_H = 793.7

const previewEl = ref<HTMLElement>()
const scale = ref(0.5)
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? SHEET_W
    scale.value = Math.min(width / SHEET_W, 1)
  })
  if (previewEl.value) observer.observe(previewEl.value)
})

onUnmounted(() => observer?.disconnect())

const scalerStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  width: `${SHEET_W}px`,
  height: `${SHEET_H}px`,
  marginBottom: `${(scale.value - 1) * SHEET_H}px`,
}))

// ── Impressão ──
function printCertificate() {
  const previousTitle = document.title
  const base = bulkList.value.length
    ? `certificados-capacitacao-lote-${bulkList.value.length}`
    : `certificado-capacitacao-${cert.participant || 'certificado'}`
  const slug = base
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  document.title = slug
  const restore = () => {
    document.title = previousTitle
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}
</script>

<style scoped>
.cert-preview {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>

<style>
/* Cópia dedicada à impressão: oculta em tela, única visível ao imprimir */
.certificate-print-root {
  display: none;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }

  body > *:not(.certificate-print-root) {
    display: none !important;
  }

  .certificate-print-root {
    display: block !important;
    position: absolute;
    inset: 0;
  }

  .certificate-print-root .certificate-sheet {
    page-break-after: always;
    break-after: page;
  }

  .certificate-print-root .certificate-sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
</style>
