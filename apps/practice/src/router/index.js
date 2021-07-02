import Vue from 'vue'
import VueRouter from 'vue-router'
import JatekLista from '../components/jatek-lista/jatek-lista'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: JatekLista
  }
]

const router = new VueRouter({
  routes
})

export default router
