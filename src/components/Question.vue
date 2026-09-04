<template>
  <v-container class="quiz-page">
    <v-row density="compact" v-show="!loading">
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <div class="text-label-medium mb-4">
              {{ quiz && '問題'+quiz.index }}
            </div>
            <v-list-item-title class="text-headline-small mb-1">
              以下の駅を含む路線は？
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col
        cols="6"
        v-show="candidates"
        v-for="(_obj, i) in candidates"
        :key="i"
      >
        <v-card>
          <v-list-item>
            <v-list-item-title
              class="text-headline-small mb-1 text-align-center"
              :class="{ 'font-color-gray': getRestTime(i) > 0 }"
            >
              {{ getQuestionItem(i) }}
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-row class="justify-center">
          <v-col cols="auto">
            <v-progress-circular
              :rotate="-90"
              :size="100"
              :model-value="100 - currentTime / startTime * 100"
              :width="10"
              :color="getTimerColor()"
            >
              <span class="currentTime">
                {{ currentTime }}
              </span>
            </v-progress-circular>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <div class="text-label-medium mb-4">
              解答
            </div>
          </v-list-item>
          <v-list-item>
            <div class="text-label-medium answer-instruction mb-4">
              以下の路線名をひとつ選択して解答ボタンを押してください。
            </div>
          </v-list-item>
          <v-list-item>
            <v-row class="justify-center" density="compact">
              <v-col
                cols="6"
                class="col-answer"
                v-for="(candidate, i) in (quiz ? quiz.candidates : [])"
                :key="i"
              >
                <v-btn
                  block
                  variant="outlined"
                  class="btn-answer"
                  :class="[
                    $vuetify.display.mobile ? 'text-label-large' : 'text-title-large',
                    { 'btn-answer-active': answer === i },
                  ]"
                  :height="$vuetify.display.mobile ? 80 : undefined"
                  @click="answer = i"
                >
                  <span class="btn-answer__row">
                    <span class="btn-answer__logo">
                      <LineLogo
                        :label="candidate"
                        :size="$vuetify.display.smAndUp ? 56 : 28"
                      />
                    </span>
                    <span class="btn-answer__name">{{ candidate }}</span>
                  </span>
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item>
          <v-list-item>
            <v-row class="justify-center">
              <v-col cols="auto">
                <v-btn
                  :disabled="answer == null || currentTime <= 0"
                  variant="flat"
                  size="large"
                  color="primary"
                  @click="complete"
                >
                  解答する
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item>
        </v-card>
      </v-col>
    </v-row>
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
  name: 'QuestionView',
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
.font-color-gray {
  color: #ccc;
}
.btn-answer {
  width: 100%;
  min-height: 68px;
  white-space: normal;
  background-color: white !important;
  color: rgba(0, 0, 0, 0.87) !important;
  border-color: rgba(0, 0, 0, 0.2);
}
.btn-answer.btn-answer-active {
  border: 4px solid red !important;
}
.btn-answer::before {
  opacity: 0;
}
/* v-btn の内容ラッパーを全幅にして「左：ロゴ／右：路線名」を成立させる */
.btn-answer .v-btn__content {
  width: 100%;
}
/* ロゴ:路線名 = 2:8 のグリッド */
.btn-answer__row {
  display: grid;
  grid-template-columns: 2fr 8fr;
  align-items: center;
  gap: 12px; /* ロゴと路線名の間隔 */
  width: 100%;
  padding: 6px 2px; /* ボタン内の上下余白 */
}
.btn-answer__logo {
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-answer__logo .line-logo {
  max-width: 100%;
  max-height: 28px; /* スマホ: 幅の狭い列でさらに小さくなる */
  width: auto;
  height: auto;
}
@media (min-width: 600px) {
  .btn-answer__logo .line-logo {
    max-height: 56px; /* PC・タブレット: 大きめ */
  }
}
.btn-answer__name {
  min-width: 0;
  text-align: left;
  white-space: normal;
  line-height: 1.3;
}
.col-answer {
  margin: 0;
}
.currentTime {
  font-size: 36px;
}

/*
 * PC 幅では「問題N」「解答」の見出しや操作説明文（text-label-medium = 12px）が
 * 小さく見えるため、≥960px でこのページのみ引き上げる（モバイルは据え置き）。
 * トップページ（Top.vue）と同じ 0.875rem に合わせる。
 */
@media (min-width: 960px) {
  .quiz-page .v-list-item .text-label-medium {
    font-size: 0.875rem;
  }
  /* 操作の説明文は見出しラベルより一段大きく（読ませる文のため） */
  .quiz-page .v-list-item .answer-instruction {
    font-size: 1rem;
    line-height: 1.7;
  }
}
</style>
