<template>
  <v-app>
    <v-app-bar color="primary">
      <div class="d-flex align-center app-title">
        路線王 ～駅名だけで鉄道路線を当てるクイズゲーム～
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
