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
          v-select(
            v-model="cert.instructorSignature"
            :items="signatureItems"
            item-title="name"
            item-value="src"
            label="Assinatura digitalizada (opcional)"
            density="compact"
            variant="outlined"
            clearable
            prepend-inner-icon="mdi-draw-pen"
          )
          .cert-sig-thumb.mb-2(v-if="cert.instructorSignature")
            img(:src="cert.instructorSignature" alt="Assinatura da instrutora")
          .text-caption.text-medium-emphasis Deixe vazio o que não deve aparecer no certificado — por exemplo, apenas o cargo, quando a assinatura for feita com carimbo.

          v-divider.my-3
          .text-subtitle-2.font-weight-bold.mb-2 Representante da empresa (opcional)
          v-text-field(
            v-model="cert.repName"
            label="Nome (opcional)"
            density="compact"
            variant="outlined"
          )
          v-text-field(
            v-model="cert.repRole"
            label="Profissão / Registro (opcional)"
            density="compact"
            variant="outlined"
          )
          v-text-field(
            v-model="cert.repRole2"
            label="Cargo na empresa (opcional)"
            density="compact"
            variant="outlined"
          )
          v-select(
            v-model="cert.repSignature"
            :items="signatureItems"
            item-title="name"
            item-value="src"
            label="Assinatura digitalizada (opcional)"
            density="compact"
            variant="outlined"
            clearable
            prepend-inner-icon="mdi-draw-pen"
          )
          .cert-sig-thumb.mb-2(v-if="cert.repSignature")
            img(:src="cert.repSignature" alt="Assinatura do representante")
          .text-caption.text-medium-emphasis Deixe os campos vazios para ocultar a 2ª assinatura.

          v-divider.my-3
          .text-subtitle-2.font-weight-bold.mb-2 Aluno(a)
          v-text-field(
            v-model="cert.studentLabel"
            label="Rótulo da 3ª assinatura"
            density="compact"
            variant="outlined"
            placeholder="Aluno(a)"
          )
          .text-caption.text-medium-emphasis A 3ª assinatura usa o nome do participante e é assinada à mão. Deixe o rótulo vazio para ocultá-la.

          v-divider.my-3
          .d-flex.align-center.justify-space-between.mb-2
            .text-subtitle-2.font-weight-bold Assinaturas salvas
            v-btn(size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="openSignatureDialog") Adicionar
          v-list.py-0(v-if="signatures.length" density="compact")
            v-list-item.px-2(v-for="sig in signatures" :key="sig.name")
              template(v-slot:prepend)
                img.cert-sig-mini(:src="sig.src" alt="")
              v-list-item-title.text-body-2 {{ sig.name }}
              template(v-slot:append)
                v-btn(icon="mdi-delete" size="x-small" variant="text" color="error" :disabled="sig.builtin" :title="sig.builtin ? 'Assinatura padrão do sistema' : 'Excluir'" @click="deleteSignature(sig.name)")
          .text-caption.text-medium-emphasis(v-else) Nenhuma assinatura salva.

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
            .text-caption.text-medium-emphasis Ao imprimir, serão geradas duas páginas por participante (frente e verso).

    v-col(cols="12" lg="8")
      v-card(elevation="1")
        v-card-title.text-subtitle-1.font-weight-bold.d-flex.align-center
          | Pré-visualização (A4 paisagem, frente e verso)
          v-chip.ml-2(v-if="bulkList.length" size="x-small" color="primary" variant="tonal") 1º de {{ bulkList.length }} certificados
        v-card-text
          .cert-preview(ref="previewEl")
            .cert-preview-scaler(:style="scalerStyle")
              CertificateSheet(:data="previewData")
              CertificateBackSheet.mt-4(:data="previewData")

