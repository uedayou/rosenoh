<template>
  <v-container class="quiz-page-v2">
    <div v-show="!loading" class="qv2">
      <!-- 上部固定: 問題番号＋残り時間（横バー） -->
      <div class="qv2-top">
        <div class="qv2-top-row">
          <span class="qv2-index">
            問題 {{ quiz ? quiz.index : '' }}<span class="of"> / {{ totalQuiz }}</span>
          </span>
          <span class="qv2-remain" :class="remainClass">
            <span class="sec">{{ currentTime }}</span><span class="unit">秒</span>
          </span>
        </div>
        <div class="qv2-bar">
          <i :class="remainClass" :style="{ width: barWidth }"></i>
        </div>
      </div>

      <div class="qv2-body">
        <p class="qv2-lead">
          表示された駅をすべて含む鉄道路線を、下の候補から1つ選んで解答してください。時間が経つとヒントの駅が増えます。
        </p>

        <!-- 駅ヒント -->
        <section>
          <div class="qv2-sec-head">
            <h3>ヒントの駅</h3>
            <span class="qv2-count">{{ openedCount }} / {{ candidates ? candidates.length : 0 }} 駅</span>
          </div>
          <div class="qv2-hints" v-show="candidates">
            <span
              v-for="(_obj, i) in candidates"
              :key="i"
              class="qv2-hint"
              :class="{ pending: getRestTime(i) > 0 }"
            >
              {{ hintLabel(i) }}
            </span>
          </div>
        </section>

        <!-- 解答候補 -->
        <section>
          <div class="qv2-sec-head">
            <h3>正解だと思う路線を選んでください</h3>
          </div>
          <div class="qv2-answers">
            <button
              v-for="(candidate, i) in (quiz ? quiz.candidates : [])"
              :key="i"
              type="button"
              class="qv2-answer"
              :class="{ 'is-selected': answer === i }"
              @click="answer = i"
            >
              <LineLogo :label="candidate" :size="26" />
              <span class="qv2-answer-name">{{ candidate }}</span>
              <span class="qv2-answer-tick">選択中</span>
            </button>
          </div>
        </section>
      </div>

      <!-- 下部固定: 解答する -->
      <div class="qv2-bottom">
        <v-btn
          block
          size="large"
          color="primary"
          class="qv2-submit"
          :disabled="answer == null || currentTime <= 0"
          @click="complete"
        >
          {{ answer != null ? quiz.candidates[answer] + ' で解答する' : '路線を選んでください' }}
        </v-btn>
        <p class="qv2-note">
          時間切れになると自動で解答されます
        </p>
      </div>
    </div>

    <v-dialog v-model="dialog" persistent max-width="290">
      <v-card>
        <v-card-title class="text-headline-small text-center">
          解答終了
        </v-card-title>
        <v-spacer></v-spacer>
        <v-card-actions class="justify-center">
          <v-btn variant="flat" size="large" color="primary" @click="goAnswerPage">
            正解は？
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-overlay
      :model-value="loading"
      persistent
      class="align-center justify-center"
    >
      <v-progress-circular indeterminate color="white"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script>
import { useQuizStore } from '@/stores/quiz'
import LineLogo from './LineLogo.vue'

