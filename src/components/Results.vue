<template>
  <v-container class="results-page">
    <v-row density="compact" v-if="results">
      <!-- サマリー: スコア・正解率・正誤ドット・各種時間を1枚に集約 -->
      <v-col cols="12">
        <v-card class="summary-card">
          <div class="summary-grid">
            <div class="score-box">
              <div class="score">
                {{ nCorrect }}<small> / {{ nQuiz }}</small>
              </div>
              <div class="rate">
                正解率 {{ rate }}%
              </div>
            </div>
            <div class="summary-right">
              <div class="result-strip">
                <span
                  v-for="(r, i) in results"
                  :key="i"
                  class="result-dot"
                  :class="r.correct ? 'is-ok' : 'is-bad'"
                >{{ r.correct ? '〇' : '×' }}</span>
              </div>
              <div class="summary-stats">
                <div class="stat">
                  <div class="stat-k">
                    かかった時間
                  </div>
                  <div class="stat-v">
                    {{ totalTime }}秒
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-k">
                    1問あたり平均
                  </div>
                  <div class="stat-v">
                    {{ avgTime }}秒
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-k">
                    難易度
                  </div>
                  <div class="stat-v">
                    {{ mode }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 正誤: 1問1カード。正解は路線を1つ、不正解は「あなた/正解」を対比表示 -->
      <v-col
        v-for="r in results"
        :key="r.id"
        cols="12"
        md="6"
      >
        <v-card class="qcard" :class="{ 'is-bad': !r.correct }">
          <div class="qcard-head">
            <span class="qcard-num">問題 {{ r.index }}</span>
            <span
              class="qcard-chip"
              :class="r.correct ? 'is-ok' : 'is-bad'"
            >
              {{ r.correct ? '正解' : '不正解' }}
            </span>
          </div>

          <template v-if="r.correct">
            <div class="qline">
              <LineLogo :label="r.answer" :size="30" />
              <span class="qline-name">{{ r.answer }}</span>
            </div>
          </template>
          <template v-else>
            <div class="qpick qpick--you">
              <span class="qpick-lab">あなた</span>
              <span class="qline">
                <LineLogo
                  v-if="r.select && r.select !== '(時間切れ)'"
                  :label="r.select"
                  :size="26"
                />
                <span v-else class="qline-logo-blank">–</span>
                <span class="qline-name">{{ r.select }}</span>
              </span>
            </div>
            <div class="qpick qpick--ans">
              <span class="qpick-lab">正解</span>
              <span class="qline">
                <LineLogo :label="r.answer" :size="26" />
                <span class="qline-name">{{ r.answer }}</span>
              </span>
            </div>
          </template>

          <div class="qcard-foot">
            解答時間 <span class="qcard-time">{{ r.time }}</span> 秒
          </div>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-row class="justify-center results-action-row" density="compact">
            <v-col cols="auto">
              <v-btn
                class="page-action-btn"
                variant="flat"
                size="large"
                color="primary"
                to="/"
              >
                最初に戻る
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                class="page-action-btn"
                variant="outlined"
                size="large"
                color="primary"
                @click="retrySameSettings"
              >
                同じ設定でもう一度
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useQuizStore } from '@/stores/quiz'
import LineLogo from './LineLogo.vue'

export default {
  name: 'ResultsView',
  components: { LineLogo },
  setup() {
    return { store: useQuizStore() }
  },
  data: () => ({
    results: null,
    nQuiz: 0,
    nCorrect: 0,
    totalTime: 0,
    mode: 'ふつう',
  }),
  computed: {
    rate() {
      return this.nQuiz ? Math.round((this.nCorrect / this.nQuiz) * 100) : 0
    },
    avgTime() {
      return this.nQuiz ? Math.round(this.totalTime / this.nQuiz) : 0
    },
  },
  mounted() {
    const res = this.store.completedResults
    if (!res) {
      this.$router.replace({ name: 'top' })
      return
    }
    this.nQuiz = res.length
    this.totalTime = 0
    for (const obj of res) {
      this.totalTime += obj.time
      if (obj.select.length === 0) obj.select = '(時間切れ)'
      if (obj.correct) this.nCorrect++
    }
    if (this.store.mode === 'hard') {
      this.mode = 'むずかしい'
    } else if (this.store.mode === 'easy') {
      this.mode = 'やさしい'
    } else {
      this.mode = 'ふつう'
    }
    this.results = res
  },
  methods: {
    // いま遊んだ難易度・問題数のままクイズを再生成して1問目へ
    retrySameSettings() {
      this.store.setMode(this.store.mode)
      this.store.setNumberOfQuiz(this.store.nQuiz)
      this.store.initialize()
      this.$router.replace({
        name: 'quiz',
        params: { id: this.store.firstQuiz.id },
      })
    },
  },
}
</script>

