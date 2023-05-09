<script setup lang='ts'>
import { NButton, NLayoutHeader } from 'naive-ui'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import { useAuthStore } from '@/store'
import Permission from '@/views/chat/layout/Permission.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'

const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))

const authStore = useAuthStore()
const route = useRoute()
const show = ref(false)
const { isMobile } = useBasicLayout()
const showPermission = ref(false)
const needPermission = computed(() => !!authStore.session?.auth && !authStore.token && (isMobile.value || showPermission.value))

async function handleLogout() {
  await authStore.removeToken()
}

onMounted(async () => {
  const sign = route.query.verifyresetpassword as string
  if (sign)
    showPermission.value = true
})
</script>

<template>
  <NLayoutHeader>
    <div class="header-container  dark:bg-[#395168] p-4 flex justify-between items-center">
      <div class="logo">
        <img src="https://openai123.bj.bcebos.com/logo_1.png" style="width:100px; height:50px;">
      </div>
      <div
        v-if="!!authStore.session?.auth && !authStore.token" class="login-btn"
      >
        <NButton
          id="registerButton" type="warning" tag="a"
          @click="showPermission = true"
        >
          {{ $t('common.notLoggedIn') }}
        </NButton>
      </div>

      <div v-else class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
        <div class="flex-1 flex-shrink-0 overflow-hidden">
          <UserAvatar />
        </div>
        <HoverButton v-if="!!authStore.token" :tooltip="$t('common.logOut')" @click="handleLogout">
          <span class="text-xl text-[#4f555e] dark:text-white">
            <SvgIcon icon="uil:exit" />
          </span>
        </HoverButton>

        <HoverButton v-if="!!authStore.token" :tooltip="$t('setting.setting')" @click="show = true">
          <span class="text-xl text-[#4f555e] dark:text-white">
            <SvgIcon icon="ri:settings-4-line" />
          </span>
        </HoverButton>
        <Setting v-if="show" v-model:visible="show" />
      </div>
    </div>
  </NLayoutHeader>
  <Permission :visible="needPermission" />
</template>

  <style scoped>
  .header-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    z-index: 10;
  }
  .logo {
    /* 根据实际情况设置 Logo 的样式 */
  }
  .login-btn {
    /* 根据实际情况设置登录按钮的样式 */
  }
  </style>
