<template>
  <img
    v-if="src && !failed"
    :src="src"
    :width="size"
    :height="size"
    class="line-logo"
    alt=""
    loading="lazy"
    @error="failed = true"
  />
  <v-icon
    v-else
    class="line-logo"
    :size="size"
    icon="mdi-train"
  />
</template>

<script>
import { useQuizStore } from '@/stores/quiz'

// 路線ラベルからロゴ画像を表示する。ロゴが無い／読み込み失敗時は電車アイコン。
export default {
  name: 'LineLogo',
  props: {
    label: { type: String, default: '' },
    size: { type: [Number, String], default: 24 },
  },
  setup() {
    return { store: useQuizStore() }
  },
  data: () => ({
    failed: false,
  }),
  computed: {
    src() {
      return this.store.lineLogo(this.label)
    },
  },
  watch: {
    label() {
      this.failed = false
    },
  },
}
</script>

<style>
.line-logo {
  flex: 0 0 auto;
  object-fit: contain;
  vertical-align: middle;
}
</style>
