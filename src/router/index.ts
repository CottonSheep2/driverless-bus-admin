import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login.vue'),
  },
  {
    path: '/',
    component: () => import('@/views/layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: '系统首页', component: () => import('@/views/dashboard/index.vue') },
      { path: 'station', name: '站点管理', component: () => import('@/views/station/index.vue') },
      { path: 'route', name: '线路管理', component: () => import('@/views/route/index.vue') },
      { path: 'bus', name: '公交车管理', component: () => import('@/views/bus/index.vue') },
      { path: 'alarm', name: '告警管理', component: () => import('@/views/alarm/index.vue') },
      { path: 'alarmType', name: '告警类型管理', component: () => import('@/views/alarmType/index.vue') },
      { path: 'log', name: '操作日志', component: () => import('@/views/log/index.vue') },
      { path: 'user', name: '用户管理', component: () => import('@/views/user/index.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
