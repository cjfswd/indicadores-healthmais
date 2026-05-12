<template lang="pug">
div(class="space-y-6 animate-in fade-in duration-700")
  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h5.font-weight-bold Bem-vindo aos Indicadores Healthmais

  v-card.mb-6(elevation="0" border)
    v-card-text.pa-3
      v-row(dense align="center")
        v-col(cols="12" sm="4" md="3")
          v-text-field(
            v-model="startDate"
            type="date"
            label="Data Inicial"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="4" md="3")
          v-text-field(
            v-model="endDate"
            type="date"
            label="Data Final"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          )
        v-col(cols="12" sm="4" md="6")
          v-btn(
            v-if="startDate || endDate"
            variant="text"
            color="primary"
            prepend-icon="mdi-filter-off"
            @click="clearFilters"
          ) Limpar Filtros



  v-row
    v-col(cols="12" md="6" lg="4" v-for="card in analytics.indicatorsCards" :key="card.id")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title.text-subtitle-1.font-weight-bold.text-wrap(style="line-height: 1.3;") {{ card.name }}
        
        v-card-text.flex-grow-1.d-flex.flex-column
          .d-flex.align-center.mb-3
            .text-h4.font-weight-bold.text-primary {{ card.totalEvents }}
            .text-caption.text-medium-emphasis.ml-2 Eventos (Total)
            
          v-divider.mb-2
          
          v-list.flex-grow-1(lines="one" density="compact" v-if="card.subindicators.length")
            v-list-item.px-0(v-for="sub in card.subindicators" :key="sub.name")
              v-list-item-title.text-body-2.text-wrap {{ sub.name }}
              template(v-slot:append)
                v-chip(size="small" variant="tonal" :color="sub.eventos > 0 ? 'secondary' : 'grey'") {{ sub.eventos }}
          
          .text-caption.text-medium-emphasis.mt-4.text-center(v-else)
            | Nenhum subindicador configurado.

  v-divider.my-6

  .d-flex.justify-space-between.align-center.mb-4
    h2.text-h6.font-weight-bold Relatórios Detalhados

  v-row
    v-col(cols="12" md="6")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title Eventos Adversos (Detalhamento)
        v-card-text.flex-grow-1
          v-list(lines="one" density="compact")
            v-list-item.px-0(v-for="item in analytics.adverseEventsData" :key="item.name")
              v-list-item-title.text-body-2.text-wrap {{ item.name }}
              template(v-slot:append)
                v-chip(size="small" color="error" variant="tonal") {{ item.eventos }}
            v-list-item(v-if="!analytics.adverseEventsData.length")
              v-list-item-title.text-medium-emphasis Nenhum evento adverso registrado.

    v-col(cols="12" md="6")
      v-card(elevation="1" class="h-100 d-flex flex-column")
        v-card-title Ouvidorias (Detalhamento)
        v-card-text.flex-grow-1
          v-list(lines="one" density="compact")
            v-list-item.px-0(v-for="item in analytics.ouvidoriasData" :key="item.name")
              v-list-item-title.text-body-2.text-wrap {{ item.name }}
              template(v-slot:append)
                v-chip(size="small" color="warning" variant="tonal") {{ item.eventos }}
            v-list-item(v-if="!analytics.ouvidoriasData.length")
              v-list-item-title.text-medium-emphasis Nenhuma ouvidoria registrada.

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCrud } from '@/composables/useCrud'
import { useDashboardAnalytics } from '@/composables/useDashboardAnalytics'

const startDate = ref('')
const endDate = ref('')

const clearFilters = () => {
  startDate.value = ''
  endDate.value = ''
}

const { data: patients } = useCrud<any>('patients', { defaultPageSize: 1000 })
const { data: indicators } = useCrud<any>('indicators', { defaultPageSize: 100 })

const analytics = useDashboardAnalytics(patients, indicators, startDate, endDate)
</script>
