<template>
  <v-container>
    <v-row density="compact" v-if="result">
      <v-col cols="12" v-show="!getCorrect()">
        <v-row class="justify-center">
          <v-col cols="auto">
            <v-icon :size="250" color="red" icon="mdi-close"></v-icon>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" v-show="getCorrect()">
        <v-row class="justify-center">
          <v-col cols="auto">
            <v-icon :size="200" color="green" icon="mdi-circle-outline"></v-icon>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center">
              答え
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-title class="text-headline-small mb-1 text-align-center font-color-green">
              {{ getAnswer() }}
            </v-list-item-title>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title class="pa-0">
                <span class="text-headline-small mb-1 text-align-center font-color-green stations-panel-title">
                  路線内の駅
                </span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-timeline side="end" class="stations-timeline">
                  <v-timeline-item
                    v-for="(obj, i) in getStations()"
                    :key="i"
                    :size="getCandidates().includes(obj) ? 'large' : 'default'"
                    dot-color="primary"
                    icon="mdi-train"
                    icon-color="white"
                  >
                    <template #opposite>
                      <span :class="{ 'station-candidate': getCandidates().includes(obj) }">
                        {{ obj }}
                      </span>
                    </template>
                  </v-timeline-item>
                </v-timeline>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
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
                {{ result.next ? '次の問題へ' : '結果' }}
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
  name: 'AnswerView',
  setup() {
    return { store: useQuizStore() }
  },
  data: () => ({
    result: null,
  }),
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
    getStations() {
      return this.getResult().stations
    },
    getCandidates() {
      return this.getResult().candidates
    },
    getCorrect() {
      return this.getResult().correct
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
/*
 * Vuetify 4 の v-expansion-panel-title は flex レイアウトで、
 * タイトルの span が内容幅に縮むため text-align:center が効かない。
 * span を伸ばして「路線内の駅」を中央寄せにする（旧サイト相当）。
 */
.stations-panel-title {
  flex: 1 1 auto;
}

/*
 * Vuetify 4 の side 指定タイムラインは opposite 列と body 列の幅が不揃いで
 * ドット（路線の線）が中央からずれる。両列を等幅にして中央寄せに戻す
 * （旧サイト = Vuetify 2 の見た目）。
 */
.stations-timeline.v-timeline--vertical {
  grid-template-columns: 1fr auto 1fr;
}

/* 出題に使われた駅は大きく表示 */
.stations-timeline .station-candidate {
  font-size: x-large;
}
</style>
