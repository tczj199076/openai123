<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NModal } from 'naive-ui'
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
  <NModal v-model:show="ucenter" style="width: 90%; max-width: 960px;" preset="card">
    <div class="row mb-2">
      <div class="col-md-12">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">
          <div class="col p-4 d-flex flex-column position-static">
            <h3 class="mb-0">
              我的余额
            </h3>
            <p class="card-text mb-auto text-muted ml-2">
              (提现功能尽情期待，目前余额可用于套餐抵扣)
            </p>
            <h4 v-if="loaded && data" class="mt-5 ">
              ￥{{ data.data.info.balance }}
            </h4>
            <!-- <a href="#" class="stretched-link">Continue reading</a> -->
          </div>
        </div>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-md-12">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">
          <div class="col p-4 d-flex flex-column position-static">
            <h3 class="mb-0">
              我的订阅
            </h3>
            <div v-if="loaded && data">
              <div v-for="item in data.data.info.vip" :key="item.id" class="mt-5">
                <p class="card-text mb-auto text-muted ml-2">
                  {{ item.name }}<span v-if="item.type === 1">：于{{ item.end_time }}到期，套餐距离到期还有{{ item.diff_date }}天。</span>
                </p>
                <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="{{item.per}}" aria-valuemin="0" aria-valuemax="100">
                  <div class="progress-bar" style="width: {{item.per}}%">
                    {{ item.per }}%
                  </div>
                </div>
                <p class="card-text mb-auto text-muted ml-2 float-right">
                  <span v-if="item.type === 1">本{{ item.unit }}</span> <span v-else> {{ item.name }}</span> 已提问{{ item.limit_num }}个问题，还剩{{ item.total_num }}个问题。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col-md-12  ">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">
          <div class="col p-4 d-flex flex-column position-static">
            <h3 class="mb-0">
              我的推广员
            </h3>
            <div class="row justify-content-between align-items-center text-md-center text-lg-left mt-5">
              <div class="col-lg-6">
                <div class="font-weight-light text-dark">
                  <img class="mx-auto d-block" src="https://bj.bcebos.com/qr-code/2304261188ccd46b05c3.jpg" style="width:120px;height:120px">
                </div>
              </div>
              <div class="col-lg-6 text-md-center text-lg-right mt-4 mb-4">
                <a href="#" class="btn  btn-primary">下载二维码</a>
              </div>
              <div class="col-lg-6">
                <span class="font-weight-light text-dark pd-0 text-muted">
                  https://www.openai123.vip/?s=s1233212222
                </span>
              </div>
              <div class="col-lg-6 text-md-center text-lg-right mt-4 mb-4">
                <a href="#" class="btn btn-primary">复制链接</a>
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
