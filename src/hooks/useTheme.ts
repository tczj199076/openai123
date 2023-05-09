import type { GlobalThemeOverrides } from 'naive-ui'
import { computed, watch } from 'vue'
import { darkTheme, useOsTheme } from 'naive-ui'
import { useAppStore } from '@/store'

export function useTheme() {
  const appStore = useAppStore()

  const OsTheme = useOsTheme()

  const isDark = computed(() => {
    if (appStore.theme === 'auto')
      return OsTheme.value === 'dark'
    else
      return appStore.theme === 'dark'
  })

  const theme = computed(() => {
    return isDark.value ? darkTheme : undefined
  })

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    if (isDark.value) {
      return {
        common: {
          // bodyColor: '#8a9bafFF',
        },
        Button: {
          textColorInfo: '#FFFFFFFF',
          textColorHoverInfo: '#FFFFFFFF',
          textColorFocusInfo: '#FFFFFFFF',
          textColorPressedInfo: '#FFFFFFFF',
          colorWarning: '#f19d6cFF',
          colorHoverWarning: '#ff7220FF',
          colorPressedWarning: '#ff7220FF',
          colorFocusWarning: '#ff7220FF',
          textColorWarning: '#FFFFFFFF',
          textColorHoverWarning: '#FFFFFFFF',
          textColorFocusWarning: '#FFFFFFFF',
          textColorPressedWarning: '#FFFFFFFF',
          borderWarning: '0px',
          borderHoverWarning: '0px',
          borderPressedWarning: '0px',
          borderFocusWarning: '0px',
        },
        Input: {
          borderHover: '1px solid #f19d6c',
          borderFocus: '1px solid #f39660',
        },
        Tabs: {
          tabTextColorHoverLine: '#fc5517FF',
          tabTextColorHoverBar: '#fc5517FF',
          tabTextColorActiveLine: '#fc5517FF',
          barColor: '#fc5517FF',
          tabTextColorActiveCard: '#fc5517FF',
          tabTextColorActiveBar: '#fc5517FF',
        },

      }
    }
    return {}
  })

  watch(
    () => isDark.value,
    (dark) => {
      if (dark)
        document.documentElement.classList.add('dark')
      else
        document.documentElement.classList.remove('dark')
    },
    { immediate: true },
  )

  return { theme, themeOverrides }
}
