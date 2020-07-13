import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './App.vue'
import vuetify from './plugins/vuetify';
import store from './store'

import Top from './components/Top';
import Question from './components/Question';
import Answer from './components/Answer';
import Results from './components/Results';

Vue.config.productionTip = false

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    { path: '/', name: "top", component: Top },
    { path: '/quiz/:id', name: "quiz", component: Question },
    { path: '/answer/:id', name: "answer", component: Answer },
    { path: '/results', name: "results", component: Results },
  ]
})

new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
