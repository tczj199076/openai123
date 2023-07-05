<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { NButton, NLayoutSider } from 'naive-ui'
import List from './List.vue'
import Footer from './Footer.vue'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { Donation, Help, Tips, Ucenter, Vip } from '@/components/common'

const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
const vip = ref(false)
const ucenter = ref(false)
const help = ref(false)
const tips = ref(false)
const donation = ref(false)
// const show = ref(false)

const state = reactive({
  status: 0,
})

onMounted(async () => {
  const response = await fetch('https://cms.openai123.vip/api/isVipOpen', {
    method: 'POST',
  })
  const result = await response.json()
  state.status = result.data.info.status
})

const collapsed = computed(() => appStore.siderCollapsed)

async function handleAdd() {
  await chatStore.addHistory({ title: 'New Chat', uuid: Date.now(), isEdit: false, usingContext: true })
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    position="absolute"
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full  dark:bg-[#395168]" :style="[!isMobile ? 'padding-top: 5rem;' : mobileSafeArea]">
      <main class="flex flex-col flex-1 min-h-0">
        <div class="p-4">
          <NButton type="warning" dark:text-white block :disabled="!!authStore.session?.auth && !authStore.token" @click="handleAdd">
            {{ $t('chat.newChatButton') }}
          </NButton>
        </div>
        <div class="flex-1 min-h-0 pb-4 overflow-hidden">
          <List />
        </div>
        <div>
          <div v-if="!!authStore.session?.auth && !authStore.token" />
          <div v-else v-show="authStore.session?.auth" class="p-4 " style="display: grid; grid-template-rows: repeat(3, auto); gap: 10px;">
            <NButton type="warning" dark:text-white block @click="tips = true">
              {{ $t('store.siderButton') }}
            </NButton>
            <NButton id="buy_vip" type="warning" dark:text-white block @click="vip = true">
              {{ $t('store.vip') }}
            </NButton>
            <NButton type="warning" dark:text-white block @click="donation = true">
              {{ $t('store.donation') }}
            </NButton>
            <NButton type="warning" dark:text-white block @click="ucenter = true">
              {{ $t('store.ucenter') }}
            </NButton>

            <NButton type="warning" dark:text-white block @click="help = true">
              {{ $t('store.help') }}
            </NButton>
            <!-- <NButton block @click="show = true">
              {{ $t('store.siderButton') }}
            </NButton> -->
          </div>
        </div>
      </main>
      <Footer v-if="isMobile" />
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 bg-black/40" @click="handleUpdateCollapsed" />
  </template>
  <!-- <PromptStore v-model:visible="show" /> -->
  <Vip v-model:visible="vip" />
  <Ucenter v-model:visible="ucenter" />
  <Help v-model:visible="help" />
  <Tips v-model:visible="tips" />
  <Donation v-model:visible="donation" />
</template>
