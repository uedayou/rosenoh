<template>
  <v-container>
    <v-row density="compact">
      <v-col cols="12">
        <v-card>
          <v-row class="justify-center">
            <v-col cols="12" class="pa-0">
              <v-img :src="ogpImg" alt="路線王" />
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <v-col cols="auto">
              <v-card-text class="top-narrow">
                <div>
                  鉄道駅名の候補だけを見て、日本のどの鉄道路線かを当てるクイズゲームアプリです。
                </div>
                <div>
                  現在、{{ store.lines.length }} の鉄道路線からクイズが出題されます。
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <div class="text-label-medium text-align-center">
              難易度
            </div>
            <v-radio-group
              v-model="mode"
              inline
              color="primary"
              class="center-radio-group"
            >
              <v-radio label="かんたん" value="easy"></v-radio>
              <v-radio label="ふつう" value="normal"></v-radio>
              <v-radio label="むずかしい" value="hard"></v-radio>
            </v-radio-group>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <div class="text-label-medium text-align-center">
              問題数
            </div>
            <v-radio-group
              v-model="num"
              inline
              color="primary"
              class="center-radio-group"
            >
              <v-radio label="3問" value="3"></v-radio>
              <v-radio label="5問" value="5"></v-radio>
              <v-radio label="10問" value="10"></v-radio>
            </v-radio-group>
          </v-list-item>
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
                @click="goNext"
              >
                クイズ開始
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

// public/images/ogp.jpg（バンドルせず配信、GitHub Pages の相対パス配信に対応）
const ogpImg = `${import.meta.env.BASE_URL}images/ogp.jpg`

export default {
  name: 'TopView',
  setup() {
    return { store: useQuizStore(), ogpImg }
  },
  data: () => ({
    mode: 'normal',
    num: '5',
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
/* ロゴ・説明文の横幅を旧サイト同様 400px に制限 */
.top-narrow {
  max-width: 400px;
}

/*
 * Vuetify 4 の inline ラジオ群はデフォルトで左寄せ・項目間の余白なし。
 * 旧 Vuetify 2 のように中央寄せ＋項目間に余白を付ける。
 */
.center-radio-group .v-selection-control-group--inline {
  justify-content: center;
  gap: 4px 20px;
  flex-wrap: wrap;
}
</style>
