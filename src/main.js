import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import vuetify from './plugins/vuetify'
import './styles/app.css'

import { useQuizStore } from './stores/quiz'
import Top from './components/Top.vue'
import Question from './components/Question.vue'
import QuestionV2 from './components/QuestionV2.vue'
import Answer from './components/Answer.vue'
import Results from './components/Results.vue'

// 出題画面のデザイン切り替え:
//   false … 現行デザイン（Question.vue）
//   true  … 新デザイン案（QuestionV2.vue / タイマー上部固定・解答下部固定）
const USE_QUIZ_V2 = true

// どの画面を表示中かがブラウザのタブ名で分かるよう、ルートごとに
// document.title を切り替える。
const DEFAULT_TITLE = '路線王 ～駅名だけで鉄道路線を当てるクイズゲーム～'

const router = createRouter({
  history: createWebHashHistory(),
  // 画面遷移はすべて router.replace（quiz → answer → quiz … → results）。
  // ブラウザは遷移前のスクロール位置を保持してしまうため、毎回先頭に戻す。
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'top', component: Top },
    { path: '/quiz/:id', name: 'quiz', component: USE_QUIZ_V2 ? QuestionV2 : Question, meta: { screen: '出題画面' } },
    { path: '/answer/:id', name: 'answer', component: Answer, meta: { screen: '解答画面' } },
    { path: '/results', name: 'results', component: Results, meta: { screen: '結果画面' } },
  ],
})

// 遷移の確定より前に title を更新したいので beforeEach で設定する。
// 出題／解答画面は :id からストアのクイズを引き、「N問目」を付けて何問目か分かるようにする。
router.beforeEach((to) => {
  const screen = to.meta.screen
  if (!screen) {
    document.title = DEFAULT_TITLE
    return
  }
  let label = screen
  if (to.name === 'quiz' || to.name === 'answer') {
    const store = useQuizStore()
    const quiz = store.quizById(to.params.id)
    const total = store.quizzes.length
    if (quiz) {
      label = total
        ? `${screen}（${quiz.index}/${total}問目）`
        : `${screen}（${quiz.index}問目）`
    }
  }
  document.title = `${label}｜${DEFAULT_TITLE}`
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .mount('#app')