<style>
/* ===== 最下部の操作ボタン（最初に戻る / 同じ設定でもう一度） =====
 * 各ボタンは .page-action-btn（上下 30px マージン）と、
 * app.css の .v-col--cols-auto（上下 12px パディング）を持つため、
 * モバイルで折り返して2行になると (30+12)*2 = 84px もの隙間ができてしまう。
 * ここではボタン単体のマージン／コルのパディングを打ち消し、
 * ボタン間の余白は row-gap に一本化し、行全体の外側マージンだけ残す。 */
.results-page .results-action-row {
  row-gap: 16px;
  margin-top: 30px;
  margin-bottom: 30px;
}
.results-page .results-action-row .v-col--cols-auto {
  padding-top: 0;
  padding-bottom: 0;
}
.results-page .results-action-row .page-action-btn {
  margin-top: 0;
  margin-bottom: 0;
}

/* ===== サマリーカード ===== */
.results-page .summary-card {
  padding: 20px 24px;
}
.results-page .summary-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: center;
}
@media (max-width: 560px) {
  .results-page .summary-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
.results-page .score-box {
  text-align: center;
}
.results-page .score {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.results-page .score small {
  font-size: 0.42em;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}
.results-page .rate {
  margin-top: 6px;
  font-weight: 700;
  color: #2e7d32;
}
.results-page .summary-right {
  min-width: 0;
}
.results-page .result-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.results-page .result-dot {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
}
.results-page .result-dot.is-ok {
  background: #2e7d32;
}
.results-page .result-dot.is-bad {
  background: #c62828;
}
.results-page .summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 32px;
}
.results-page .stat-k {
  font-size: 11px;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.6);
}
.results-page .stat-v {
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ===== 正誤カード ===== */
.results-page .qcard {
  position: relative;
  height: 100%;
  padding: 14px 16px 12px 22px;
  overflow: hidden;
}
.results-page .qcard::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #2e7d32;
}
.results-page .qcard.is-bad::before {
  background: #c62828;
}
.results-page .qcard.is-bad {
  background: #fbeae9;
}
.results-page .qcard-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.results-page .qcard-num {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.6);
}
.results-page .qcard-chip {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 11px;
  border-radius: 999px;
}
.results-page .qcard-chip.is-ok {
  background: #e8f3e9;
  color: #2e7d32;
}
.results-page .qcard-chip.is-bad {
  background: rgba(198, 40, 40, 0.14);
  color: #c62828;
}
.results-page .qline {
  display: flex;
  align-items: center;
  gap: 10px;
}
.results-page .qline-name {
  font-size: 15px;
  font-weight: 500;
}
.results-page .qline-logo-blank {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px dashed rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.5);
}
.results-page .qpick {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 4px 10px;
  align-items: center;
}
.results-page .qpick + .qpick {
  margin-top: 8px;
}
.results-page .qpick-lab {
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  color: rgba(0, 0, 0, 0.6);
}
.results-page .qpick--you .qline-name {
  color: #c62828;
}
.results-page .qpick--ans .qline-name {
  color: #2e7d32;
  font-weight: 700;
}
.results-page .qcard-foot {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}
.results-page .qcard-time {
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  font-variant-numeric: tabular-nums;
}
.results-page .qcard.is-bad .qcard-foot {
  border-top-color: rgba(198, 40, 40, 0.2);
}
</style>
