<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { MessageReactive } from 'naive-ui'
import { NAutoComplete, NButton, NInput, NSelect, NSpace, NSpin, useDialog, useMessage } from 'naive-ui'
import html2canvas from 'html2canvas'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import HeaderComponent from './components/Header/index.vue'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore, useChatStore, usePromptStore, useUserStore } from '@/store'
import { fetchChatAPIProcess, fetchChatResponseoHistory, fetchChatStopResponding, fetchUpdateUserChatModel } from '@/api'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'
import IconPrompt from '@/icons/Prompt.vue'
import { getToken } from '@/store/modules/auth/helper'

import { UserConfig } from '@/components/common/Setting/model'
import type { CHATMODEL } from '@/components/common/Setting/model'
const Prompt = defineAsyncComponent(() => import('@/components/common/Setting/Prompt.vue'))

let controller = new AbortController()
let lastChatInfo: any = {}

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()
const authStore = useAuthStore()
const userStore = useUserStore()
const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
const { addChat, updateChat, updateChatSome, getChatByUuidAndIndex } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom, scrollTo } = useScroll()

const { uuid } = route.params as { uuid: string }

const currentChatHistory = computed(() => chatStore.getChatHistoryByCurrentActive)
const usingContext = computed(() => currentChatHistory?.value?.usingContext ?? true)
const dataSources = computed(() => chatStore.getChatByUuid(+uuid))
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions)))

const prompt = ref<string>('')
const firstLoading = ref<boolean>(false)
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)
const showPrompt = ref(false)

let loadingms: MessageReactive
let allmsg: MessageReactive
let prevScrollTop: number

// 添加PromptStore
const promptStore = usePromptStore()

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplate } = storeToRefs<any>(promptStore)

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
  if (item.loading)
    updateChatSome(+uuid, index, { loading: false })
})

function handleSubmit() {
  onConversation()
}

async function onConversation() {
  // // 开始之前 先请求一下接口，判断一下，如果没次数了，就return
  const formData = new FormData()
  let userToken = getToken()
  if (!userToken)
    userToken = ''

  formData.append('token', userToken)
  const response = await fetch('https://cms.openai123.vip/api/chatVerify', {
    method: 'POST',
    body: formData,
  })
  const userinfo = await response.json()
  if (userinfo.code === 2)
    ms.error('用户验证失败，请重新登录或联系管理员')

  // 这里开始存入localstorage，把次数和vip保存下
  if (userinfo.code === 0) {
    localStorage.setItem('is_vip', userinfo.data.info.is_vip)
    if (userinfo.data.info.is_vip === 2)
      localStorage.setItem('message_count', '-1')
    else
      localStorage.setItem('message_count', userinfo.data.info.month_count + userinfo.data.info.tmp_count + userinfo.data.info.gift_count)
  }
  else {
    localStorage.setItem('message_count', userinfo.data.info.month_count + userinfo.data.info.tmp_count + userinfo.data.info.gift_count)
    // 这里判断是否登录，如果未登录，就弹出其他对话框
    let msgText = ''
    if (!userToken)
      msgText = `尊敬的主人，您的试用次数已用完。点击<button class="register" style="padding:2px 5px 2px 5px;background:#fc5517;color:#fff;border-radius:5px" onclick="document.querySelector('#registerButton').click()">注册</button>再赠送您${userinfo.data.info.register_gift_count}次提问次数`
    else
      msgText = '尊敬的主人，您的试用次数已用完，您可以选择明天登录试用，或者您选择购买订阅支持我~mua<button  style="padding:2px 5px 2px 5px;background:#fc5517;color:#fff;border-radius:5px" onclick="document.querySelector(\'#buy_vip\').click()" >支持一下</button>'

    // 这里直接返回，不请求
    addChat(
      +uuid,
      {
        dateTime: new Date().toLocaleString(),
        text: msgText,
        inversion: false,
        error: false,
        conversationOptions: null,
        requestOptions: { prompt: '', options: null },
      },
    )
    scrollToBottom()
    return
  }
  // // 结束
  let message = prompt.value

  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  controller = new AbortController()

  const chatUuid = Date.now()
  addChat(
    +uuid,
    {
      uuid: chatUuid,
      dateTime: new Date().toLocaleString(),
      text: message,
      inversion: true,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: null },
    },
  )
  scrollToBottom()

  loading.value = true
  prompt.value = ''

  let options: Chat.ConversationRequest = {}
  const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

  if (lastContext && usingContext.value)
    options = { ...lastContext }

  addChat(
    +uuid,
    {
      uuid: chatUuid,
      dateTime: new Date().toLocaleString(),
      text: '',
      loading: true,
      inversion: false,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    },
  )
  scrollToBottom()

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        roomId: +uuid,
        uuid: chatUuid,
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          // Always process the final line
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            lastChatInfo = data
            const usage = (data.detail && data.detail.usage)
              ? {
                  completion_tokens: data.detail.usage.completion_tokens || null,
                  prompt_tokens: data.detail.usage.prompt_tokens || null,
                  total_tokens: data.detail.usage.total_tokens || null,
                  estimated: data.detail.usage.estimated || null,
                }
              : undefined
            updateChat(
              +uuid,
              dataSources.value.length - 1,
              {
                dateTime: new Date().toLocaleString(),
                text: lastText + (data.text ?? ''),
                inversion: false,
                error: false,
                loading: true,
                conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
                requestOptions: { prompt: message, options: { ...options } },
                usage,
              },
            )

            if (openLongReply && data.detail && data.detail.choices.length > 0 && data.detail.choices[0].finish_reason === 'length') {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }

            scrollToBottomIfAtBottom()
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(+uuid, dataSources.value.length - 1, { loading: false })
    }

    await fetchChatAPIOnce()
  }
  catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')

    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        dataSources.value.length - 1,
        {
          loading: false,
        },
      )
      scrollToBottomIfAtBottom()
      return
    }

    const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

    if (currentChat?.text && currentChat.text !== '') {
      updateChatSome(
        +uuid,
        dataSources.value.length - 1,
        {
          text: `${currentChat.text}\n[${errorMessage}]`,
          error: false,
          loading: false,
        },
      )
      return
    }

    updateChat(
      +uuid,
      dataSources.value.length - 1,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message, options: { ...options } },
      },
    )
    scrollToBottomIfAtBottom()
  }
  finally {
    loading.value = false
  }
}

