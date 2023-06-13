<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NCard, NModal, NSpace, NTabPane, NTabs, useMessage } from 'naive-ui'
import { getToken } from '@/store/modules/auth/helper'

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

interface CategoryData {
  name: string
  contents: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const msg = useMessage()

const tips = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const data = ref<CategoryData[]>([])
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
    const categories = (Object.entries(result.data.info) as [string, any[]][])
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, contents]) => ({ name, contents } as CategoryData))
    data.value = categories
    loaded.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded.value)
    fetchData()
})

async function copyToClipboard(content: string, id: number) {
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

    // 检查是否支持剪贴板 API
    if (navigator.clipboard) {
      // 使用 navigator.clipboard API
      await navigator.clipboard.writeText(content)
      msg.success('复制成功')
    }
    else if (document.queryCommandSupported('copy')) {
      // 使用 document.execCommand('copy') 方法
      const textarea = document.createElement('textarea')
      textarea.textContent = content
      textarea.style.position = 'fixed' // 避免页面滚动
      document.body.appendChild(textarea)
      textarea.select()

      try {
        document.execCommand('copy')
        msg.success('复制成功')
      }
      catch (err) {
        console.error(err)
        msg.error('复制失败')
      }
      finally {
        document.body.removeChild(textarea)
      }
    }
    else {
      msg.error('浏览器不支持剪贴板操作')
    }
  }
  catch (err) {
    console.error(err)
    msg.error('复制失败')
  }
}

function formatDesc(desc: string) {
  const regex = /{([^}]+)}/g
  return desc.replace(regex, '<span style="color:#f19d6c;display:inline;border: 1px solid;padding: 0px 3px 0px 3px;margin: 0 5px 0 5px;">$1</span>')
}
</script>

<template>
  <NModal v-model:show="tips" style="width: 100%; max-width: 1200px;background: linear-gradient(to bottom right, #728da8, #abadb9);" preset="card">
    <NTabs
      v-if="loaded"
      type="line"
      size="large"
      :tabs-padding="20"
      pane-style="padding: 20px;"
    >
      <!-- 遍历data数组，生成对应的标签页和卡片组件 -->
      <NTabPane v-for="(category, index) in data" :key="index" :name="category.name">
        <NSpace size="large" style="flex-wrap: wrap;">
          <NCard
            v-for="(content, idx) in category.contents"
            :key="idx"
            :segmented="{
              content: true,
              footer: 'soft',
            }" :title="content.title" class="text-xs" hoverable style="background: linear-gradient(to bottom right, #728da8, #abadb9);"
            @click="copyToClipboard(content.desc, content.id)"
          >
            <template #header>
              {{ content.title }}
              <span
                style="position: absolute;
    top: 0px;
    right: 0px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    background: rgb(255, 114, 32);
    font-size: 12px;
    border-radius: 3px;
    padding: 2px 5px 2px 5px;" @click.stop="copyToClipboard(content.desc, content.id)"
              >复制</span>
            </template>
            <template #footer>
              <span v-html="formatDesc(content.desc)" />
            </template>
            <template #action>
              {{ content.content }}
            </template>
          </NCard>
        </NSpace>
      </NTabPane>
    </NTabs>
  </NModal>
</template>

<style scoped>
.n-card {
  max-width: 250px;
}
</style>
