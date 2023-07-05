<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'
import { getToken } from '@/store/modules/auth/helper'

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const donation = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const data = ref({
  donation_qrcode: '',
  donation_context: '',
})
const loaded = ref(false)

async function fetchData() {
  const formData = new FormData()
  formData.append('token', getToken())
  const response = await fetch(
    'https://cms.openai123.vip/api/getDonation',
    {
      method: 'POST',
      body: formData,
    },
  )
  const result = await response.json()
  if (result.code === 0) {
    data.value = result.data.info
    loaded.value = true
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded.value)
    fetchData()
})
</script>

<template>
  <NModal v-model:show="donation" preset="card" style="width: 100%; max-width: 600px;background: linear-gradient(to bottom right, #728da8, #abadb9); ">
    <div v-if="loaded">
      <p style="margin-top: 20px;" v-html="data.donation_context" />
    </div>
  </NModal>
</template>

  <style scoped>
  .n-card {
    max-width: 250px;
  }

/* 使用深度选择器覆盖 v-html 内容中的样式 */
  ::v-deep p img {
  display: block;
  margin-left: auto;
  margin-right: auto;
}
  </style>