async function onRegenerate(index: number) {
  // 开始之前 先请求一下接口，判断一下，如果没次数了，就return
  const formData = new FormData()
  let userToken = getToken()
  if (!userToken)
    userToken = ''

  formData.append('token', userToken)
  const response = await fetch('https://cms.openai123.vip/api/chatVerify', {
    method: 'POST',
    body: formData,
  })
  const userinfo = await response.json()
  if (userinfo.code === 2)
    ms.error('用户验证失败，请重新登录或联系管理员')

  // 这里开始存入localstorage，把次数和vip保存下
  if (userinfo.code === 0) {
    localStorage.setItem('is_vip', userinfo.data.info.is_vip)
    if (userinfo.data.info.is_vip === 2)
      localStorage.setItem('message_count', '-1')
    else
      localStorage.setItem('message_count', userinfo.data.info.month_count + userinfo.data.info.tmp_count + userinfo.data.info.gift_count)
  }
  else {
    localStorage.setItem('message_count', userinfo.data.info.month_count + userinfo.data.info.tmp_count + userinfo.data.info.gift_count)
    // 这里判断是否登录，如果未登录，就弹出其他对话框
    let msgText = ''
    if (!userToken)
      msgText = `尊敬的主人，您的试用次数已用完。点击<button class="register" style="padding:2px 5px 2px 5px;background:#fc5517;color:#fff;border-radius:5px" onclick="document.querySelector('#registerButton').click()">注册</button>再赠送您${userinfo.data.info.register_gift_count}次提问次数`
    else
      msgText = '尊敬的主人，您的试用次数已用完，您可以选择明天登录试用，或者您选择购买订阅支持我~mua<button  style="padding:2px 5px 2px 5px;background:#fc5517;color:#fff;border-radius:5px" onclick="document.querySelector(\'#buy_vip\').click()" >支持一下</button>'

    // 这里直接返回，不请求
    addChat(
      +uuid,
      {
        dateTime: new Date().toLocaleString(),
        text: msgText,
        inversion: false,
        error: false,
        conversationOptions: null,
        requestOptions: { prompt: '', options: null },
      },
    )
    scrollToBottom()
    return
  }
  // 结束
  if (loading.value)
    return

  controller = new AbortController()

  const { requestOptions } = dataSources.value[index]
  let responseCount = dataSources.value[index].responseCount || 1
  responseCount++

  let message = requestOptions?.prompt ?? ''

  let options: Chat.ConversationRequest = {}

  if (requestOptions.options)
    options = { ...requestOptions.options }

  loading.value = true
  const chatUuid = dataSources.value[index].uuid
  updateChat(
    +uuid,
    index,
    {
      dateTime: new Date().toLocaleString(),
      text: '',
      inversion: false,
      responseCount,
      error: false,
      loading: true,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    },
  )
  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        roomId: +uuid,
        uuid: chatUuid || Date.now(),
        regenerate: true,
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          // Always process the final line
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            lastChatInfo = data
            const usage = (data.detail && data.detail.usage)
              ? {
                  completion_tokens: data.detail.usage.completion_tokens || null,
                  prompt_tokens: data.detail.usage.prompt_tokens || null,
                  total_tokens: data.detail.usage.total_tokens || null,
                  estimated: data.detail.usage.estimated || null,
                }
              : undefined
            updateChat(
              +uuid,
              index,
              {
                dateTime: new Date().toLocaleString(),
                text: lastText + (data.text ?? ''),
                inversion: false,
                responseCount,
                error: false,
                loading: true,
                conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
                requestOptions: { prompt: message, options: { ...options } },
                usage,
              },
            )

            if (openLongReply && data.detail && data.detail.choices.length > 0 && data.detail.choices[0].finish_reason === 'length') {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(+uuid, index, { loading: false })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        index,
        {
          loading: false,
        },
      )
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(
      +uuid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        responseCount,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message, options: { ...options } },
      },
    )
  }
  finally {
    loading.value = false
  }
}

