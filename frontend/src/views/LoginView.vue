<template lang="pug">
v-container.fill-height.fluid.pa-0.d-flex.align-center.justify-center

  v-card.pa-8.text-center(elevation="12" rounded="lg" max-width="400" width="100%")
    v-img.mx-auto.mb-6(
      src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
      width="120"
    )
    h1.text-h5.font-weight-bold.mb-2 Bem-vindo ao Healthmais
    p.text-body-2.text-medium-emphasis.mb-8 Entre com sua conta Google para acessar o painel administrativo.

    v-btn.mb-4(
      v-if="!processing"
      color="white"
      variant="elevated"
      size="large"
      block
      prepend-icon="mdi-google"
      @click="loginWithGoogle"
    ) Entrar com Google

    v-progress-circular.my-4(v-if="processing" indeterminate size="32" color="primary")
    p.text-body-2(v-if="processing") Autenticando...

    v-divider.my-4
    
    p.text-caption.text-disabled © 2024 Healthmais. Todos os direitos reservados.
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'

const router = useRouter()
const authStore = useAuthStore()
const snackbar = useSnackbarStore()
const processing = ref(false)

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const loginWithGoogle = () => {
  const redirectUri = window.location.origin
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&prompt=select_account`
  window.location.href = url
}

const handleCallback = async () => {
  // Google retorna o token no hash da URL: #access_token=...&token_type=...
  const hash = window.location.hash.substring(1)
  if (!hash) return

  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  if (!accessToken) return

  processing.value = true

  // Limpa o hash da URL
  window.history.replaceState(null, '', window.location.pathname)

  try {
    const baseURL = import.meta.env.VITE_API_URL || ''
    const res = await fetch(`${baseURL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    })

    if (!res.ok) {
      const text = await res.text()
      let detail = 'Falha na autenticação'
      try { detail = JSON.parse(text).detail || detail } catch {}
      snackbar.show(detail, 'error')
      processing.value = false
      return
    }

    const data = await res.json()

    if (data.success) {
      authStore.setAuth(data.token, data.user)
      snackbar.show('Login realizado com sucesso!', 'success')
      router.push('/dashboard')
    } else {
      snackbar.show('Falha na autenticação', 'error')
    }
  } catch (error) {
    console.error('Login error:', error)
    snackbar.show('Erro ao conectar com o servidor', 'error')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  handleCallback()
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
  width: 100vw;
  max-width: 100% !important;
}
</style>