v-dialog(v-model="signatureDialog" max-width="520")
  v-card
    v-card-title.text-subtitle-1.font-weight-bold Adicionar assinatura
    v-card-text
      v-text-field(
        v-model="newSignatureName"
        label="Nome (ex.: Dr. Raphael Figueiredo Pereira)"
        density="compact"
        variant="outlined"
      )
      v-file-input(
        v-model="newSignatureFile"
        label="Imagem da assinatura (PNG/JPG)"
        accept="image/*"
        density="compact"
        variant="outlined"
        prepend-icon=""
        prepend-inner-icon="mdi-image"
        @update:model-value="handleSignatureFile"
      )
      v-checkbox(
        v-model="removeWhiteBg"
        label="Remover fundo branco (recomendado para foto/scan em papel)"
        density="compact"
        hide-details
        @update:model-value="handleSignatureFile"
      )
      .text-caption.text-medium-emphasis.mb-2 A imagem é recortada e reduzida automaticamente.
      .cert-sig-preview(v-if="newSignaturePreview")
        img(:src="newSignaturePreview" alt="Pré-visualização da assinatura")
    v-card-actions
      v-spacer
      v-btn(variant="text" @click="signatureDialog = false") Cancelar
      v-btn(color="primary" variant="elevated" :disabled="!newSignatureName.trim() || !newSignaturePreview" @click="saveSignature") Salvar

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
    template(v-for="(sheet, i) in printSheets" :key="i")
      CertificateSheet(:data="sheet")
      CertificateBackSheet(:data="sheet")
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import CertificateSheet, { type CertificateData } from '@/components/CertificateSheet.vue'
import CertificateBackSheet from '@/components/CertificateBackSheet.vue'
import { useSnackbarStore } from '@/stores/snackbarStore'

const snackbar = useSnackbarStore()

// Assinatura que acompanha o sistema (arquivo em public/), sempre disponível
const BUILTIN_SIGNATURE = {
  name: 'Dr. Raphael Figueiredo Pereira',
  src: '/certificates/assinatura-raphael.png',
  builtin: true,
}

const cert = reactive<CertificateData>({
  participant: 'Fulano de Tal',
  title: 'Assistência de Enfermagem no Home Care: Segurança do Paciente, Urgências e Boas Práticas Assistenciais',
  hours: '03 horas',
  date: new Date().toISOString().slice(0, 10),
  content: 'Prevenção de Lesão por Pressão, aspiração, cuidados com a TQT e GTT, intercorrências clínicas, manuseio de equipamentos, RCP, conduta e ética profissional.',
  instructorName: '',
  instructorRole: '',
  instructorRole2: 'Coordenadora de Enfermagem',
  instructorSignature: '',
  repName: '',
  repRole: '',
  repRole2: 'Diretor Médico',
  repSignature: BUILTIN_SIGNATURE.src,
  studentLabel: 'Aluno(a)',
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

// ── Assinaturas (localStorage) ──
interface SavedSignature {
  name: string
  src: string
  builtin?: boolean
}

const SIGNATURE_KEY = 'healthmais_cert_signatures'

function loadSignatures(): SavedSignature[] {
  try {
    return JSON.parse(localStorage.getItem(SIGNATURE_KEY) || '[]')
  } catch {
    return []
  }
}

const userSignatures = ref<SavedSignature[]>(loadSignatures())
const signatures = computed<SavedSignature[]>(() => [BUILTIN_SIGNATURE, ...userSignatures.value])
const signatureItems = computed(() => signatures.value.map(({ name, src }) => ({ name, src })))

const signatureDialog = ref(false)
const newSignatureName = ref('')
const newSignatureFile = ref<File | File[] | null>(null)
const newSignaturePreview = ref('')
const removeWhiteBg = ref(true)

function openSignatureDialog() {
  newSignatureName.value = ''
  newSignatureFile.value = null
  newSignaturePreview.value = ''
  removeWhiteBg.value = true
  signatureDialog.value = true
}

/**
 * Reduz a imagem, opcionalmente transforma o branco em transparência
 * e recorta as bordas vazias — para a rubrica assentar bem sobre a linha.
 */
async function processSignature(file: File, stripBackground: boolean): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const MAX_W = 700
  const ratio = Math.min(1, MAX_W / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * ratio)
  canvas.height = Math.round(bitmap.height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  if (!stripBackground) return canvas.toDataURL('image/png')

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = image.data
  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1

  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] + d[i + 1] + d[i + 2]) / 3
    // rampa: >=238 vira transparente, <=88 fica opaco
    const alpha = Math.max(0, Math.min(255, Math.round((238 - lum) * (255 / 150))))
    d[i + 3] = alpha
    if (alpha > 12) {
      const p = i / 4
      const x = p % canvas.width
      const y = (p - x) / canvas.width
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  ctx.putImageData(image, 0, 0)

  if (maxX < 0) return canvas.toDataURL('image/png') // imagem vazia: devolve como está

  const pad = 4
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(canvas.width - 1, maxX + pad)
  maxY = Math.min(canvas.height - 1, maxY + pad)

  const trimmed = document.createElement('canvas')
  trimmed.width = maxX - minX + 1
  trimmed.height = maxY - minY + 1
  trimmed.getContext('2d')?.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height)
  return trimmed.toDataURL('image/png')
}

