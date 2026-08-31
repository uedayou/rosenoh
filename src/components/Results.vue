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
          ></v-data-table>
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

export default {
  name: 'ResultsView',
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
