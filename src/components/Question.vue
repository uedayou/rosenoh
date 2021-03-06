<template>
  <v-container>
    <v-row dense v-show="!loading">
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <div class="overline mb-4">
                {{ quiz && '問題'+quiz.index }}
              </div>
              <v-list-item-title class="headline mb-1">
                以下の駅を含む路線は？
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col 
        cols="6"
        v-show="candidates"
        v-for="(obj,i) in candidates"
        :key="i"
        >
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title
                class="headline mb-1 text-align-center"
                :class="{'font-color-gray': getRestTime(i)>0 }">
                {{ getQuestionItem(i) }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-row justify="center">
          <v-col
            cols="auto"
          >
            <v-progress-circular
              rotate="-90"
              size="100"
              :value="100-currentTime/startTime*100"
              width="10"
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
            <div class="overline mb-4">
              解答
            </div>
          </v-list-item>
          <v-list-item>
            <div class="overline mb-4">
              以下の路線名をひとつ選択して解答ボタンを押してください。
            </div>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-btn-toggle
                v-model="answer">
                <v-row justify="center">
                  <v-col 
                    cols="6"
                    class="col-answer"
                    v-for="(candidate,i) in quiz?quiz.candidates:[]"
                    :key="i"
                  >
                    <v-btn class="btn-answer" :class="{
                        'title': !$vuetify.breakpoint.mobile,
                        'button': $vuetify.breakpoint.mobile
                      }"
                      active-class="btn-answer-active"
                      style="white-space:normal;display:table-cell;"
                      :style="{
                        height: $vuetify.breakpoint.mobile ? '80px' : ''
                      }">
                      {{ candidate }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-btn-toggle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn 
                    :disabled="answer == null || currentTime <= 0"
                    depressed large color="primary"
                    @click="complete">
                    解答する
                  </v-btn>
                </v-col>
              </v-row>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" persistent max-width="290">
      <v-card>
        <v-card-title class="headline justify-center">
          解答終了
        </v-card-title>
        <v-spacer></v-spacer>
        <v-card-actions class="justify-center">
          <v-btn depressed large color="primary" @click="goAnswerPage">
            正解は？
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-overlay v-show="loading">
      <v-progress-circular
        indeterminate
        color="white">
      </v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script>
import axios from "axios";
import url from 'url';

export default {
  name: 'Question',
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
  mounted: function() {
    if (this.$route.params.id) {
      this.startTime = this.$store.getters.getAnswerTime;
      this.getQuiz(this.$route.params.id);
    }
  },
  methods: {
    getQuiz: async function(id) {
      this.loading = true;
      this.quiz = this.$store.getters.getQuizById(id);
      if (!this.quiz) {
        alert("Error!");
        this.$router.replace({ name: "top" });
        return;
      }
      this.line = this.quiz.answer;
      const url = "https://uedayou.net/jrslod/"+this.line;
      let res = await axios.get(url+".json");
      this.stations = getLineStations(res.data, url);
      this.candidates = this.getCandidates([...this.stations]);
      this.loading = false;
      this.currentTime = this.startTime;
      this.start();
    },
    getCandidates: function(stations) {
      const num = this.$store.getters.getNumberOfCandidate;
      let candidates = [];
      for (let i=0;i<num;i++) {
        const index = Math.floor(Math.random()*stations.length);
        candidates.push(stations[index]);
        stations.splice(index, 1);
      }
      return candidates;
    },
    count: function() {
      if(this.currentTime === 0) {
        this.complete();
      } else {
        this.currentTime--;
      }
    },
    start: function() {
      this.timerObj = setInterval(()=>{this.count()}, 1000)
    },
    stop: function() {
      clearInterval(this.timerObj);
    },
    complete: function() {
      this.stop();
      this.setResult();
      this.dialog = true;
    },
    goAnswerPage: function() {
      this.dialog = false;
      this.$router.replace({
        name: "answer",
        params: {
          id: this.$route.params.id
        }
      });
    },
    setResult: function() {
      this.$store.commit("setResult", {
        ...this.quiz,
        stations: this.stations,
        candidates: this.candidates,
        select: this.quiz.candidates[this.answer]||"",
        correct: this.quiz.candidates[this.answer]===this.line,
        time: this.startTime-this.currentTime,
      });
    },
    getRestTime: function(number) {
      const time = this.startTime-this.displayTime*number;
      return this.currentTime-time;
    },
    getQuestionItem: function(number) {
      if (this.candidates == null) return "";
      const time = this.getRestTime(number);
      if (time>0) {
        return time+"秒後";
      }
      return this.candidates[number];
    },
    getTimerColor: function() {
      const time = this.startTime/4;
      if (this.currentTime<=time) {
        return "red";
      } else if (this.currentTime<=time*2) {
        return "yellow";
      }
      return "green";
    }
  }
}

const getLineStations = (data, uri) => {
  const obj = data[uri]["http://purl.org/dc/terms/relation"];
  let bnodes = [];
  for (const v of obj) bnodes.push(v.value);
  let stations = [];
  for (const bnUri of bnodes) {
    const bn = data[bnUri];
    for (const st of bn["http://purl.org/dc/terms/hasPart"]) {
      const pathname = url.parse(st.value).pathname;
      const matches = pathname.match(/^\/([^/]+?)\/([^/]+?)\/([^/]+?)\/(.+$)/i);
      if (matches.length===5) {
        stations.push(matches[4]);
      }
    }
  }
  return stations;
}

</script>

<style>
.text-align-center {
  text-align:center
}
.font-color-gray {
  color:#ccc
}
.btn-answer {
  width:100%;
  background-color:white !important;
}
.theme--light.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.btn-answer-active {
  border: 4px solid red !important;
}
.btn-answer:before,
.v-btn:not(.v-btn--text):not(.v-btn--outlined):hover:before,
.theme--light.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.btn-answer-active:before {
  opacity: 0;
}

.col-answer {
  margin:0;
}
.currentTime {
  font-size:36px;
}
</style>