import { createRouter, createWebHistory } from 'vue-router'
import AssessView from '@/views/AssessView.vue'
import ProfileView from '@/views/ProfileView.vue'
import GapView from '@/views/GapView.vue'
import BoardView from '@/views/BoardView.vue'

const routes = [
  { path: '/', redirect: '/assess' },
  { path: '/assess', name: 'Assess', component: AssessView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/gap', name: 'Gap', component: GapView },
  { path: '/board', name: 'Board', component: BoardView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
