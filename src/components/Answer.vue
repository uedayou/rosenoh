<template>
  <v-container>
    <v-row dense>
      <v-col cols="12" v-show="!getCorrect()">
        <v-row justify="center">
          <v-col cols="auto">
            <v-icon size="250" color="red">mdi-close</v-icon>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" v-show="getCorrect()">
        <v-row justify="center">
          <v-col cols="auto">
            <v-icon size="200" color="green">mdi-circle-outline</v-icon>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center">
                答え
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center font-color-green">
                {{ getAnswer() }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-header style="padding:0">
                <span class="headline mb-1 text-align-center font-color-green">
                  路線内の駅
                </span>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-timeline>
                  <v-timeline-item 
                    v-for="(obj,i) in getStations()"
                    :key="i"
                    :large="getCandidates().includes(obj)"
                    right
                    icon="mdi-train">
                    <span slot="opposite"
                      :style="{'font-size':getCandidates().includes(obj)?'x-large':'normal'}">
                      {{ obj }}
                    </span>
                  </v-timeline-item>
                </v-timeline>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-row justify="center">
            <v-col cols="auto">
              <v-btn class="btn-go-next"
                depressed large color="primary"
                @click="goNext">
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
export default {
  name: 'Answer',
  data: () => ({
    result: null
  }),
  mounted() {
    if (!this.getResult())
      this.$router.replace({ name: "top" });
  },
  methods: {
    getResult: function() {
      if (!this.result) {
        this.result = this.$store.getters.getResultById(this.$route.params.id);
      }
      return this.result;
    },
    getAnswer: function() {
      return this.getResult().answer;
    },
    getStations: function() {
      return this.getResult().stations;
    },
    getCandidates: function() {
      return this.getResult().candidates;
    },
    getCorrect: function() {
      return this.getResult().correct;
    },
    goNext: function() {
      if (this.getResult().next) {
        this.$router.replace({
          name: "quiz",
          params: {
            id: this.getResult().next
          }
        });
      } else {
        this.$router.replace({ name: "results" });
      }
    }
  }
}
</script>

<style>
.text-align-center {
  text-align:center
}
.font-color-green {
  color:green
}
.btn-go-next {
  margin-top:30px;
  margin-bottom:30px;
}
</style>