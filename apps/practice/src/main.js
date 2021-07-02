import Vue from 'vue'
import JatekLista from './components/jatek-lista/jatek-lista';
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(JatekLista)
}).$mount('#app')