async function handleSignatureFile() {
  const raw = newSignatureFile.value
  const file = Array.isArray(raw) ? raw[0] : raw
  if (!file) {
    newSignaturePreview.value = ''
    return
  }
  try {
    newSignaturePreview.value = await processSignature(file, removeWhiteBg.value)
    if (!newSignatureName.value.trim()) {
      newSignatureName.value = file.name.replace(/\.[^.]+$/, '')
    }
  } catch (err) {
    console.error(err)
    snackbar.show('Não foi possível ler a imagem', 'error')
  }
}

function saveSignature() {
  const name = newSignatureName.value.trim()
  if (!name || !newSignaturePreview.value) return
  if (name === BUILTIN_SIGNATURE.name) {
    snackbar.show('Já existe uma assinatura do sistema com esse nome', 'error')
    return
  }
  const entry: SavedSignature = { name, src: newSignaturePreview.value }
  const idx = userSignatures.value.findIndex((s) => s.name === name)
  if (idx >= 0) userSignatures.value[idx] = entry
  else userSignatures.value.push(entry)

  try {
    localStorage.setItem(SIGNATURE_KEY, JSON.stringify(userSignatures.value))
  } catch {
    userSignatures.value = loadSignatures()
    snackbar.show('Armazenamento cheio — exclua alguma assinatura antiga', 'error')
    return
  }
  signatureDialog.value = false
  snackbar.show(`Assinatura "${name}" salva!`, 'success')
}

function deleteSignature(name: string) {
  userSignatures.value = userSignatures.value.filter((s) => s.name !== name)
  localStorage.setItem(SIGNATURE_KEY, JSON.stringify(userSignatures.value))
  const removed = signatures.value.every((s) => s.name !== name)
  if (removed) {
    if (!signatures.value.some((s) => s.src === cert.instructorSignature)) cert.instructorSignature = ''
    if (!signatures.value.some((s) => s.src === cert.repSignature)) cert.repSignature = ''
  }
  snackbar.show(`Assinatura "${name}" excluída`, 'success')
}

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

/** A pré-visualização empilha frente e verso (16px de respiro entre elas). */
const PREVIEW_GAP = 16
const PREVIEW_H = SHEET_H * 2 + PREVIEW_GAP

const scalerStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  width: `${SHEET_W}px`,
  height: `${PREVIEW_H}px`,
  marginBottom: `${(scale.value - 1) * PREVIEW_H}px`,
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

/* Fundo xadrez claro: deixa visível a transparência da rubrica */
.cert-sig-thumb,
.cert-sig-preview {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%),
    linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%);
  background-size: 12px 12px;
  background-position: 0 0, 6px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.cert-sig-thumb img {
  max-height: 56px;
  max-width: 100%;
  object-fit: contain;
}

.cert-sig-preview img {
  max-height: 130px;
  max-width: 100%;
  object-fit: contain;
}

.cert-sig-mini {
  height: 26px;
  width: 52px;
  object-fit: contain;
  margin-right: 10px;
  background: #fff;
  border-radius: 2px;
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
