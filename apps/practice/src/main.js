import Vue from 'vue'
import HelloWorld from './components/hello-world/hello-world';
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(HelloWorld)
}).$mount('#app')
