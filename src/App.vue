<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        路線王 ～駅名だけで路線を当てるクイズゲーム～
      </div>
    </v-app-bar>

    <v-content>
      <router-view></router-view>
    </v-content>
    <v-footer color="white" outlined>
      <v-spacer></v-spacer>
        <a style="text-decoration:none;color:inherit;margin-right:0.5em;" href="https://uedayou.net/" target="_blank">@uedayou</a> {{ new Date().getFullYear() }}. Some rights reserved.
      <v-spacer></v-spacer>
    </v-footer>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  data: () => ({
    //
  }),
};
</script>
