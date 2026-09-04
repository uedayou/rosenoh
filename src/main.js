import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import vuetify from './plugins/vuetify'
import './styles/app.css'

import Top from './components/Top.vue'
import Question from './components/Question.vue'
import QuestionV2 from './components/QuestionV2.vue'
import Answer from './components/Answer.vue'
import Results from './components/Results.vue'

// 出題画面のデザイン切り替え:
//   false … 現行デザイン（Question.vue）
//   true  … 新デザイン案（QuestionV2.vue / タイマー上部固定・解答下部固定）
const USE_QUIZ_V2 = true

const router = createRouter({
  history: createWebHashHistory(),
  // 画面遷移はすべて router.replace（quiz → answer → quiz … → results）。
  // ブラウザは遷移前のスクロール位置を保持してしまうため、毎回先頭に戻す。
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'top', component: Top },
    { path: '/quiz/:id', name: 'quiz', component: USE_QUIZ_V2 ? QuestionV2 : Question },
    { path: '/answer/:id', name: 'answer', component: Answer },
    { path: '/results', name: 'results', component: Results },
  ],
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .mount('#app')
