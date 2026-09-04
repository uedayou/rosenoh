<template>
  <v-app>
    <v-app-bar color="primary">
      <div class="d-flex align-center app-title">
        <span class="app-title__name">路線王</span>
        <span
          v-if="$vuetify.display.smAndUp"
          class="app-title__sub"
        >～駅名だけで鉄道路線を当てるクイズゲーム～</span>
        <span v-if="$vuetify.display.smAndUp" class="app-title__powered">
          powered by
          <a
            class="app-title__link"
            href="https://uedayou.net/jrslod/"
            target="_blank"
            rel="noopener"
          >鉄道駅LOD</a>
        </span>
      </div>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <v-footer color="white" border>
      <v-spacer></v-spacer>
      <a
        class="footer-link"
        href="https://uedayou.net/"
        target="_blank"
      >@uedayou</a> {{ new Date().getFullYear() }}. Some rights reserved.
      <v-spacer></v-spacer>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
}
</script>
