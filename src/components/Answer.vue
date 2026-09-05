<template>
  <!-- data-ui-* は画面と解答結果を表す目印 -->
  <v-container
    class="answer-page"
    data-ui-screen="answer"
    :data-ui-difficulty="store.mode"
    :data-ui-question-index="result && result.index"
    :data-ui-is-correct="result && result.correct"
    :data-ui-answer-time="result && result.time"
    :data-ui-timeout="result ? !result.select : null"
    :data-ui-has-next="result ? !!result.next : null"
  >
    <div v-if="result" class="answer">
      <!-- 判定バナー: 正誤・自分の解答（不正解時）・正解・解答時間 -->
      <v-card class="verdict" :class="getCorrect() ? 'is-ok' : 'is-bad'">
        <div class="verdict-head">
          <span class="verdict-mark">{{ getCorrect() ? '○' : '✕' }}</span>
          <span class="verdict-title">{{ getCorrect() ? '正解！' : '不正解' }}</span>
        </div>

        <div v-if="getCorrect()" class="verdict-line">
          <LineLogo :label="getAnswer()" :size="40" />
          <span class="verdict-line-name">{{ getAnswer() }}</span>
        </div>
        <template v-else>
          <!-- モバイルは 2 段、PC は左右 2 カラムで余白を使い切る -->
          <div class="verdict-picks">
            <div class="verdict-pick is-you">
              <span class="verdict-pick-label">あなたの解答</span>
              <span class="verdict-line">
                <LineLogo
                  v-if="getSelect()"
                  :label="getSelect()"
                  :size="28"
                />
                <span v-else class="verdict-logo-blank">–</span>
                <span class="verdict-line-name sm">{{ getSelect() || '(時間切れ)' }}</span>
              </span>
            </div>
            <div class="verdict-pick is-ans">
              <span class="verdict-pick-label">正解</span>
              <span class="verdict-line">
                <LineLogo :label="getAnswer()" :size="28" />
                <span class="verdict-line-name">{{ getAnswer() }}</span>
              </span>
            </div>
          </div>
        </template>

        <div class="verdict-foot">
          解答時間 <span class="verdict-time">{{ result.time }}</span> 秒
        </div>
      </v-card>

      <!-- 路線内の駅（最初から表示。ヒントに出た駅を強調） -->
      <v-card>
        <div class="stations-panel">
          <div class="stations-head">
            <span class="stations-title">路線内の駅</span>
            <span class="stations-note">色付きはヒントに出た駅</span>
          </div>
          <v-timeline side="end" class="stations-timeline">
            <v-timeline-item
              v-for="(obj, i) in getStations()"
              :key="i"
              :size="isHint(obj) ? 'large' : 'default'"
              :dot-color="dotColor"
              icon="mdi-train"
              :icon-color="iconColor"
            >
              <template #opposite>
                <span :class="{ 'station-candidate': isHint(obj) }">
                  {{ obj }}
                </span>
              </template>
              <span v-if="isHint(obj)" class="station-hint-badge">ヒント</span>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-card>

      <!-- 次へ: quiz 画面と同じ sticky 方式（下端に張り付き、最下部で通常位置に収まる） -->
      <div class="answer-next">
        <v-btn
          block
          variant="flat"
          size="large"
          color="primary"
          class="answer-next-btn"
          data-ui-action="next_from_answer"
          :data-ui-value="result && result.next ? 'next_question' : 'results'"
          @click="goNext"
        >
          {{ result.next ? '次の問題へ' : '結果' }}
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<script>
import { useQuizStore } from '@/stores/quiz'
import LineLogo from './LineLogo.vue'

export default {
  name: 'AnswerView',
  components: { LineLogo },
  setup() {
    return { store: useQuizStore() }
  },
  data: () => ({
    result: null,
  }),
  computed: {
    // 路線カラー #RRGGBB（無ければ null）
    lineColor() {
      return (this.result && this.store.lineColor(this.result.answer)) || null
    },
    // タイムラインのドット色（路線カラー。無ければテーマ primary）
    dotColor() {
      return this.lineColor || 'primary'
    },
    // ドット色に対して読めるアイコン色（明るい路線カラーなら黒）
    iconColor() {
      const c = this.lineColor
      if (!c) return 'white'
      const n = parseInt(c.slice(1), 16)
      const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
      return lum > 0.6 ? 'black' : 'white'
    },
  },
  created() {
    if (!this.getResult()) {
      this.$router.replace({ name: 'top' })
    }
  },
  methods: {
    getResult() {
      if (!this.result) {
        this.result = this.store.resultById(this.$route.params.id)
      }
      return this.result
    },
    getAnswer() {
      return this.getResult().answer
    },
    // 自分が選んだ路線ラベル（時間切れは '' なので falsy）
    getSelect() {
      return this.getResult().select
    },
    getStations() {
      return this.getResult().stations
    },
    getCandidates() {
      return this.getResult().candidates
    },
    getCorrect() {
      return this.getResult().correct
    },
    isHint(station) {
      return this.getCandidates().includes(station)
    },
    goNext() {
      if (this.getResult().next) {
        this.$router.replace({
          name: 'quiz',
          params: { id: this.getResult().next },
        })
      } else {
        this.$router.replace({ name: 'results' })
      }
    },
  },
}
</script>

