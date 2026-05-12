<template lang="pug">
v-dialog(v-model="isOpen" max-width="900px" scrollable)
  v-card
    v-card-title.d-flex.justify-space-between.align-center.pa-4
      .d-flex.flex-column
        span.text-h6.font-weight-bold Histórico do Stream
        span.text-caption.text-medium-emphasis {{ getStreamTypeLabel(streamType) }} · Stream: {{ streamId }}
      v-btn(icon variant="text" @click="close")
        v-icon mdi-close

    v-divider

    v-card-text.pa-0(style="max-height: 70vh; overflow-y: auto")
      //- Loading
      .d-flex.justify-center.py-8(v-if="isLoading")
        v-progress-circular(indeterminate color="primary")

      //- Empty
      v-alert.ma-4(v-else-if="!events || !events.length" type="info" variant="tonal")
        | Nenhum evento encontrado para esta entidade.

      //- Timeline
      v-timeline(v-else density="compact" side="end")
        v-timeline-item(
          v-for="(entry, idx) in events"
          :key="entry._id || idx"
          :dot-color="dotColor(entry.eventType)"
          size="small"
        )
          template(#icon)
            v-icon(size="x-small" color="white") {{ actionIcon(entry.eventType) }}
          
          v-card.ma-2(elevation="1" border)
            v-card-title.d-flex.justify-space-between.align-center.pa-3
              .d-flex.align-center.gap-2
                v-chip(
                  :color="dotColor(entry.eventType)"
                  size="small"
                  variant="flat"
                ) {{ formatAction(entry.eventType) }}
                v-chip(size="x-small" color="secondary" variant="tonal")
                  | v{{ entry.version }}
                span.text-caption.text-medium-emphasis {{ formatTimestamp(entry.timestamp) }}
              v-btn(
                v-if="entry.data"
                size="x-small"
                variant="text"
                :icon="expandedEntries[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click.stop="toggleExpand(idx)"
              )

            v-card-text.pa-3.pt-0(v-if="entry.actor")
              .d-flex.align-center.gap-1
                v-icon(size="small" color="grey") mdi-account
                span.text-body-2.text-medium-emphasis {{ entry.actor }}

            //- Expanded data view
            v-expand-transition
              div(v-if="expandedEntries[idx]")
                v-divider
                v-card-text.pa-3
                  v-row
                    //- Event data (payload do evento)
                    v-col(cols="12")
                      .text-caption.font-weight-bold.mb-2.d-flex.align-center.gap-1.text-info
                        v-icon(size="small") mdi-code-json
                        | Payload do Evento
                      v-sheet.pa-2.rounded(
                        :color="isDark ? 'grey-darken-3' : 'grey-lighten-4'"
                        style="max-height: 300px; overflow-y: auto"
                      )
                        pre.text-caption(style="white-space: pre-wrap; word-break: break-all") {{ formatState(entry.data) }}

                  //- Changed fields (compared to previous event)
                  .mt-3(v-if="idx > 0 && entry.eventType === 'UPDATE'")
                    .text-caption.font-weight-bold.mb-1.d-flex.align-center.gap-1.text-warning
                      v-icon(size="small") mdi-delta
                      | Campos neste patch
                    .d-flex.flex-wrap.gap-1
                      v-chip(
                        v-for="field in getDataFields(entry.data)"
                        :key="field"
                        size="x-small"
                        color="warning"
                        variant="tonal"
                      ) {{ field }}

    v-divider
    v-card-actions.pa-4
      .text-caption.text-medium-emphasis(v-if="events && events.length")
        | {{ events.length }} evento(s) no stream
      v-spacer
      v-btn(variant="text" @click="close") Fechar
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { fetchEntityEvents } from '@/lib/proxy-client'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')

const isOpen = ref(false)
const isLoading = ref(false)
const streamType = ref('')
const streamId = ref('')
const events = ref<any[]>([])
const expandedEntries = reactive<Record<number, boolean>>({})

const open = async (targetStreamType: string, targetStreamId: string) => {
  streamType.value = targetStreamType
  streamId.value = targetStreamId
  isOpen.value = true
  isLoading.value = true
  
  // Reset expanded state
  Object.keys(expandedEntries).forEach(k => delete expandedEntries[Number(k)])
  
  try {
    const res = await fetchEntityEvents<any>(targetStreamType, targetStreamId)
    // Eventos vêm em ordem crescente de version (do endpoint dedicado)
    events.value = (res.result || []).reverse()
  } catch (err) {
    console.error('Failed to load event stream:', err)
    events.value = []
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  isOpen.value = false
}

const toggleExpand = (idx: number) => {
  expandedEntries[idx] = !expandedEntries[idx]
}

const getStreamTypeLabel = (st: string) => {
  const labels: Record<string, string> = {
    patients: 'Paciente',
    operators: 'Operadora',
    indicators: 'Indicador',
  }
  return labels[st] || st
}

const formatAction = (eventType: string) => {
  const labels: Record<string, string> = {
    CREATE: 'Criação',
    UPDATE: 'Atualização',
    SOFT_DELETE: 'Exclusão'
  }
  return labels[eventType] || eventType
}

const dotColor = (eventType: string) => {
  const colors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    SOFT_DELETE: 'error'
  }
  return colors[eventType] || 'grey'
}

const actionIcon = (eventType: string) => {
  const icons: Record<string, string> = {
    CREATE: 'mdi-plus',
    UPDATE: 'mdi-pencil',
    SOFT_DELETE: 'mdi-delete'
  }
  return icons[eventType] || 'mdi-information'
}

const formatTimestamp = (ts: string | Date) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatState = (state: any) => {
  if (!state) return '(vazio)'
  try {
    const cleaned = { ...state }
    // Remove binary placeholders for cleaner display
    if (cleaned.file) {
      cleaned.file = {
        name: cleaned.file.name,
        type: cleaned.file.type,
        size: cleaned.file.size,
        data: cleaned.file.data === '__BINARY_STRIPPED__' ? '[BINARY]' : cleaned.file.data ? '[BINARY]' : undefined
      }
    }
    if (cleaned.events) {
      cleaned.events = cleaned.events.map((e: any) => {
        const eventCopy = { ...e }
        if (eventCopy.file) {
          eventCopy.file = {
            name: eventCopy.file.name,
            type: eventCopy.file.type,
            size: eventCopy.file.size,
            data: '[BINARY]'
          }
        }
        return eventCopy
      })
    }
    return JSON.stringify(cleaned, null, 2)
  } catch {
    return String(state)
  }
}

const getDataFields = (data: any): string[] => {
  if (!data || typeof data !== 'object') return []
  return Object.keys(data).filter(k => !['_id', 'updatedAt', 'createdAt'].includes(k))
}

defineExpose({ open, close })
</script>
