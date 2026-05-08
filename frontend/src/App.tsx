import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { EventsView } from './components/EventsView'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardOverview } from './components/DashboardOverview'
import { ThemeProvider } from './components/ThemeProvider'
import { PatientsView } from './components/PatientsView'
import { UsersView } from './components/UsersView'

function App() {
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<any>(null)

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      let authUrl = '/auth/google';
      if (import.meta.env.VITE_PROXY_URL) {
        authUrl = import.meta.env.VITE_PROXY_URL.replace('/db/execute', '/auth/google');
      } else if (import.meta.env.DEV) {
        authUrl = 'https://localhost:3000/auth/google';
      }
        
      const res = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('coringa_token', data.token);
        setCurrentUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else {
        alert('Falha na autenticação');
      }
    } catch (e) {
      console.error('Google Auth Error:', e);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('coringa_token')
    setCurrentUser(null)
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="healthcare-theme">
      {currentUser ? (
        <DashboardLayout 
          currentUser={currentUser} 
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/events" element={<EventsView />} />
            <Route path="/patients" element={<PatientsView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl p-8 max-w-md w-full shadow-lg text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Bem-vindo aos Indicadores Healthmais</h2>
              <p className="text-muted-foreground mt-2">Faça login com sua conta do Google para acessar a plataforma.</p>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 pt-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
              />
              
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    const mockHeader = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
                    const mockPayload = btoa(JSON.stringify({ 
                      name: "Desenvolvedor Admin", 
                      email: "dev@local.com", 
                      _id: "dev_123", 
                      exp: Math.floor(Date.now() / 1000) + 3600 
                    }));
                    const mockToken = `${mockHeader}.${mockPayload}.mock_signature`;
                    
                    localStorage.setItem('coringa_token', mockToken);
                    setCurrentUser({ name: "Desenvolvedor Admin", email: "dev@local.com", _id: "dev_123" });
                  }}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
                >
                  Modo de Desenvolvimento: Entrar sem Senha
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  )
}

export default App
