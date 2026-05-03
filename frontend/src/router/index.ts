import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'images',
        name: 'ImageList',
        component: () => import('@/views/ImageListView.vue'),
        meta: { title: '影像列表' }
      },
      {
        path: 'viewer/:id?',
        name: 'ImageViewer',
        component: () => import('@/views/ImageViewerView.vue'),
        meta: { title: '影像查看器' }
      },
      {
        path: 'upload',
        name: 'Upload',
        component: () => import('@/views/UploadView.vue'),
        meta: { title: '上传影像' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  document.title = to.meta.title
    ? `${to.meta.title} - 医疗影像远程诊断平台`
    : '医疗影像远程诊断平台'

  if (to.meta.requiresAuth !== false && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