<style>
/* ===== 判定バナー ===== */
.answer-page .verdict {
  position: relative;
  padding: 18px 20px 18px 24px;
  overflow: hidden;
}
.answer-page .verdict::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
}
.answer-page .verdict.is-ok::before {
  background: #2e7d32;
}
.answer-page .verdict.is-bad::before {
  background: #c62828;
}
.answer-page .verdict-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.answer-page .verdict-mark {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}
.answer-page .verdict.is-ok .verdict-mark {
  background: #2e7d32;
}
.answer-page .verdict.is-bad .verdict-mark {
  background: #c62828;
}
.answer-page .verdict-title {
  font-size: 20px;
  font-weight: 700;
}
.answer-page .verdict.is-ok .verdict-title {
  color: #2e7d32;
}
.answer-page .verdict.is-bad .verdict-title {
  color: #c62828;
}
.answer-page .verdict-line {
  display: flex;
  align-items: center;
  gap: 10px;
}
.answer-page .verdict-line-name {
  font-size: 20px;
  font-weight: 700;
}
.answer-page .verdict-line-name.sm {
  font-size: 15px;
  font-weight: 500;
}
.answer-page .verdict-pick {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 4px 12px;
  align-items: center;
}
.answer-page .verdict-pick + .verdict-pick {
  margin-top: 8px;
}
.answer-page .verdict-pick-label {
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  color: rgba(0, 0, 0, 0.6);
}
.answer-page .verdict-pick.is-you .verdict-line-name {
  color: #c62828;
}
/* 正解だったときの路線名も緑で示す */
.answer-page .verdict.is-ok .verdict-line-name {
  color: #2e7d32;
}
.answer-page .verdict-pick.is-ans .verdict-line-name {
  font-size: 18px;
  font-weight: 700;
  color: #2e7d32;
}
.answer-page .verdict-logo-blank {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px dashed rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.5);
}
/*
 * PC（十分な横幅がある場合）は「あなたの解答」「正解」を左右 2 カラムに並べ、
 * ラベルを名前の上に置いて路線名を大きく見せる。モバイルは従来どおり 2 段。
 */
@media (min-width: 600px) {
  .answer-page .verdict-picks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .answer-page .verdict-pick {
    grid-template-columns: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 2px 0;
  }
  .answer-page .verdict-pick + .verdict-pick {
    margin-top: 0;
  }
  /* PC は正解を左、あなたの解答を右（DOM 順は変えずモバイルの縦並びは維持） */
  .answer-page .verdict-pick.is-ans {
    order: 1;
  }
  .answer-page .verdict-pick.is-you {
    order: 2;
    padding-left: 24px;
    border-left: 1px solid rgba(0, 0, 0, 0.12);
  }
  .answer-page .verdict-pick-label {
    text-align: left;
  }
  .answer-page .verdict-line-name.sm {
    font-size: 18px;
  }
  .answer-page .verdict-pick.is-ans .verdict-line-name {
    font-size: 22px;
  }
}
.answer-page .verdict-foot {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}
.answer-page .verdict-time {
  font-size: 18px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  font-variant-numeric: tabular-nums;
}

/* ===== 路線内の駅 ===== */
.answer-page .stations-panel {
  padding: 20px 22px;
}
.answer-page .stations-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}
.answer-page .stations-title {
  font-size: 16px;
  font-weight: 700;
}
.answer-page .stations-note {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
/*
 * side 指定タイムラインは opposite 列と body 列の幅が不揃いでドットが
 * 中央からずれる。両列を等幅にして中央寄せに戻す（現行の調整を踏襲）。
 */
.answer-page .stations-timeline.v-timeline--vertical {
  grid-template-columns: 1fr auto 1fr;
}
/* 出題に使われた駅は大きく表示 */
.answer-page .stations-timeline .station-candidate {
  font-size: x-large;
  font-weight: 700;
}
/* セクション間の余白 */
.answer-page .answer > * + * {
  margin-top: 16px;
}

/* ===== 次へ（下部 sticky。quiz 画面の下部バーと同じ挙動） ===== */
.answer-page .answer-next {
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.answer-page .answer-next-btn.v-btn {
  font-weight: 700;
}

.answer-page .station-hint-badge {
  display: inline-block;
  padding: 2px 7px;
  border: 1px solid rgba(24, 103, 192, 0.4);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  vertical-align: middle;
}
</style>
