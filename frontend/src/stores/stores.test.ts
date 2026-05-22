/**
 * @file stores.test.ts
 *
 * Testa as stores Pinia: authStore e snackbarStore.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useAuthStore } from '@/stores/authStore'


beforeEach(() => {
  setActivePinia(createPinia())

  vi.stubGlobal('localStorage', {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
})


// ─── SnackbarStore ──────────────────────────────────────────────

describe('snackbarStore', () => {
  it('inicia com isVisible false', () => {
    const store = useSnackbarStore()
    expect(store.isVisible).toBe(false)
    expect(store.message).toBe('')
    expect(store.color).toBe('success')
  })

  it('show() exibe mensagem com cor', () => {
    const store = useSnackbarStore()
    store.show('Operação realizada!', 'success')

    expect(store.isVisible).toBe(true)
    expect(store.message).toBe('Operação realizada!')
    expect(store.color).toBe('success')
  })

  it('show() usa success como cor padrão', () => {
    const store = useSnackbarStore()
    store.show('Mensagem')

    expect(store.color).toBe('success')
  })

  it('show() aceita diferentes cores', () => {
    const store = useSnackbarStore()

    for (const color of ['error', 'info', 'warning'] as const) {
      store.show('Test', color)
      expect(store.color).toBe(color)
    }
  })

  it('hide() esconde o snackbar', () => {
    const store = useSnackbarStore()
    store.show('Visível')
    expect(store.isVisible).toBe(true)

    store.hide()
    expect(store.isVisible).toBe(false)
  })

  it('show() sobrescreve mensagem anterior', () => {
    const store = useSnackbarStore()
    store.show('Primeira')
    store.show('Segunda', 'error')

    expect(store.message).toBe('Segunda')
    expect(store.color).toBe('error')
  })
})


// ─── AuthStore ──────────────────────────────────────────────────

describe('authStore', () => {
  it('inicia sem autenticação quando localStorage vazio', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
  })

  it('setAuth() salva token e user', () => {
    const store = useAuthStore()
    const mockUser = { email: 'ti@healthmais.com', name: 'TI' }

    store.setAuth('jwt-token-123', mockUser)

    expect(store.token).toBe('jwt-token-123')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123')
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser))
  })

  it('logout() limpa estado e localStorage', () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    const store = useAuthStore()
    store.setAuth('token', { name: 'Test' })

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user')
  })

  it('isAuthenticated é computed reativo', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)

    store.setAuth('token', {})
    expect(store.isAuthenticated).toBe(true)
  })
})
