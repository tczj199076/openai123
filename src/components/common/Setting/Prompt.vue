<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NButton, NInput, NModal, NSpace, useMessage } from 'naive-ui'
import { t } from '@/locales'
import { fetchUpdateChatRoomPrompt } from '@/api'
import { useChatStore } from '@/store'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const chatStore = useChatStore()
const currentChatHistory = computed(() => chatStore.getChatHistoryByCurrentActive)
const ms = useMessage()
const testing = ref(false)
const title = `AI角色定制 [${currentChatHistory.value?.title}]`

interface Props {
  visible: boolean
  roomId: string
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const show = computed({
  get() {
    return props.visible
  },
  set(visible: boolean) {
    emit('update:visible', visible)
  },
})

async function handleSaveChatRoomPrompt() {
  if (!currentChatHistory.value || !currentChatHistory.value)
    return

  testing.value = true
  try {
    const { message } = await fetchUpdateChatRoomPrompt(currentChatHistory.value.prompt ?? '', +props.roomId) as { status: string; message: string }
    ms.success(message)
    show.value = false
  }
  catch (error: any) {
    ms.error(error.message)
  }
  testing.value = false
}
</script>

<template>
  <NModal
    v-model:show="show" :auto-focus="false" class="custom-card" preset="card" :style="{ width: '600px' }" :title="title" size="huge"
    :bordered="false" style="background: linear-gradient(to bottom right, #728da8, #abadb9);"
  >
    <!-- <template #header-extra>
      噢!
    </template> -->
    <NInput
      :value="currentChatHistory && currentChatHistory.prompt"
      type="textarea"
      :autosize="{ minRows: 4, maxRows: 10 }" placeholder="请描述当前的AI角色，示例参考：你是一个专业的程序员，精通任何语言程序，会帮助用户解决任何代码上的问题，并帮他们查找程序漏洞。'" @input="(val) => { if (currentChatHistory) currentChatHistory.prompt = val }"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton :loading="testing" type="warning" @click="handleSaveChatRoomPrompt">
          {{ t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