export default {
  name: 'QuestionV2View',
  components: { LineLogo },
  setup() {
    return { store: useQuizStore() }
  },
  data: () => ({
    loading: false,
    answer: null,
    line: null,
    quiz: null,
    candidates: null,
    stations: null,
    timerObj: null,
    displayTime: 5,
    startTime: 30,
    currentTime: 0,
    dialog: false,
  }),
  computed: {
    totalQuiz() {
      return this.store.quizzes.length
    },
    // 経過時間の割合で満ちていく（旧デザインの円形ゲージと同じ向き）
    barWidth() {
      const pct =
        this.startTime > 0
          ? ((this.startTime - this.currentTime) / this.startTime) * 100
          : 0
      return `${Math.max(0, Math.min(100, pct))}%`
    },
    // getTimerColor() の red/yellow/green を CSS クラスへ対応付け
    remainClass() {
      const c = this.getTimerColor()
      if (c === 'red') return 'is-bad'
      if (c === 'yellow') return 'is-warn'
      return 'is-ok'
    },
    openedCount() {
      if (!this.candidates) return 0
      return this.candidates.filter((_, i) => this.getRestTime(i) <= 0).length
    },
  },
  mounted() {
    if (this.$route.params.id) {
      this.startTime = this.store.answerTime
      this.getQuiz(this.$route.params.id)
    }
  },
  beforeUnmount() {
    this.stop()
  },
  methods: {
    async getQuiz(id) {
      this.loading = true
      this.quiz = this.store.quizById(id)
      if (!this.quiz) {
        alert('Error!')
        this.$router.replace({ name: 'top' })
        return
      }
      this.line = this.quiz.answer
      // 会社名をリネームしているため、fetch は鉄道駅LOD の元パスで行う
      const uri = 'https://uedayou.net/jrslod/' + this.store.linePath(this.line)
      try {
        const res = await fetch(uri + '.json')
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const data = await res.json()
        this.stations = getLineStations(data, uri)
        if (this.stations.length === 0) throw new Error('no stations for ' + uri)
      } catch (e) {
        // 一部の路線は .json が 404 だったり主語 URI が一致しなかったりする。
        // ゲームを固まらせず、エラー表示してトップへ戻す（既存の挙動に合わせる）。
        console.warn('getQuiz failed:', e)
        alert('Error!')
        this.$router.replace({ name: 'top' })
        return
      }
      this.candidates = this.getCandidates([...this.stations])
      this.loading = false
      this.currentTime = this.startTime
      this.start()
    },
    getCandidates(stations) {
      const num = this.store.nCandidate
      const candidates = []
      for (let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * stations.length)
        candidates.push(stations[index])
        stations.splice(index, 1)
      }
      return candidates
    },
    count() {
      if (this.currentTime === 0) {
        this.complete()
      } else {
        this.currentTime--
      }
    },
    start() {
      this.timerObj = setInterval(() => { this.count() }, 1000)
    },
    stop() {
      clearInterval(this.timerObj)
    },
    complete() {
      this.stop()
      this.setResult()
      this.dialog = true
    },
    goAnswerPage() {
      this.dialog = false
      this.$router.replace({
        name: 'answer',
        params: { id: this.$route.params.id },
      })
    },
    setResult() {
      this.store.addResult({
        ...this.quiz,
        stations: this.stations,
        candidates: this.candidates,
        select: this.quiz.candidates[this.answer] || '',
        correct: this.quiz.candidates[this.answer] === this.line,
        time: this.startTime - this.currentTime,
      })
    },
    getRestTime(number) {
      const time = this.startTime - this.displayTime * number
      return this.currentTime - time
    },
    getQuestionItem(number) {
      if (this.candidates == null) return ''
      const time = this.getRestTime(number)
      if (time > 0) {
        return time + '秒後'
      }
      return this.candidates[number]
    },
    // V2 用ラベル: 未開示は「あと◯秒」、開示済みは駅名
    hintLabel(number) {
      if (this.candidates == null) return ''
      const time = this.getRestTime(number)
      return time > 0 ? `あと${time}秒` : this.candidates[number]
    },
    getTimerColor() {
      const time = this.startTime / 4
      if (this.currentTime <= time) {
        return 'red'
      } else if (this.currentTime <= time * 2) {
        return 'yellow'
      }
      return 'green'
    },
  },
}

const RELATION = 'http://purl.org/dc/terms/relation'

const getLineStations = (data, uri) => {
  // レスポンスの主語 URI が要求 URI と一致しない路線（別名・注記付きなど）が
  // あるため、まず uri 完全一致を試し、無ければ dc:relation を持つノードを探す。
  const node =
    (data[uri] && data[uri][RELATION] ? data[uri] : null) ||
    Object.values(data).find((v) => v && v[RELATION])
  if (!node) return []
  const obj = node[RELATION]
  const bnodes = []
  for (const v of obj) bnodes.push(v.value)
  const stations = []
  for (const bnUri of bnodes) {
    const bn = data[bnUri]
    if (!bn || !bn['http://purl.org/dc/terms/hasPart']) continue
    for (const st of bn['http://purl.org/dc/terms/hasPart']) {
      // new URL().pathname は非ASCIIをパーセントエンコードするため
      // （旧 url.parse は生のまま返していた）、取り出した駅名をデコードする。
      const pathname = new URL(st.value).pathname
      const matches = pathname.match(/^\/([^/]+?)\/([^/]+?)\/([^/]+?)\/(.+$)/i)
      if (matches && matches.length === 5) {
        stations.push(decodeURIComponent(matches[4]))
      }
    }
  }
  return stations
}
</script>

