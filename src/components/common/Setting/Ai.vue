<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NImage, NInput, NModal, NSpace, useMessage } from 'naive-ui'
import { fetchUpdateChatRoomPrompt } from '@/api'
import { getToken } from '@/store/modules/auth/helper'
import { useChatStore } from '@/store'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const chatStore = useChatStore()
const currentChatHistory = computed(() => chatStore.getChatHistoryByCurrentActive)
const ms = useMessage()
const testing = ref(false)
// const title = `选择AI角色 [${currentChatHistory.value?.title}]`
const title = '选择AI角色'

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

// 定义用于存储接口返回的数据的变量
const data = ref<any>(null)
const selectedImage = ref<any>(null)

async function fetchData() {
  try {
    const formData = new FormData()
    formData.append('token', getToken())
    const response = await fetch('https://cms.openai123.vip/api/AiImage', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code === 0)
      data.value = result.data.info
  }
  catch (error) {
    console.error(error)
    data.value = null
  }
}

onMounted(fetchData)

async function handleSaveChatRoomPrompt() {
  if (!currentChatHistory.value || !currentChatHistory.value)
    return

  testing.value = true
  try {
    const { message } = (await fetchUpdateChatRoomPrompt(
      currentChatHistory.value.prompt ?? '',
      +props.roomId,
    )) as { status: string; message: string }
    ms.success(message)
    show.value = false
  }
  catch (error: any) {
    ms.error(error.message)
  }
  finally {
    testing.value = false
  }
}

function getImageUrl(path: string | undefined) {
  if (path)
    return `https://cms.openai123.vip/${path}` // 添加了对 path 存在性的判断

  return ''
}

function selectImage(item: any) {
  selectedImage.value = item
}

async function handleUsePrompt(item: any) {
  if (currentChatHistory.value) {
    const timestamp = Date.now()
    const chatId = window.location.href.split('/').pop() // 获取chat后面的数值
    const prefixedPath = `https://cms.openai123.vip/${item.path}` // 拼接前缀
    const localStorageKey = `prompt_${chatId}` // 构建localStorage的key

    currentChatHistory.value.prompt = `version:${timestamp} ${item.prompt}${' '.repeat(Math.floor(Math.random() * 5) + 1)}`

    // 存储到localStorage
    localStorage.setItem(localStorageKey, prefixedPath)
  }
}
</script>

<template>
  <NModal
    v-model:show="show"
    :auto-focus="false"
    class="custom-card"
    preset="card"
    :style="{ width: '600px' }"
    :title="title"
    size="huge"
    :bordered="false"
    style="background: linear-gradient(to bottom right, #728da8, #abadb9);"
  >
    <!-- 循环显示data.info的值 -->
    <div v-if="data" class="horizontal-container">
      <div v-for="item in data" :key="item.id" class="horizontal-item">
        <div class="image-container">
          <NImage
            width="100"
            height="100"
            preview-disabled
            :src="getImageUrl(item.path)"
            :class="{ selected: item === selectedImage }"
            @click="selectImage(item);handleUsePrompt(item)"
          />
          <NButton type="warning" class="use-button" @click="selectImage(item);handleUsePrompt(item)">
            {{ item.name }}
          </NButton>
        </div>
      </div>
    </div>

    <NInput
      :value="currentChatHistory && currentChatHistory.prompt"
      type="textarea"
      :autosize="{ minRows: 4, maxRows: 10 }" placeholder="请描述当前的AI角色，示例参考：你是一个专业的程序员，精通任何语言程序，会帮助用户解决任何代码上的问题，并帮他们查找程序漏洞。'" style="display:none"
      @input="(val) => { if (currentChatHistory) currentChatHistory.prompt = val }"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton :loading="testing" type="warning" @click="handleSaveChatRoomPrompt">
          <!-- {{ t('common.save') }} -->使用
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.horizontal-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.horizontal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20px;
}

.image-container {
  position: relative;
}

.use-button {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
}

.selected {
  border: 2px solid #f19d6c; /* 这里可以根据需要修改边框的样式 */
}
</style>
