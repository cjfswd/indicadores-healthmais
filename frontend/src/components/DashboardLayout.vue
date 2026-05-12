<template lang="pug">
v-app-bar(elevation="1" density="compact" :color="theme.global.name.value === 'dark' ? 'surface' : 'white'")
  v-app-bar-nav-icon(@click="drawer = !drawer")
  v-app-bar-title Healthmais Dashboard
  v-spacer
  NotificationBell
  .d-flex.align-center.gap-2.mr-4(v-if="authStore.user")
    v-avatar(size="32")
      v-img(:src="authStore.user.avatar")
    .text-caption {{ authStore.user.name }}

v-navigation-drawer(v-model="drawer" color="blue-darken-4" theme="dark" :width="200")
  v-list(density="compact" nav)
    v-list-item(prepend-icon="mdi-view-dashboard" title="Dashboard" to="/dashboard" exact)
    v-list-item(prepend-icon="mdi-account-injury" title="Pacientes" to="/patients")
    v-list-item(prepend-icon="mdi-calendar-check" title="Eventos" to="/events")
  
  v-spacer
  v-divider
  v-list(density="compact" nav)
    v-list-item(:prepend-icon="theme.global.name.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'" :title="theme.global.name.value === 'dark' ? 'Modo Claro' : 'Modo Escuro'" @click="toggleTheme")
    v-list-item(prepend-icon="mdi-logout" title="Sair" @click="authStore.logout()")

v-main(:class="theme.global.name.value === 'dark' ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'" style="min-height: 100vh")
  div(style="padding: 16px; height: 100%; width: 100%")
    slot
</template>



<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import NotificationBell from '@/components/NotificationBell.vue'

import { useAuthStore } from '@/stores/authStore'

const drawer = ref(true)
const theme = useTheme()
const authStore = useAuthStore()

const savedTheme = localStorage.getItem('app_theme')
if (savedTheme) {
  theme.global.name.value = savedTheme
}

const toggleTheme = () => {
  const current = theme.global.name.value
  const nextTheme = current === 'dark' ? 'light' : 'dark'
  theme.global.name.value = nextTheme
  localStorage.setItem('app_theme', nextTheme)
}
</script>
