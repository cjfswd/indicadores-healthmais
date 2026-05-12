import { createRouter, createWebHistory } from 'vue-router'
import DashboardOverview from '@/views/DashboardOverview.vue'
import EventsView from '@/views/EventsView.vue'
import PatientsView from '@/views/PatientsView.vue'
// import UsersView from '@/views/UsersView.vue'
// import AuditLogsView from '@/views/AuditLogsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardOverview
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

export default router
