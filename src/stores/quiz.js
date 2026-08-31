import { defineStore } from 'pinia'
import { ulid } from 'ulid'
import quizData from '@/assets/data.json'

// 出題対象とする路線の最小駅数
const MIN_STATIONS = 10

const shuffle = ([...array]) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    nQuiz: 5,
    nCandidate: 6,
    answerTime: 45,
    mode: 'normal',
    results: [],
    quizzes: [],
  }),
  getters: {
    // 出題対象の路線ラベル一覧。駅数が一定以上で、
    // 2号線/4号線があり紛らわしい「名城線」は候補から除外する。
    lines: () =>
      quizData
        .filter((d) => d.nstation >= MIN_STATIONS && !d.line.match(/名城線/))
        .map((d) => d.label),
    firstQuiz: (state) => state.quizzes[0],
    // 全問回答済みのときだけ結果配列を返す（未完了なら undefined）
    completedResults: (state) =>
      state.results.length > 0 && state.results.length === state.quizzes.length
        ? state.results
        : undefined,
    resultById: (state) => (id) => state.results.find((r) => r.id === id),
    quizById: (state) => (id) => state.quizzes.find((q) => q.id === id),
  },
  actions: {
    // 難易度に応じて候補数と制限時間を切り替える
    setMode(mode) {
      this.mode = mode
      if (mode === 'hard') {
        this.nCandidate = 4
        this.answerTime = 30
      } else if (mode === 'easy') {
        this.nCandidate = 8
        this.answerTime = 60
      } else {
        this.nCandidate = 6
        this.answerTime = 45
      }
    },
    setNumberOfQuiz(number) {
      this.nQuiz = +number
    },
    addResult(result) {
      this.results.push(result)
    },
    // クイズ一式を生成する。各問は正解1件＋ダミー7件の候補を持ち、
    // ulid で id を採番し index と次問への next リンクを張る。
    initialize() {
      this.results = []
      const lines = shuffle(this.lines)
      const quizzes = []
      for (let i = 0; i < this.nQuiz; i++) {
        const answer = lines.shift()
        const candidates = [answer]
        for (let j = 0; j < 7; j++) {
          candidates.push(lines.shift())
        }
        quizzes.push({ answer, candidates: shuffle(candidates) })
      }
      quizzes.forEach((quiz, index) => {
        quiz.id = ulid()
        quiz.index = index + 1
        if (index > 0) quizzes[index - 1].next = quiz.id
      })
      this.quizzes = quizzes
    },
  },
})
