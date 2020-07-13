<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center font-color-green">
                結果
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center">
                {{ nQuiz }}問中{{ nCorrect }}問正解しました。
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center">
                かかった時間：{{ totalTime }} 秒
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center">
                難易度：{{ mode }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-data-table
            :headers="headers"
            :items="results || []"
            disable-sort
            hide-default-footer>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-row justify="center">
            <v-col cols="auto">
              <v-btn style="margin-top:30px;margin-bottom:30px"
                depressed large color="primary" to="/">
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
export default {
  name: 'Results',
  data: () => ({
    headers: [
      { text: '問題', align: 'start', value: 'index' },
      { text: '正誤', value: "correctness" },
      { text: '回答', value: 'select' },
      { text: '正解', value: 'label' },
      { text: '回答時間', value: 'stime' },
    ],
    results: null,
    nQuiz: 0,
    nCorrect: 0,
    totalTime: 0,
    mode: "ふつう",
  }),
  mounted() {
    let res = this.$store.getters.getResults;
    if (!res) {
      this.$router.replace({ name: "top" });
    }
    this.nQuiz = res.length;
    this.totalTime = 0;
    for (let obj of res) {
      obj.correctness = obj.correct?"〇":"×";
      this.totalTime += obj.time;
      if (obj.select.length===0) obj.select = "(時間切れ)";
      obj.stime = obj.time+"秒"
      if (obj.correct) this.nCorrect++;
    }
    if (this.$store.getters.getMode=="hard") {
      this.mode = "むずかしい";
    } else if (this.$store.getters.getMode=="easy") {
      this.mode = "やさしい";
    } else {
      this.mode = "ふつう";
    }
    this.results = res;
  },
}
</script>

<style>
.text-align-center {
  text-align:center
}
.font-color-green {
  color:green
}
</style>