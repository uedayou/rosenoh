import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import vuetify from './plugins/vuetify'
import './styles/app.css'

import Top from './components/Top.vue'
import Question from './components/Question.vue'
import Answer from './components/Answer.vue'
import Results from './components/Results.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'top', component: Top },
    { path: '/quiz/:id', name: 'quiz', component: Question },
    { path: '/answer/:id', name: 'answer', component: Answer },
    { path: '/results', name: 'results', component: Results },
  ],
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .mount('#app')
