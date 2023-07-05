<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NButton, NCollapse, NCollapseItem, NModal, useMessage } from 'naive-ui'
import TextComponent from './gptText.vue'
import { getToken } from '@/store/modules/auth/helper'
const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const msg = useMessage()

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

interface ContentData {
  id: number
  category_id: number
  create_at: string
  desc: string
  content: string
  title: string
  result: string
}

interface CategoryData {
  [key: string]: ContentData[]
}

const tips = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const data = ref<CategoryData>({})
const loaded = ref(false)

async function fetchData() {
  const formData = new FormData()
  formData.append('token', getToken())
  const response = await fetch('https://cms.openai123.vip/api/help', {
    method: 'POST',
    body: formData,
  })
  const result = await response.json()
  if (result.code === 0) {
    const categoryData: CategoryData = {}
    for (const category in result.data.info)
      categoryData[category] = result.data.info[category]

    data.value = categoryData
    loaded.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded.value)
    fetchData()
})

const activeCollapse = ref<string>('')
const activeContent = ref<ContentData | null>(null)
const selectedId = ref(0)

function handleCollapseClick(category: string) {
  activeCollapse.value = activeCollapse.value === category ? '' : category
}

function selectItem(content: ContentData) {
  activeContent.value = content
  selectedId.value = content.id
}

function replaceBrackets(content: string): string {
  return content.replace(/\{(.+?)\}/g, '<input ref="userInput" class="user-input" style="color: #333;height: 30px;padding: 2px 5px; border: 1px solid #ff7220FF;border-radius: 4px; width: auto; min-width: 50px;" placeholder="请输入" oninput="this.style.width = ((this.value.length + 1) * 14) + \'px\';" />')
}

async function copyToClipboard(content: string, id: number) {
  const userInputElements = document.querySelectorAll('.user-input') as NodeListOf<HTMLInputElement>
  const userInputValues = Array.from(userInputElements).map(element => element.value)
  let replacedContent = content
  userInputValues.forEach((value) => {
    replacedContent = replacedContent.replace(/\{(.+?)\}/, value)
  })
  const formData = new FormData()
  formData.append('token', getToken())
  formData.append('id', id.toString())
  try {
    const response = await fetch('https://cms.openai123.vip/api/help/copy', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code !== 0) {
      msg.error('系统接口出错')
      return
    }
    else {
      const textarea = document.createElement('textarea')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      textarea.style.top = '-9999px'
      textarea.value = replacedContent
      const modalBody = document.querySelector('#tipsHere') as HTMLElement
      modalBody.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      msg.success('复制成功')
    }
  }
  catch (err) {
    console.error(err)
    msg.error('复制失败')
  }
}
</script>

<template>
  <NModal
    id="tipsHere"
    v-model:show="tips"
    style="width: 100%; max-width: 1400px;background: linear-gradient(to bottom right, #728da8, #abadb9);" preset="card"
  >
    <div style="display: flex;">
      <NCollapse style="flex: 1; padding-right: 10px;" :accordion="true">
        <!-- 遍历数据渲染折叠面板 -->
        <NCollapseItem
          v-for="(contents, category) in data"
          :key="category"
          :title="category as string"
          :name="category"
          :value="activeCollapse === category"
          @click="handleCollapseClick(category as string)"
        >
          <div v-if="contents.length > 0">
            <!-- 遍历折叠项的内容 -->
            <div v-for="(content, index) in contents" :key="index" class="item-content">
              <div class="item-title" :class="{ 'item-selected': content.id === selectedId }" @click="selectItem(content)">
                <i class="ri-arrow-right-double-line" />{{ content.title }}
              </div>
            </div>
          </div>
          <div v-else>
            暂无内容
          </div>
        </NCollapseItem>
      </NCollapse>
      <div style="display: flex; flex-direction: column; flex: 5; padding: 0 30px 0 15px;">
        <div v-if="activeContent">
          <h3 style="text-align:center;font-size: 18px;font-weight: bold;">
            示例
          </h3>
          <div style="margin-bottom: 10px;">
            <TextComponent
              ref="textRef"
              :inversion="true"
              :error="false"
              :text="activeContent!.content"
              :loading="false"
              :as-raw-text="false"
              style="max-width:600px;float:right"
            />
          </div>
          <div>
            <TextComponent
              ref="textRef"
              :inversion="false"
              :error="false"
              :text="activeContent!.result"
              :loading="false"
              :as-raw-text="false"
              style="overflow-y: auto;max-height: 600px;max-width:800px; white-space: pre-line !important;"
            />
          </div>
          <!-- 注释部分 -->
          <div class="comment-container mt-2" style="border: 1px solid #ff7220;padding: 10px;">
            <div class="divider" /> <!-- 添加横线 -->
            <div class="content-text" v-html="replaceBrackets(activeContent!.desc)" />
            <div style="width: 100%;text-align:center;">
              <NButton
                type="primary"
                size="small"
                style="color:#fff"
                @click.stop="copyToClipboard(activeContent!.desc, activeContent!.id)"
              >
                复制并使用
              </NButton>
            </div>
          </div>
        </div>
        <div v-else>
          请选择一个折叠项查看详情
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.item-content {
  margin-bottom: 10px;
  padding-left: 35px;
}

.item-title {
  display: inline-block;
  cursor: pointer;
}

.item-selected {
  color: #f19d6c;
}

.n-card {
  max-width: 250px;
}

.content-text {
  margin-bottom: 20px; /* 调整行间距 */
  line-height: 40px;
}

#quill-editor {
  height: 200px;
}

.editor-container {
  flex: 1;
  margin-top: 20px; /* 调整与上方内容的间距 */
}

.content-text {
  white-space: pre-wrap;
  word-break: break-word;
}

::v-deep .markdown-body>p>span {text-wrap:wrap !important}

body,a,table,div,span,td,th,input,select{overflow-x:hidden;overflow-y:auto;word-break:break-all; }

.comment-container {
  position: relative;
  clear: both;
}

.divider {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgb(197, 25, 25);
}
</style>
