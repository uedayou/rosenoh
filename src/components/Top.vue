<template>
  <v-container>
    <v-row dense>
      <v-col cols="12">
        <v-card>
          <v-row justify="center">
            <v-col cols="auto">
              <v-img src="../assets/rosenoh.jpg"
                height="200px"
                style="max-width:400px"></v-img>
            </v-col>
          </v-row>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="headline mb-1 text-align-center">
                路線王
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-row justify="center">
            <v-col cols="auto">
              <v-card-text style="max-width:400px">
                <div>
                鉄道駅名の候補だけを見て、日本のどの鉄道路線かを当てるクイズゲームアプリです。
                </div>
                <div>
                現在、{{ $store.getters.getData.length }} の鉄道路線からクイズが出題されます。
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <div class="overline text-align-center">
                難易度
              </div>
              <v-radio-group v-model="mode" row dense style="margin:0 auto;">
                <v-radio label="かんたん" value="easy"></v-radio>
                <v-radio label="ふつう" value="normal"></v-radio>
                <v-radio label="むずかしい" value="hard"></v-radio>
              </v-radio-group>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-list-item>
            <v-list-item-content>
              <div class="overline text-align-center">
                問題数
              </div>
              <v-radio-group v-model="num" row dense style="margin:0 auto;">
                <v-radio label="3問" value="3"></v-radio>
                <v-radio label="5問" value="5"></v-radio>
                <v-radio label="10問" value="10"></v-radio>
              </v-radio-group>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-row justify="center">
            <v-col cols="auto">
              <v-btn style="margin-top:30px;margin-bottom:30px"
                depressed large color="primary"
                @click="goNext">
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
export default {
  name: 'Top',
  data: () => ({
    mode: "normal",
    num: "5",
  }),
  methods: {
    goNext: function() {
      this.$store.commit("setMode", this.mode);
      this.$store.commit("setNumberOfQuize", this.num);
      this.$store.dispatch("initialize")
      .then(()=>{
        const quiz = this.$store.getters.getFirstQuiz;
        this.$router.replace({
          name: "quiz",
          params: {
            id: quiz.id
          }
        });
      });
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
</style>