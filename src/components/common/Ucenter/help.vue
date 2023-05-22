<script setup lang="ts">
import { computed, defineEmits, defineProps, reactive, ref, watch } from 'vue'
import { NCollapse, NCollapseItem, NLayout, NLayoutContent, NLayoutSider, NModal, NSpace } from 'naive-ui'
import { getToken } from '@/store/modules/auth/helper'

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const state = reactive<{
  activeCategory: {
    id?: number
  } | undefined
}>({
  activeCategory: undefined,
})

let loaded = false
const help = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

interface Category {
  id: number
  name: string
}

interface Article {
  id: number
  title: string
  content: string
}

const categories = ref<Category[]>([])
const articles = ref<Article[]>([])

async function fetchCategoryData() {
  try {
    const formData = new FormData()
    formData.append('token', getToken())
    const response = await fetch('https://cms.openai123.vip/api/help/getCategory', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code === 0) {
      categories.value = result.data.info.map((item: any) => ({
        id: item.id,
        name: item.name,
      }))
      loaded = true
    }
  }
  catch (error) {
    console.error(error)
  }
}

async function fetchArticleData(categoryId: number) {
  try {
    const formData = new FormData()
    formData.append('token', getToken())
    formData.append('id', categoryId.toString())
    const response = await fetch('https://cms.openai123.vip/api/help/getList', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code === 0) {
      articles.value = result.data.info.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
      }))
    }
  }
  catch (error) {
    console.error(error)
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded)
    fetchCategoryData()
})

function handleCategoryClick(category: Category) {
  if (state.activeCategory && state.activeCategory.id)
    state.activeCategory = category
  else
    state.activeCategory = { id: category.id }

  fetchArticleData(category.id)
}

function isActive(category: Category): boolean {
  return state.activeCategory?.id === category.id
}

async function handleArticleClick(id: number) {
  try {
    const formData = new FormData()
    formData.append('token', getToken())
    formData.append('id', id.toString())
    await fetch('https://cms.openai123.vip/api/help/getContent', {
      method: 'POST',
      body: formData,
    })
  }
  catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <NModal v-model:show="help" fullscreen="true" style="width: 100%; max-width: 1600px;background: linear-gradient(to bottom right, #728da8, #abadb9);" preset="card">
    <NSpace vertical size="large">
      <NLayout has-sider>
        <NLayoutSider
          collapse-mode="width"
          :collapsed-width="120"
          :width="240"
          :show-collapsed-content="false"
          show-trigger="arrow-circle"
          content-style="padding: 24px;"
          bordered
        >
          <ul v-if="categories.length">
            <li
              v-for="(category, index) in categories"
              :key="index"
              class="relative flex items-center gap-3 px-3 py-3 break-all rounded-md cursor-pointer group dark:hover:bg-[#7696b6]"
              :class="{ 'border-[#4b9e5f]': isActive(category), 'bg-neutral-100': isActive(category), 'dark:text-[#ffffff]': isActive(category), 'dark:bg-[#7696b6]': isActive(category), 'dark:border-[#7696b6]': isActive(category), 'pr-14': isActive(category) }"
              @click="handleCategoryClick(category)"
            >
              {{ category.name }}
            </li>
          </ul>
          <div v-else>
            分类数据加载中...
          </div>
        </NLayoutSider>
        <NLayoutContent content-style="padding: 24px;">
          <template v-if="articles.length">
            <NCollapse>
              <NCollapseItem
                v-for="(article, index) in articles"
                :key="index"
                :name="article.id.toString()"
                :title="article.title"
                @click="handleArticleClick(article.id)"
              >
                <div v-html="article.content" />
              </NCollapseItem>
            </NCollapse>
          </template>
          <div v-else-if="!loaded">
            请选择分类
          </div>
          <div v-else>
            当前分类下没有文章
          </div>
        </NLayoutContent>
      </NLayout>
    </NSpace>
  </NModal>
</template>
