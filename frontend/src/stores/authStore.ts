import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') ?? (import.meta.env.DEV ? 'dev-token' : null))
  const user = ref<any>(JSON.parse(localStorage.getItem('auth_user') || 'null') ?? (import.meta.env.DEV ? { name: 'Desenvolvedor', email: 'dev@localhost', avatar: '' } : null))

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(newToken: string, newUser: any) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/'
  }

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    logout
  }
})
