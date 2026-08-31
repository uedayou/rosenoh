import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

// Vuetify 4 の既定テーマは 'system'。既存の配色は白背景前提のため 'light' を明示する。
export default createVuetify({
  theme: {
    defaultTheme: 'light',
  },
})