async function onResponseHistory(index: number, historyIndex: number) {
  const chat = (await fetchChatResponseoHistory(+uuid, dataSources.value[index].uuid || Date.now(), historyIndex)).data
  updateChat(
    +uuid,
    index,
    {
      dateTime: chat.dateTime,
      text: chat.text,
      inversion: false,
      responseCount: chat.responseCount,
      error: true,
      loading: false,
      conversationOptions: chat.conversationOptions,
      requestOptions: { prompt: chat.requestOptions.prompt, options: { ...chat.requestOptions.options } },
      usage: chat.usage,
    },
  )
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      }
      catch (error: any) {
        ms.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(+uuid, index)
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(+uuid)
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

async function handleStop() {
  if (loading.value) {
    controller.abort()
    loading.value = false
    await fetchChatStopResponding(lastChatInfo.text, lastChatInfo.id, lastChatInfo.conversationId)
  }
}

async function loadMoreMessage(event: any) {
  const chatIndex = chatStore.chat.findIndex(d => d.uuid === +uuid)
  if (chatIndex <= -1 || chatStore.chat[chatIndex].data.length <= 0)
    return

  const scrollPosition = event.target.scrollHeight - event.target.scrollTop

  const lastId = chatStore.chat[chatIndex].data[0].uuid
  await chatStore.syncChat({ uuid: +uuid } as Chat.History, lastId, () => {
    loadingms && loadingms.destroy()
    nextTick(() => scrollTo(event.target.scrollHeight - scrollPosition))
  }, () => {
    loadingms = ms.loading(
      '加载中...', {
        duration: 0,
      },
    )
  }, () => {
    allmsg && allmsg.destroy()
    allmsg = ms.warning('没有更多了', {
      duration: 1000,
    })
  })
}

const handleLoadMoreMessage = debounce(loadMoreMessage, 300)
const handleSyncChat
  = debounce(() => {
    // 直接刷 极小概率不请求
    chatStore.syncChat({ uuid: Number(uuid) } as Chat.History, undefined, () => {
      firstLoading.value = false
      const scrollRef = document.querySelector('#scrollRef')
      if (scrollRef)
        nextTick(() => scrollRef.scrollTop = scrollRef.scrollHeight)
      if (inputRef.value && !isMobile.value)
        inputRef.value?.focus()
    })
  }, 200)

async function handleScroll(event: any) {
  const scrollTop = event.target.scrollTop
  if (scrollTop < 50 && (scrollTop < prevScrollTop || prevScrollTop === undefined))
    handleLoadMoreMessage(event)
  prevScrollTop = scrollTop
}

async function handleToggleUsingContext() {
  if (!currentChatHistory.value)
    return

  currentChatHistory.value.usingContext = !currentChatHistory.value.usingContext
  chatStore.setUsingContext(currentChatHistory.value.usingContext, +uuid)
  if (currentChatHistory.value.usingContext)
    ms.success(t('chat.turnOnContext'))
  else
    ms.warning(t('chat.turnOffContext'))
}

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
  if (prompt.value.startsWith('/')) {
    const token = getToken()
    if (token) {
      return promptTemplate.value.filter((item: { key: string }) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
        return {
          label: obj.value,
          value: obj.value,
        }
      })
    }
    else {
      ms.warning('请先登录以使用提示词功能')
      return []
    }
  }
  else {
    return []
  }
})

