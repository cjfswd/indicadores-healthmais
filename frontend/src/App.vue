<template lang="pug">
v-app
  DashboardLayout
  ConfirmDialog
  
  v-snackbar(
    v-model="snackbar.isVisible"
    :color="snackbar.color"
    timeout="3000"
    location="top"
  )
    | {{ snackbar.message }}
    template(v-slot:actions)
      v-btn(variant="text" @click="snackbar.hide()") Fechar
</template>

<script setup lang="ts">
import DashboardLayout from '@/components/DashboardLayout.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useSnackbarStore } from '@/stores/snackbarStore'

const snackbar = useSnackbarStore()
</script>

<style>
.v-input__details {
  padding-left: 0 !important;
  padding-top: 2px !important;
  min-height: 16px !important;
}
</style>
