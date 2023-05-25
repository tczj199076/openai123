<script setup lang='ts'>
import { ref } from 'vue'
import { NButtonGroup, NPopover, NSpace, useMessage } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
// import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
// import { useBasicLayout } from '@/hooks/useBasicLayout'
import { copyToClip } from '@/utils/copy'

interface Props {
  dateTime?: string
  text?: string
  inversion?: boolean
  error?: boolean
  loading?: boolean
  responseCount?: number
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
    estimated: boolean
  }
}

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'responseHistory', historyIndex: number): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

// const { isMobile } = useBasicLayout()

// const { iconRender } = useIconRender()

const message = useMessage()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion)

const messageRef = ref<HTMLElement>()

const indexRef = ref<number>(0)
indexRef.value = props.responseCount ?? 0

const url_openai_token = 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them'

// const options = computed(() => {
//   const common = [
//     {
//       label: t('chat.copy'),
//       key: 'copyText',
//       icon: iconRender({ icon: 'ri:file-copy-2-line' }),
//     },
//     {
//       label: t('common.delete'),
//       key: 'delete',
//       icon: iconRender({ icon: 'ri:delete-bin-line' }),
//     },
//   ]

//   // 点赞
//   if (!props.inversion) {
//     common.unshift({
//       label: '狂踩',
//       key: 'down',
//       icon: iconRender({ icon: 'ph:thumbs-down-duotone' }),
//     })
//   }

//   // 踩
//   if (!props.inversion) {
//     common.unshift({
//       label: '点赞',
//       key: 'up',
//       icon: iconRender({ icon: 'ph:thumbs-up-duotone' }),
//     })
//   }

//   // 20230506注销，因为暂时用不到，这是显示原文的按钮
//   if (!props.inversion) {
//     common.unshift({
//       label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
//       key: 'toggleRenderType',
//       icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
//     })
//   }

//   return common
// })
// 20230506注销，因为暂时用不到，这是显示原文的按钮
// function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType' | 'up' | 'down') {
//   switch (key) {
//     case 'copyText':
//       handleCopy()
//       return
//     case 'toggleRenderType':
//       asRawText.value = !asRawText.value
//       return
//     case 'delete':
//       emit('delete')
//       return
//     case 'up':
//       up()
//       return
//     case 'down':
//       down()
//   }
// }
// TODO 这里的点赞和踩的功能没有后端接口，目前仅仅是展示用 20230506
async function up() {
  message.success('感谢支持')
}

async function down() {
  message.success('我会继续努力的')
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView()
  emit('regenerate')
}

async function handleCopy() {
  try {
    await copyToClip(props.text || '')
    message.success('复制成功')
  }
  catch {
    message.error('复制失败')
  }
}

async function handlePreviousResponse(next: number) {
  if (indexRef.value + next < 1 || indexRef.value + next > props.responseCount!)
    return
  indexRef.value += next
  emit('responseHistory', indexRef.value - 1)
}
// 获取本地的VIP和次数信息
const is_vip = localStorage.getItem('is_vip')
let message_count = localStorage.getItem('message_count')
if (message_count === '-1')
  message_count = '-'
</script>

<template>
  <div
    ref="messageRef"
    class="flex w-full mb-6 overflow-hidden"
    :class="[{ 'flex-row-reverse': inversion }]"
  >
    <div
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :image="inversion" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p v-if="inversion" class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        {{ new Date(dateTime as string).toLocaleString() }}
      </p>
      <p v-else class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        <NSpace>
          {{ new Date(dateTime as string).toLocaleString() }}
          <NButtonGroup v-if="!inversion && responseCount && responseCount > 1">
            <NButton
              style="cursor: pointer;"
              :disabled="indexRef === 1"
              @click="handlePreviousResponse(-1)"
            >
              <svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="5 -5 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
            </NButton>
            <span class="text-xs text-[#b4bbc4]"> {{ indexRef }} / {{ responseCount }}</span>
            <NButton
              style="cursor: pointer;"
              :disabled="indexRef === responseCount"
              @click="handlePreviousResponse(1)"
            >
              <svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="-5 -5 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="9 18 15 12 9 6" /></svg>
            </NButton>
          </NButtonGroup>
          <template v-if="usage">
            <NPopover trigger="hover">
              <template #trigger>
                <span>
                  <span>[</span>
                  <span>{{ usage.estimated ? '~' : '' }}</span>
                  <span>{{ usage.prompt_tokens }}+{{ usage.completion_tokens }}={{ usage.total_tokens }}</span>
                  <span>]</span>
                </span>
              </template>
              <span class="text-xs">
                {{ usage.estimated ? t('chat.usageEstimate') : '' }}
                {{ t('chat.usagePrompt') }} {{ usage.prompt_tokens }}
                + {{ t('chat.usageResponse') }} {{ usage.completion_tokens }}
                = {{ t('chat.usageTotal') }}<a :href="url_openai_token" target="_blank">(?)</a>
                {{ usage.total_tokens }}
              </span>
            </NPopover>
          </template>
        </NSpace>
      </p>
      <div
        class="flex items-end gap-1 mt-2"
        :class="[inversion ? 'flex-row-reverse' : 'flex-row']"
      >
        <TextComponent
          ref="textRef"
          :inversion="inversion"
          :error="error"
          :text="text"
          :loading="loading"
          :as-raw-text="asRawText"
        />
        <div class="flex flex-col">
          <button
            v-if="!inversion"
            class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
            title="重新回答"
            @click="handleRegenerate"
          >
            <SvgIcon icon="ri:restart-line" />
          </button>
          <!-- <NDropdown
            :trigger="isMobile ? 'click' : 'hover'"
            :placement="!inversion ? 'right' : 'left'"
            :options="options"
            @select="handleSelect"
          >
            <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown> -->
        </div>
      </div>
      <span v-if="!inversion && is_vip !== null" class="text-xs text-[#b4bbc4] text-left">
        <template v-if="is_vip === '1' || is_vip === '2'">正式版：</template>
        <template v-else>试用版：</template>
        还剩{{ message_count }}次提问次数</span>
      <span v-if="!inversion" class="float-right text-xs text-[#b4bbc4] mr-4">
        <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 p-1" title="点赞" @click="up">
          <SvgIcon icon="ph:thumbs-up-duotone" />
        </button>
        <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 p-1" title="狂踩" @click="down">
          <SvgIcon icon="ph:thumbs-down-duotone" />
        </button>
        <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 p-1" title="复制" @click="handleCopy">
          <SvgIcon icon="ri:file-copy-2-line" />
        </button>
        <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200 p-1" title="删除" @click="emit('delete')">
          <SvgIcon icon="ri:delete-bin-line" />
        </button>
      </span>
    </div>
  </div>
</template>
