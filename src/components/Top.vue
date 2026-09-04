<template>
  <v-container class="top-page">
    <v-row density="compact">
      <!-- ヒーロー: バナー＋1文の説明＋出題対象のスタッツ -->
      <v-col cols="12">
        <div class="hero-card">
          <img
            :src="ogpImg"
            alt="路線王 — 駅名リストから路線名を当てろ！"
            class="hero-img"
          >
          <div class="hero-body">
            <p class="hero-lead">
              駅名の候補だけを見て、日本のどの鉄道路線かを当てるクイズゲーム。制限時間内に路線名を選んで解答しよう。
            </p>
            <div class="hero-stats">
              <span class="stat-chip">出題対象 <b>{{ store.lines.length }}</b> 路線</span>
              <span class="stat-chip">1プレイ <b>4〜10</b> 問</span>
            </div>
          </div>
        </div>
      </v-col>

      <!-- 遊び方 3ステップ -->
      <v-col cols="12">
        <div class="top-steps">
          <div class="step-card">
            <span class="step-n">1</span>
            <p>表示される駅名ヒントを見る（時間とともに増える）</p>
          </div>
          <div class="step-card">
            <span class="step-n">2</span>
            <p>8つの候補から路線を1つ選ぶ</p>
          </div>
          <div class="step-card">
            <span class="step-n">3</span>
            <p>制限時間内に「解答する」を押す</p>
          </div>
        </div>
      </v-col>

      <!-- 難易度: 制限時間・ヒント駅数つきの選択カード -->
      <v-col cols="12">
        <v-card>
          <div class="setup-panel">
            <div class="panel-label">
              難易度
            </div>
            <div class="diff-cards">
              <button
                v-for="opt in store.modeOptions"
                :key="opt.key"
                type="button"
                class="diff-card"
                :class="{ 'is-selected': mode === opt.key }"
                @click="mode = opt.key"
              >
                <span class="diff-check">選択中</span>
                <span class="diff-name">{{ opt.label }}</span>
                <span class="diff-spec"><span>制限時間</span><b>{{ opt.answerTime }}秒</b></span>
                <span class="diff-spec"><span>ヒント駅数</span><b>最大{{ opt.nCandidate }}駅</b></span>
              </button>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 問題数: パネル幅いっぱいの3等分セグメント -->
      <v-col cols="12">
        <v-card>
          <div class="setup-panel">
            <div class="panel-label">
              問題数
            </div>
            <div class="count-seg">
              <button
                v-for="n in numChoices"
                :key="n"
                type="button"
                :class="{ 'is-selected': num === n }"
                @click="num = n"
              >
                {{ n }}問
              </button>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 開始 -->
      <v-col cols="12">
        <v-card>
          <div class="setup-panel">
            <v-btn
              block
              size="x-large"
              class="start-btn"
              @click="goNext"
            >
              クイズ開始
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useQuizStore } from '@/stores/quiz'

// public/images/ogp.jpg（バンドルせず配信、GitHub Pages の相対パス配信に対応）
const ogpImg = `${import.meta.env.BASE_URL}images/ogp.jpg`

export default {
  name: 'TopView',
  setup() {
    return { store: useQuizStore(), ogpImg }
  },
  data: () => ({
    mode: 'normal',
    num: '6',
    numChoices: ['4', '6', '10'],
  }),
  methods: {
    goNext() {
      this.store.setMode(this.mode)
      this.store.setNumberOfQuiz(this.num)
      this.store.initialize()
      const quiz = this.store.firstQuiz
      this.$router.replace({
        name: 'quiz',
        params: { id: quiz.id },
      })
    },
  },
}
</script>

<style>
/* ===== ヒーロー ===== */
.top-page .hero-card {
  background: linear-gradient(135deg, #1e73cf 0%, #0e4c9a 100%);
  border-radius: 12px;
  padding: 14px;
  overflow: hidden;
}
.top-page .hero-img {
  display: block;
  width: 100%;
  border-radius: 8px;
  aspect-ratio: 1416 / 743;
  object-fit: cover;
}
.top-page .hero-body {
  padding: 16px 10px 6px;
  color: #fff;
}
.top-page .hero-lead {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.75;
  opacity: 0.95;
}
.top-page .hero-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.top-page .stat-chip {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}
.top-page .stat-chip b {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

/* ===== 遊び方 3ステップ ===== */
.top-page .top-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 560px) {
  .top-page .top-steps {
    grid-template-columns: 1fr;
  }
}
.top-page .step-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(20, 30, 45, 0.06), 0 6px 18px rgba(20, 30, 45, 0.07);
  padding: 14px 16px;
}
.top-page .step-n {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1867c0;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  margin-bottom: 8px;
}
.top-page .step-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

/* ===== 設定パネル ===== */
.top-page .setup-panel {
  padding: 22px;
}
.top-page .panel-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
}
.top-page .panel-label::before {
  content: "";
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: #1867c0;
}

/* 難易度カード */
.top-page .diff-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
@media (max-width: 560px) {
  .top-page .diff-cards {
    grid-template-columns: 1fr;
  }
}
.top-page .diff-card {
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  padding: 14px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}
.top-page .diff-card.is-selected {
  border-color: #1867c0;
  background: rgba(24, 103, 192, 0.08);
}
.top-page .diff-card:focus-visible {
  outline: 2px solid #1867c0;
  outline-offset: 2px;
}
.top-page .diff-name {
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 700;
}
.top-page .diff-card.is-selected .diff-name {
  color: #1867c0;
}
.top-page .diff-spec {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}
.top-page .diff-spec b {
  color: rgba(0, 0, 0, 0.87);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.top-page .diff-check {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1867c0;
  opacity: 0;
}
.top-page .diff-card.is-selected .diff-check {
  opacity: 1;
}

/* 問題数セグメント */
.top-page .count-seg {
  display: flex;
  width: 100%;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  overflow: hidden;
}
.top-page .count-seg button {
  flex: 1;
  appearance: none;
  border: 0;
  border-right: 2px solid rgba(0, 0, 0, 0.12);
  padding: 13px 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.6);
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}
.top-page .count-seg button:last-child {
  border-right: 0;
}
.top-page .count-seg button.is-selected {
  background: #1867c0;
  color: #fff;
}
.top-page .count-seg button:focus-visible {
  outline: 2px solid #1867c0;
  outline-offset: -2px;
}

/* 開始ボタン */
.top-page .start-btn.v-btn {
  background: #ffc21a;
  color: #6b4300;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.14);
}
</style>
