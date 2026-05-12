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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCrud } from '@/composables/useCrud'
import { NotificationService } from '@/services/NotificationService'
import type { Notification } from '@/lib/domain-schemas'


const router = useRouter()
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
  update: updateNotif, 
  remove: deleteNotif, 
  refetch 
} = useCrud<Notification>('notifications', { 
  defaultPageSize: 20
})

const notifications = computed(() => notificationsData.value || [])
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

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
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const handleNotifClick = async (notif: Notification) => {
  if (!notif.isRead) {
    await updateNotif({ id: notif._id!, data: { isRead: true } })
  }
  if (notif.link) {
    router.push(notif.link)
    menu.value = false
  }
}

const markAllAsRead = async () => {
  const unread = notifications.value.filter(n => !n.isRead)
  for (const n of unread) {
    await updateNotif({ id: n._id!, data: { isRead: true } })
  }
}

const clearHistory = async () => {
  for (const n of notifications.value) {
    await deleteNotif(n._id!)
  }
}

// Polling simples a cada 30 segundos (ou poderíamos usar WebSockets se tivéssemos suporte no backend)
setInterval(() => {
  refetch()
}, 30000)
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
</style>
