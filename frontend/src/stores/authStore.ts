import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// O login falso só entra junto com os dados falsos (VITE_USE_MOCK=true).
// Rodando `npm run dev` contra o backend real, a sessão é a de verdade — senão
// as gravações saem com um actor inexistente e o histórico fica inútil.
const DEV_AUTOLOGIN = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') ?? (DEV_AUTOLOGIN ? 'dev-token' : null))
  const user = ref<any>(JSON.parse(localStorage.getItem('auth_user') || 'null') ?? (DEV_AUTOLOGIN ? { name: 'Desenvolvedor', email: 'dev@localhost', avatar: '' } : null))

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