<style>
.quiz-page-v2 .qv2-body {
  display: grid;
  gap: 20px;
}
.quiz-page-v2 .qv2-lead {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.6);
}

/* ===== 上部固定バー ===== */
.quiz-page-v2 .qv2-top {
  position: sticky;
  top: var(--v-layout-top, 0px);
  z-index: 2;
  margin-bottom: 16px;
  padding: 12px 16px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.quiz-page-v2 .qv2-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.quiz-page-v2 .qv2-index {
  font-weight: 700;
  font-size: 14px;
}
.quiz-page-v2 .qv2-index .of {
  color: rgba(0, 0, 0, 0.55);
  font-weight: 500;
}
.quiz-page-v2 .qv2-remain {
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.quiz-page-v2 .qv2-remain .sec {
  font-size: 26px;
}
.quiz-page-v2 .qv2-remain .unit {
  margin-left: 2px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}
.quiz-page-v2 .qv2-remain.is-ok {
  color: #2e7d32;
}
.quiz-page-v2 .qv2-remain.is-warn {
  color: #e08600;
}
.quiz-page-v2 .qv2-remain.is-bad {
  color: #c62828;
}
.quiz-page-v2 .qv2-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.quiz-page-v2 .qv2-bar > i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #e08600;
  transition: width 1s linear;
}
.quiz-page-v2 .qv2-bar > i.is-ok {
  background: #2e7d32;
}
.quiz-page-v2 .qv2-bar > i.is-warn {
  background: #e08600;
}
.quiz-page-v2 .qv2-bar > i.is-bad {
  background: #c62828;
}
@media (prefers-reduced-motion: reduce) {
  .quiz-page-v2 .qv2-bar > i {
    transition: none;
  }
}

/* ===== セクション見出し ===== */
.quiz-page-v2 .qv2-sec-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.quiz-page-v2 .qv2-sec-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}
.quiz-page-v2 .qv2-count {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  font-variant-numeric: tabular-nums;
}

/* ===== 駅ヒント ===== */
.quiz-page-v2 .qv2-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(24, 103, 192, 0.18);
  border-radius: 12px;
  background: rgba(24, 103, 192, 0.06);
}
.quiz-page-v2 .qv2-hint {
  padding: 9px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.87);
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.quiz-page-v2 .qv2-hint.pending {
  padding: 9px 14px;
  border-style: dashed;
  border-color: rgba(0, 0, 0, 0.2);
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.45);
  background: transparent;
  box-shadow: none;
}

/* ===== 解答候補 ===== */
.quiz-page-v2 .qv2-answers {
  display: grid;
  gap: 8px;
}
@media (min-width: 700px) {
  .quiz-page-v2 .qv2-answers {
    grid-template-columns: 1fr 1fr;
  }
}
.quiz-page-v2 .qv2-answer {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.quiz-page-v2 .qv2-answer:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.quiz-page-v2 .qv2-answer-name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  overflow-wrap: break-word;
}
.quiz-page-v2 .qv2-answer-tick {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  opacity: 0;
}
.quiz-page-v2 .qv2-answer.is-selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(24, 103, 192, 0.08);
}
.quiz-page-v2 .qv2-answer.is-selected .qv2-answer-name {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}
.quiz-page-v2 .qv2-answer.is-selected .qv2-answer-tick {
  opacity: 1;
}

/* ===== 下部固定バー ===== */
.quiz-page-v2 .qv2-bottom {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: 20px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.quiz-page-v2 .qv2-submit.v-btn {
  height: auto;
  min-height: var(--v-btn-height);
  padding-top: 10px;
  padding-bottom: 10px;
  font-weight: 700;
}
.quiz-page-v2 .qv2-submit .v-btn__content {
  white-space: normal;
  overflow-wrap: break-word;
  text-align: center;
  line-height: 1.3;
}
.quiz-page-v2 .qv2-note {
  margin: 8px 0 0;
  text-align: center;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
}
</style>
