<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NButton, NInput, NModal } from 'naive-ui'
import { getToken } from '@/store/modules/auth/helper'
// import { useBasicLayout } from '@/hooks/useBasicLayout'
interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const ucenter = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const data = ref<any>(null)
const loaded = ref(false)
// 请求接口并保存返回值到data

async function fetchData() {
  const formData = new FormData()
  formData.append('token', getToken())
  const response = await fetch('https://cms.openai123.vip/api/getUserInfo', {
    method: 'POST',
    body: formData,
  })
  const result = await response.json()
  data.value = result
  loaded.value = true
}

// 监听visible的变化，并在visible为true时调用fetchData方法
watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded.value)
    fetchData()
})

// 移动端自适应相关
// const { isMobile } = useBasicLayout()
</script>

<template>
  <NModal v-model:show="ucenter" style="width: 90%; max-width: 960px;background: linear-gradient(to bottom right, #728da8, #abadb9);" preset="card">
    <div class="row mb-2">
      <div class="col-md-12">
        <div class="col p-4 d-flex flex-column position-static">
          <p class="lead dark:text-black" style="font-weight:bold">
            我的余额<span style="font-size:14px;color:#ddd">(提现功能尽情期待，目前余额可用于套餐抵扣)</span>
          </p>
          <p v-if="loaded && data" class=" fs-2" style="color:#fc5517">
            ￥{{ data.data.info.balance }}
          </p>
          <!-- <a href="#" class="stretched-link">Continue reading</a> -->
        </div>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-md-12">
        <div class="col p-4 d-flex flex-column position-static">
          <p class="lead dark:text-black" style="font-weight:bold">
            我的订阅
          </p>
          <div v-if="loaded && data">
            <div v-for="item in data.data.info.vip" :key="item.id" class="mt-5">
              <p class="fs-6 mb-auto  ml-2 dark:text-black" style="font-weight:bold ;">
                {{ item.name }}
              </p>
              <p class=" mb-auto  ml-2 dark:text-black">
                <span v-if="item.type === 1">于{{ item.end_time }}到期，套餐距离到期还有{{ item.diff_date }}天。</span>
              </p>
              <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="{{item.per}}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: {{item.per}}%">
                  {{ item.per }}%
                </div>
              </div>
              <p class="dark:text-black mb-auto   float-right">
                <span v-if="item.type === 1">本{{ item.unit }}</span> <span v-else> {{ item.name }}</span> 已提问{{ item.limit_num }}个问题，还剩{{ item.total_num }}个问题。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-md-12  ">
        <div class="col p-4 d-flex flex-column position-static">
          <p class="lead dark:text-black" style="font-weight:bold">
            我的推广员
          </p>
          <div class="row justify-content-between align-items-center text-md-center text-lg-left mt-5">
            <div class="col-lg-6">
              <div class="font-weight-light text-dark">
                <img class="mx-auto d-block" src="https://bj.bcebos.com/qr-code/2304261188ccd46b05c3.jpg" style="width:120px;height:120px">
              </div>
              <p class="mt-3 text-center mx-auto" style="width:50%">
                <NButton type="info" block>
                  下载二维码
                </NButton>
              </p>
            </div>
            <div class="col-lg-6">
              <div class="font-weight-light text-dark">
                <NInput readonly="readonly" style="width:70%" class="mx-auto" value="https://wwww.openai123.vip/" />
                <NButton type="info">
                  复制链接
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped src="@/styles/lib/editor.css"></style>

<style scoped src="@/styles/lib/bundle.css"></style>
