<template>
  <v-container>
    <v-row density="compact">
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center font-color-green">
              結果
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center">
              {{ nQuiz }}問中{{ nCorrect }}問正解しました。
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center">
              かかった時間：{{ totalTime }} 秒
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center">
              難易度：{{ mode }}
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-data-table
            :headers="headers"
            :items="results || []"
            :items-per-page="-1"
            hide-default-footer
          >
            <template #[`item.select`]="{ item }">
              <span class="cell-line">
                <LineLogo
                  v-if="item.select && item.select !== '(時間切れ)'"
                  :label="item.select"
                  :size="36"
                />
                <span>{{ item.select }}</span>
              </span>
            </template>
            <template #[`item.answer`]="{ item }">
              <span class="cell-line">
                <LineLogo :label="item.answer" :size="36" />
                <span>{{ item.answer }}</span>
              </span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-row class="justify-center">
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
    headers: [
      { title: '問題', align: 'start', key: 'index', sortable: false },
      { title: '正誤', key: 'correctness', sortable: false },
      { title: '解答', key: 'select', sortable: false },
      { title: '正解', key: 'answer', sortable: false },
      { title: '解答時間', key: 'stime', sortable: false },
    ],
    results: null,
    nQuiz: 0,
    nCorrect: 0,
    totalTime: 0,
    mode: 'ふつう',
  }),
  mounted() {
    const res = this.store.completedResults
    if (!res) {
      this.$router.replace({ name: 'top' })
      return
    }
    this.nQuiz = res.length
    this.totalTime = 0
    for (const obj of res) {
      obj.correctness = obj.correct ? '〇' : '×'
      this.totalTime += obj.time
      if (obj.select.length === 0) obj.select = '(時間切れ)'
      obj.stime = obj.time + '秒'
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
}
</script>

<style>
/* PC: ロゴ左・路線名右の横並び（セル内は左寄せでよい） */
.cell-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
/* モバイル・タブレット: ロゴを路線名の上に縦積みし、セル幅いっぱいで中央寄せ */
@media (max-width: 959.98px) {
  .cell-line {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 2px;
    text-align: center;
  }
}
</style>
