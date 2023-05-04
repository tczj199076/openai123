<script setup lang='ts'>
import { computed } from 'vue'
import { NModal } from 'naive-ui'
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
            <h4 class="mt-5 ">
              ￥28.00
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
            <div class="mt-5">
              <p class="card-text mb-auto text-muted ml-2">
                基础季付套餐：于2024/03/15到期，套餐距离到期还有340天。
              </p>
              <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: 75%">
                  75%
                </div>
              </div>
              <p class="card-text mb-auto text-muted ml-2 float-right">
                本月（季/年）已提问25个问题，还剩275个问题。
              </p>
            </div>
            <div class="mt-5">
              <p class="card-text mb-auto text-muted ml-2">
                固定流量包套餐
              </p>
              <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: 75%">
                  75%
                </div>
              </div>
              <p class="card-text mb-auto text-muted ml-2 float-right">
                固定流量包套餐已提问20个问题，还剩40个问题
              </p>
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
