import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Setup Mocks ──────────────────────────────────────────────────
let mockFetch: ReturnType<typeof vi.fn>
let mockDbExecute: ReturnType<typeof vi.fn>
let mockSnackbarShow: ReturnType<typeof vi.fn>
let mockPostMessage: ReturnType<typeof vi.fn>
let mockShowNotification: ReturnType<typeof vi.fn>
let mockSubscribe: ReturnType<typeof vi.fn>
let mockRequestPermission: ReturnType<typeof vi.fn>

vi.mock('@/lib/proxy-client', () => ({
  dbExecute: vi.fn((...args) => mockDbExecute(...args))
}))

vi.mock('@/stores/snackbarStore', () => ({
  useSnackbarStore: () => ({
    show: mockSnackbarShow
  })
}))

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
  
  mockDbExecute = vi.fn().mockResolvedValue({ success: true })
  mockSnackbarShow = vi.fn()
  mockPostMessage = vi.fn()
  mockShowNotification = vi.fn()
  mockSubscribe = vi.fn().mockResolvedValue({ endpoint: 'https://push.example.com' })
  mockRequestPermission = vi.fn().mockResolvedValue('granted')

  // Mock Notification API
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: mockRequestPermission
  })

  // Mock navigator.serviceWorker
  const swMock = {
    ready: Promise.resolve({
      showNotification: mockShowNotification,
      pushManager: {
        subscribe: mockSubscribe
      },
      active: {
        postMessage: mockPostMessage
      }
    })
  }
  
  Object.defineProperty(navigator, 'serviceWorker', {
    value: swMock,
    writable: true,
    configurable: true
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function jsonResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  })
}

// ─── Tests ───────────────────────────────────────────────────────

describe('NotificationService', () => {
  it('requestPermission: retorna true se permissão for concedida', async () => {
    const { NotificationService } = await import('./NotificationService')
    const result = await NotificationService.requestPermission()
    
    expect(mockRequestPermission).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('requestPermission: retorna false se permissão for negada', async () => {
    mockRequestPermission.mockResolvedValue('denied')
    const { NotificationService } = await import('./NotificationService')
    const result = await NotificationService.requestPermission()
    
    expect(result).toBe(false)
  })

  it('showBrowserNotification: usa Service Worker se disponível e permissão granted', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' })
    const { NotificationService } = await import('./NotificationService')
    
    await NotificationService.showBrowserNotification('Teste', 'Mensagem', '/link')
    
    expect(mockShowNotification).toHaveBeenCalledWith('Teste', expect.objectContaining({
      body: 'Mensagem',
      data: { url: '/link' }
    }))
  })

  it('notify: insere no banco, exibe snackbar e mostra notificação nativa', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' })
    const { NotificationService } = await import('./NotificationService')
    
    await NotificationService.notify({ title: 'Aviso', message: 'Teste', type: 'info' })
    
    // Verifica dbExecute
    expect(mockDbExecute).toHaveBeenCalledWith(expect.objectContaining({
      action: 'insert',
      collection: 'notifications',
      data: expect.objectContaining({
        title: 'Aviso',
        message: 'Teste',
        type: 'info',
        isRead: false
      })
    }))
    
    // Verifica snackbar
    expect(mockSnackbarShow).toHaveBeenCalledWith('Teste', 'info')
    
    // Verifica native notification
    expect(mockShowNotification).toHaveBeenCalled()
  })

  it('subscribeToPush: busca vapid key e faz subscribe enviando pro backend', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('vapid-public-key')) {
        // Base64 encoding for 'test-key' to avoid padding errors in the conversion logic
        return jsonResponse({ publicKey: 'dGVzdC1rZXk=' })
      }
      if (url.includes('subscribe')) {
        return jsonResponse({ success: true })
      }
      return jsonResponse({}, 404)
    })

    const { NotificationService } = await import('./NotificationService')
    const result = await NotificationService.subscribeToPush()
    
    expect(result).toBe(true)
    
    // Verifies the two fetch calls were made
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it('clearNativeNotifications: envia clear_notifications via postMessage', async () => {
    const { NotificationService } = await import('./NotificationService')
    await NotificationService.clearNativeNotifications()
    
    expect(mockPostMessage).toHaveBeenCalledWith({ action: 'clear_notifications' })
  })
})
