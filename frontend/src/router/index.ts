import { createRouter, createWebHistory } from 'vue-router'
import DashboardOverview from '@/views/DashboardOverview.vue'
import EventsView from '@/views/EventsView.vue'
import PatientsView from '@/views/PatientsView.vue'
// import UsersView from '@/views/UsersView.vue'
// import AuditLogsView from '@/views/AuditLogsView.vue'
import LoginView from '@/views/LoginView.vue'
import SocialAssistanceFormView from '@/views/SocialAssistanceFormView.vue'
import { useAuthStore } from '@/stores/authStore'

const PUBLIC_ROUTE_NAMES = ['login', 'social-assistance-form']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/formulario/assistencia-social',
      name: 'social-assistance-form',
      component: SocialAssistanceFormView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardOverview
    },
    {
      path: '/assistencia-social',
      name: 'social-assistance-reports',
      component: () => import('@/views/SocialAssistanceReportsView.vue')
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView
    },
    {
      path: '/patients',
      name: 'patients',
      component: PatientsView
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue')
    },
    // {
    //   path: '/users',
    //   name: 'users',
    //   component: UsersView
    // },
    // {
    //   path: '/audit-logs',
    //   name: 'audit-logs',
    //   component: AuditLogsView
    // }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isPublic = PUBLIC_ROUTE_NAMES.includes(to.name as string)
  if (!isPublic && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
