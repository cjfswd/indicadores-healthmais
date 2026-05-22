<template lang="pug">
v-menu(v-model="menu" :close-on-content-click="false" offset="10" transition="scale-transition")
  template(v-slot:activator="{ props }")
    v-btn(icon v-bind="props" density="compact" class="mr-2")
      v-badge(v-if="unreadCount > 0" :content="unreadCount" color="error")
        v-icon mdi-bell-outline
      v-icon(v-else) mdi-bell-outline
  
  v-card(min-width="300" max-width="400" elevation="10" rounded="lg")
    v-card-title.d-flex.justify-space-between.align-center.pa-4
      span.text-subtitle-1.font-weight-bold Notificações
      v-btn(v-if="unreadCount > 0" variant="text" size="x-small" color="primary" @click="markAllAsRead") Marcar todas como lidas
    
    v-divider
    
    v-alert(
      v-if="showPermissionBanner"
      type="info"
      variant="tonal"
      density="compact"
      class="ma-2 text-caption"
    )
      | Deseja receber notificações no desktop?
      template(v-slot:append)
        v-btn(size="x-small" variant="flat" color="info" @click="requestPermission") Ativar

    
    v-list(v-if="notifications.length > 0" lines="two" max-height="400" class="overflow-y-auto pa-0")
      v-list-item(
        v-for="notif in notifications" 
        :key="notif._id" 
        :active="!notif.isRead"
        @click="handleNotifClick(notif)"
        class="border-b"
      )
        template(v-slot:prepend)
          v-icon(:color="getTypeColor(notif.type)") {{ getTypeIcon(notif.type) }}
        
        v-list-item-title.font-weight-bold.text-body-2 {{ notif.title }}
        v-list-item-subtitle.text-caption {{ notif.message }}
        
        template(v-slot:append)
          .text-caption.text-grey {{ formatTime(notif.createdAt) }}
    
    v-card-text.text-center.pa-8(v-else)
      v-icon(size="48" color="grey-lighten-1") mdi-bell-off-outline
      .text-body-2.text-grey.mt-2 Nenhuma notificação por aqui
    
    v-divider(v-if="notifications.length > 0")
    v-card-actions(v-if="notifications.length > 0")
      v-spacer
      v-btn(variant="text" size="small" @click="clearHistory" color="error") Limpar histórico
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useCrud } from '@/composables/useCrud'
import { dbExecute } from '@/lib/proxy-client'
import { NotificationService } from '@/services/NotificationService'
import type { Notification } from '@/lib/domain-schemas'

const POLLING_INTERVAL_MS = 30_000

const router = useRouter()
const queryClient = useQueryClient()
const menu = ref(false)

const permission = ref(typeof window !== 'undefined' ? (window.Notification?.permission || 'default') : 'default')
const showPermissionBanner = computed(() => permission.value === 'default')

const requestPermission = async () => {
  const granted = await NotificationService.requestPermission()
  if (granted) {
    await NotificationService.subscribeToPush()
  }
  permission.value = window.Notification.permission
}

const { 
  data: notificationsData, 
  refetch 
} = useCrud<Notification>('notifications', { 
  defaultPageSize: 20
})

const notifications = computed(() => notificationsData.value || [])
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const invalidateNotifications = () => {
  queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
}

const markAsReadSilently = async (id: string) => {
  await dbExecute({
    action: 'update',
    collection: 'notifications',
    id,
    data: { isRead: true }
  })
}

const deleteSilently = async (id: string) => {
  await dbExecute({
    action: 'delete',
    collection: 'notifications',
    id
  })
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'success': return 'success'
    case 'error': return 'error'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'success': return 'mdi-check-circle-outline'
    case 'error': return 'mdi-alert-circle-outline'
    case 'warning': return 'mdi-alert-outline'
    default: return 'mdi-information-outline'
  }
}

const formatTime = (dateStr: any) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `há ${diffDays}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const handleNotifClick = async (notif: Notification) => {
  if (!notif.isRead) {
    await markAsReadSilently(notif._id!)
    invalidateNotifications()
  }
  if (notif.link) {
    router.push(notif.link)
    menu.value = false
  }
}

const markAllAsRead = async () => {
  const unread = notifications.value.filter(n => !n.isRead)
  await Promise.all(unread.map(n => markAsReadSilently(n._id!)))
  invalidateNotifications()
  await NotificationService.clearNativeNotifications()
}

const clearHistory = async () => {
  await Promise.all(notifications.value.map(n => deleteSilently(n._id!)))
  invalidateNotifications()
  await NotificationService.clearNativeNotifications()
}

let pollingTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  pollingTimer = setInterval(() => {
    refetch()
  }, POLLING_INTERVAL_MS)
})

onUnmounted(() => {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
