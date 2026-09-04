import { defineStore } from 'pinia'
import { ulid } from 'ulid'
import quizData from '@/assets/data.json'

// 出題対象とする路線の最小駅数
const MIN_STATIONS = 10

// 難易度ごとのパラメータ（候補ヒントに出す駅数・制限秒数）。
// 難易度に関する数値はここを単一の情報源とする。
const MODES = {
  easy: { label: 'かんたん', nCandidate: 8, answerTime: 60 },
  normal: { label: 'ふつう', nCandidate: 6, answerTime: 45 },
  hard: { label: 'むずかしい', nCandidate: 4, answerTime: 30 },
}

// 路線ラベル（表示・引き当てキー）は data.json の company/line から組み立てる
const labelOf = (d) => `${d.company}/${d.line}`

// label → 路線ロゴ URL（data.json でロゴがある路線のみ）
const logoByLabel = Object.fromEntries(
  quizData.filter((d) => d.logo).map((d) => [labelOf(d), d.logo]),
)

// label → 路線カラー #RRGGBB（data.json でカラーがある路線のみ）
const colorByLabel = Object.fromEntries(
  quizData.filter((d) => d.color).map((d) => [labelOf(d), d.color]),
)

// label → 鉄道駅LOD のリソースパス（会社名リネームがある路線のみ。
// data.json の path をそのまま使う）
const pathByLabel = Object.fromEntries(
  quizData.filter((d) => d.path).map((d) => [labelOf(d), d.path]),
)

const shuffle = ([...array]) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    nQuiz: 6,
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
        .map(labelOf),
    firstQuiz: (state) => state.quizzes[0],
    // 難易度の選択肢一覧（Top 画面の難易度カード表示用）。
    // key は 'easy' | 'normal' | 'hard'、label は日本語表示名。
    modeOptions: () => Object.entries(MODES).map(([key, m]) => ({ key, ...m })),
    // 全問回答済みのときだけ結果配列を返す（未完了なら undefined）
    completedResults: (state) =>
      state.results.length > 0 && state.results.length === state.quizzes.length
        ? state.results
        : undefined,
    resultById: (state) => (id) => state.results.find((r) => r.id === id),
    quizById: (state) => (id) => state.quizzes.find((q) => q.id === id),
    // 路線ラベルからロゴ URL を引く（無ければ null）
    lineLogo: () => (label) => logoByLabel[label] || null,
    // 路線ラベルから路線カラー #RRGGBB を引く（無ければ null）
    lineColor: () => (label) => colorByLabel[label] || null,
    // 路線ラベルから鉄道駅LOD の取得パスを返す（会社名リネームが無ければ label と同じ）
    linePath: () => (label) => pathByLabel[label] || label,
  },
  actions: {
    // 難易度に応じて候補数と制限時間を切り替える（未知の値は normal 扱い）
    setMode(mode) {
      const m = MODES[mode] || MODES.normal
      this.mode = mode
      this.nCandidate = m.nCandidate
      this.answerTime = m.answerTime
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
