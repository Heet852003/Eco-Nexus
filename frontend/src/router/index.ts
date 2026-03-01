import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
    { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/devices', name: 'Devices', component: () => import('@/views/DevicesView.vue'), meta: { requiresAuth: true } },
    { path: '/devices/new', name: 'DeviceNew', component: () => import('@/views/DeviceFormView.vue'), meta: { requiresAuth: true } },
    { path: '/events', name: 'Events', component: () => import('@/views/EventsView.vue'), meta: { requiresAuth: true } },
    { path: '/automation', name: 'Automation', component: () => import('@/views/AutomationView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) next({ name: 'Login' })
  else if (to.meta.guest && auth.token) next({ name: 'Dashboard' })
  else next()
})

export default router
