<template lang="pug">
v-dialog(v-model="isOpen" max-width="400" persistent)
  v-card
    v-card-title.text-h6.font-weight-bold.pt-4.px-4
      v-icon(color="warning" class="mr-2" size="small") mdi-alert
      | {{ title }}
    v-card-text.px-4.py-2
      | {{ message }}
    v-card-actions.pa-4
      v-spacer
      v-btn(variant="text" @click="cancel") Cancelar
      v-btn(color="error" variant="flat" @click="accept") Confirmar
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { isOpen, title, message, accept, cancel } = useConfirm()
</script>