// value反渲染key
const renderOption = (option: { label: string }) => {
  for (const i of promptTemplate.value) {
    if (i.value === option.label)
      return [i.key]
  }
  return []
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

async function handleSyncChatModel(chatModel: CHATMODEL) {
  if (userStore.userInfo.config == null)
    userStore.userInfo.config = new UserConfig()
  userStore.userInfo.config.chatModel = chatModel
  userStore.recordState()
  await fetchUpdateUserChatModel(chatModel)
}

onMounted(() => {
  firstLoading.value = true
  handleSyncChat()

  if (authStore.token) {
    const chatModels = authStore.session?.chatModels
    if (chatModels != null && chatModels.filter(d => d.value === userStore.userInfo.config.chatModel).length <= 0)
      ms.error('你选择的模型已不存在，请重新选择 | The selected model not exists, please choose again.', { duration: 7000 })
  }
})

watch(() => chatStore.active, (newVal, oldVal) => {
  handleSyncChat()
})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
})

function copyText(event: MouseEvent): void {
  const liEl = (event.target as HTMLElement).closest('li')
  if (!liEl)
    return // 如果没有找到li元素，则直接返回

  const divEl = liEl.querySelector('div')
  if (!divEl)
    return // 如果没有找到div元素，则直接返回
  const textContent = divEl.textContent?.slice(0, -2) ?? ''
  prompt.value = textContent
}
</script>

