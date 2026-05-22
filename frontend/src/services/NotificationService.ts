import { dbExecute } from '@/lib/proxy-client'
import { useSnackbarStore } from '@/stores/snackbarStore'
import type { Notification } from '@/lib/domain-schemas'

export const NotificationService = {
  /**
   * Solicita permissão para notificações nativas do navegador.
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações desktop.')
      return false
    }

    if (Notification.permission === 'granted') return true

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  },

  /**
   * Exibe uma notificação nativa do navegador (Desktop Notification).
   * Utiliza o Service Worker se disponível para melhor suporte em segundo plano.
   */
  async showBrowserNotification(title: string, body: string, link?: string) {
    if (Notification.permission === 'granted') {
      const options = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: link }
      }

      // Tenta usar o Service Worker (melhor para background)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification(title, options)
      } else {
        // Fallback para Notificação comum
        const notification = new Notification(title, options)
        if (link) {
          notification.onclick = () => {
            window.focus()
            window.location.href = link
          }
        }
      }
    }
  },


  /**
   * Cria uma notificação no sistema e mostra um snackbar imediato.
   */
  async notify(notification: Partial<Notification>) {
    const snackbar = useSnackbarStore()
    
    const payload = {
      title: notification.title || 'Notificação',
      message: notification.message || '',
      type: notification.type || 'info',
      isRead: false,
      link: notification.link,
      createdAt: new Date().toISOString()
    }

    try {
      // 1. Persiste no banco via proxy
      await dbExecute({
        action: 'insert',
        collection: 'notifications',
        data: payload
      })

      // 2. Feedback visual (UI)
      snackbar.show(payload.message, payload.type as any)
      
      // 3. Notificação Nativa (Browser)
      await this.showBrowserNotification(payload.title, payload.message, payload.link)
      
      console.log(`[Notification] ${payload.title}: ${payload.message}`)
    } catch (error) {
      console.error('Falha ao registrar notificação:', error)
      snackbar.show(payload.message, payload.type as any)
    }
  },


  /**
   * Atalho para notificação de novo evento.
   */
  async notifyNewEvent(patientName: string, indicatorName: string) {
    await this.notify({
      title: 'Novo Evento Registrado',
      message: `Novo evento de "${indicatorName}" registrado para o paciente ${patientName}.`,
      type: 'success',
      link: `/events`
    })
  },

  /**
   * Inscreve o navegador para Push Notifications Reais (VAPID).
   */
  async subscribeToPush() {
    if (!('serviceWorker' in navigator)) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const baseURL = import.meta.env.VITE_API_URL || ''
      
      // 1. Pega a chave pública do servidor
      const response = await fetch(`${baseURL}/push/vapid-public-key`)
      const { publicKey } = await response.json()
      
      // 2. Inscreve no Push Manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey)
      })
      
      // 3. Envia a assinatura para o backend salvar
      await fetch(`${baseURL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })

      console.log('Inscrição de Push realizada com sucesso!')
      return true
    } catch (error) {
      console.error('Erro ao inscrever para push:', error)
      return false
    }
  },

  /**
   * Utilitário para converter a chave VAPID.
   */
  urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  },

  /**
   * Comunica-se com o Service Worker para fechar todas as notificações ativas no S.O.
   */
  async clearNativeNotifications() {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({ action: 'clear_notifications' });
      }
    } catch (e) {
      console.error('Falha ao limpar notificações nativas:', e);
    }
  }
}