<template>
  <div id="aaa" style="width:100%;height:100%;background: linear-gradient(to bottom right, #395168, #abadb9);">
    <div class="flex flex-col w-full h-full">
      <HeaderComponent
        v-if="isMobile"
        :using-context="usingContext"
        :show-prompt="showPrompt"
        @export="handleExport" @toggle-using-context="handleToggleUsingContext"
        @toggle-show-prompt="showPrompt = true"
      />
      <main class="flex-1 overflow-hidden">
        <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
          <div
            id="image-wrapper"
            class="w-full max-w-screen-xl m-auto  "
            :class="[isMobile ? 'p-2' : 'p-4']"
            :style="[!isMobile ? 'padding-top: 6rem;' : '']"
          >
            <NSpin :show="firstLoading">
              <template v-if="!dataSources.length">
                <img data-v-363abf1f="" src="/logo20230614.png" style="width: 250px; height: 74px;margin:0 auto">
                <div :class="[isMobile ? 'div-mobile' : 'div']">
                  <div>
                    <div :class="[isMobile ? 'div-mobile-icon' : '']">
                      <div>
                        <i class="iconfont icon-bianji" />
                      </div>
                    </div>
                    <h2 class="h2title">
                      AI创作
                    </h2>
                    <ul class="h2ul">
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>写一首赞美祖国的诗，50字以上 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>写一篇在线聊天通信的产品策划 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>写一篇境外电商平台的活动策划 →</div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div :class="[isMobile ? 'div-mobile-icon' : '']">
                      <div>
                        <i class="iconfont icon-daxiao" />
                      </div>
                    </div>
                    <h2 class="h2title">
                      有趣的问题
                    </h2>
                    <ul class="h2ul">
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>我和猫咪的关系是否是奴役关系 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>人死了真的有下一世吗 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>相由心生有没有科学道理 →</div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div :class="[isMobile ? 'div-mobile-icon' : '']">
                      <div>
                        <i class="iconfont icon-dengpao" />
                      </div>
                    </div>
                    <h2 class="h2title">
                      AI百科
                    </h2>
                    <ul class="h2ul">
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>智齿必须拔掉吗 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>糖醋里脊的做法 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>什么姓氏历史上没出现过名人 →</div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div :class="[isMobile ? 'div-mobile-icon' : '']">
                      <div>
                        <i class="iconfont icon-book" />
                      </div>
                    </div>
                    <h2 class="h2title">
                      AI预测
                    </h2>
                    <ul class="h2ul">
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>未来热门的行业和职业 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>下一个球王会是谁 →</div>
                      </li>
                      <li class="dark:text-white dark:bg-[#7695b5] dark:hover:bg-[#70c0e8]" @click="copyText">
                        <div>未来城市的设计和建设 →</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </template>
              <template v-else>
                <div>
                  <Message
                    v-for="(item, index) of dataSources"
                    :key="index"
                    :date-time="item.dateTime"
                    :text="item.text"
                    :inversion="item.inversion"
                    :response-count="item.responseCount"
                    :usage="item && item.usage || undefined"
                    :error="item.error"
                    :loading="item.loading"
                    @regenerate="onRegenerate(index)"
                    @delete="handleDelete(index)"
                    @response-history="(ev) => onResponseHistory(index, ev)"
                  />
                  <div class="sticky bottom-0 left-0 flex justify-center">
                    <NButton v-if="loading" type="warning" @click="handleStop">
                      <template #icon>
                        <SvgIcon icon="ri:stop-circle-line" />
                      </template>
                      Stop Responding
                    </NButton>
                  </div>
                </div>
              </template>
            </NSpin>
          </div>
        </div>
      </main>
      <footer :class="footerClass">
        <div class="w-full max-w-screen-xl m-auto">
          <NSpace vertical>
            <div class="flex items-center space-x-2">
              <HoverButton @click="handleClear">
                <span class="text-xl text-[#4f555e] dark:text-white">
                  <SvgIcon icon="ri:delete-bin-line" />
                </span>
              </HoverButton>
              <HoverButton v-if="!isMobile" @click="handleExport">
                <span class="text-xl text-[#4f555e] dark:text-white">
                  <SvgIcon icon="ri:download-2-line" />
                </span>
              </HoverButton>
              <HoverButton v-if="!isMobile" @click="showPrompt = true">
                <span class="text-xl text-[#4f555e] dark:text-white">
                  <IconPrompt class="w-[20px] m-auto" />
                </span>
              </HoverButton>
              <HoverButton v-if="!isMobile" @click="handleToggleUsingContext">
                <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
                  <SvgIcon icon="ri:chat-history-line" />
                </span>
              </HoverButton>
              <NSelect
                style="width: 250px"
                :value="userStore.userInfo.config.chatModel"
                :options="authStore.session?.chatModels"
                :disabled="!!authStore.session?.auth && !authStore.token"
                @update-value="(val) => handleSyncChatModel(val)"
              />
            </div>
            <div class="flex items-center justify-between space-x-2">
              <NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
                <template #default="{ handleInput, handleBlur, handleFocus }">
                  <NInput
                    ref="inputRef"
                    v-model:value="prompt"
                    type="textarea"
                    :placeholder="placeholder"
                    :autosize="{ minRows: isMobile ? 1 : 4, maxRows: isMobile ? 4 : 8 }"
                    @input="handleInput"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    @keypress="handleEnter"
                  />
                </template>
              </NAutoComplete>
              <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
                <template #icon>
                  <span class="dark:text-black">
                    <SvgIcon icon="ri:send-plane-fill" />
                  </span>
                </template>
              </NButton>
            </div>
          </NSpace>
        </div>
      </footer>
      <Prompt v-if="showPrompt" v-model:roomId="uuid" v-model:visible="showPrompt" />
    </div>
  </div>
</template>

<style>
	.title {
		font-weight: 600;
		margin-bottom: 60px;
		font-size: 40px;
		text-align: center
	}

	.div {
		display: flex;
		align-items: flex-start;
		text-align: center;
		padding: 0 20px;
	}

	.div-mobile {
		align-items: flex-start;
		text-align: center;
		padding: 0 20px;
	}

	.div-mobile-icon {
		display: inline-block;
	}

	.div > div {
		display: flex;
		flex-direction: column;
		flex: 1 1 0%;
		gap: 12px;
		margin-right: 12px;
	}

	.div > div > div {
		margin: 0;
		padding: 0
	}

	.div > div > div > div {
		border-radius: 3px;
		position: relative;
		display: inline-block;
		overflow: hidden;
	}

	.h2title {
		font-weight: 400;
		font-size: 16px;
		line-height: 24px;
		margin: 0;
	}

	.h2ul > li {
		width: 100%;
		cursor: pointer;
		font-size: 16px;
		border-radius: 3px;
		padding: 10px;
		margin-bottom: 12px;
		background-color: #f7f7f8;
	}

	.h2ul > li:hover {
		background-color: #67c23a;
		color: #fff;
	}
</style>

<style scoped src="@/styles/lib/iconfont.css"></style>
