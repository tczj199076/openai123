<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NButton, NModal } from 'naive-ui'
// import { useBasicLayout } from '@/hooks/useBasicLayout'
interface Emit {
  (e: 'update:visible', visible: boolean): void
}

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const vip = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

// 移动端自适应相关
// const { isMobile } = useBasicLayout()

const buy = ref(false)
</script>

<template>
  <NModal v-model:show="vip" style="width: 90%; max-width: 1200px;" preset="card">
    <div v-if="buy">
      <div class="container">
        <div class="row mt-5">
          <div class="col-12 col-md-6 col-lg-5">
            <h2>
              商品信息
            </h2>
            <div class="col text-center">
              <div class="card mb-4 shadow-sm">
                <div class="card-header">
                  <h4 class="my-0 fw-normal">
                    试用套餐
                  </h4>
                </div>
                <div class="card-body">
                  <h1 class="card-title pricing-card-title">
                    ￥5 <small class="text-dark">/ 算力包</small>
                  </h1>
                  <ul class="list-unstyled mt-3 mb-4 text-muted subtitle">
                    <li>折合每月5元/月</li>
                    <li>总共20次提问次数</li>
                    <li>限制1台设备使用</li>
                    <li>24h快速客服响应</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 ms-auto pt-5 pt-md-0">
            <form>
              <div class="row">
                <h2>
                  订单信息
                </h2>
              </div>
              <div class="row pl-5 mt-2">
                <div class="col lead">
                  订单号：
                </div>
                <div class="col lead">
                  2023042680000001
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <div class="col lead">
                  订单创建时间：
                </div>
                <div class="col lead">
                  2023-04-26 11:12
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <div class="col lead">
                  订单金额：
                </div>
                <div class="col lead">
                  ￥100.00
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <div class="col lead ">
                  余额抵扣：
                </div>
                <div class="col">
                  <input type="email" class="form-control form-control-sm" placeholder="可用余额：￥20.00">
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <div class="col lead ">
                  实际支付：
                </div>
                <div class="col lead">
                  ￥80.00
                </div>
              </div>
              <h2 class="mt-4">
                支付方式
              </h2>
              <div class="row mt-4 mb-20">
                <div class="col">
                  <div class="text-center">
                    <div style="position: relative; display: inline-block;">
                      <img src="https://bj.bcebos.com/qr-code/2304261188ccd46b05c3.jpg" style="width:150px;height:150px">
                      <span style="position: absolute; bottom: -1.5rem; left: 50%; transform: translateX(-50%); text-align:center;">微信</span>
                    </div>
                  </div>
                </div>
                <div class="col">
                  <div class="text-center">
                    <div style="position: relative; display: inline-block;">
                      <img src="https://bj.bcebos.com/qr-code/2304261188ccd46b05c3.jpg" style="width:150px;height:150px">
                      <span style="position: absolute; bottom: -1.5rem; left: 50%; transform: translateX(-50%); text-align:center;">支付宝</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- 初次加载时 -->
    <div v-else>
      <div class="pricing-header px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center">
        <h1 class="display-4">
          开通会员，获取AI聊天权限
        </h1>
        <p class="lead">
          不同套餐，发送的消息次数不同。
        </p>
      </div>
      <div class="row row-cols-1 row-cols-md-3 mb-3 text-center">
        <div class="col">
          <div class="card mb-4 shadow-sm">
            <div class="card-header">
              <h4 class="my-0 fw-normal">
                试用套餐
              </h4>
            </div>
            <div class="card-body">
              <h1 class="card-title pricing-card-title">
                ￥5 <small class="text-dark">/ 算力包</small>
              </h1>
              <ul class="list-unstyled mt-3 mb-4 text-muted subtitle">
                <li>折合每月5元/月</li>
                <li>总共20次提问次数</li>
                <li>限制1台设备使用</li>
                <li>24h快速客服响应</li>
              </ul>
              <NButton block @click="buy = true">
                {{ $t('store.vip') }}
              </NButton>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card mb-4 shadow-sm">
            <div class="card-header">
              <h4 class="my-0 fw-normal">
                简约月付套餐
              </h4>
            </div>
            <div class="card-body">
              <h1 class="card-title pricing-card-title">
                ￥29 <small class="text-dark">/ 月付</small>
              </h1>
              <ul class="list-unstyled mt-3 mb-4 text-muted subtitle">
                <li>折合每月29元/月</li>
                <li>每月300次提问次数</li>
                <li>限制1台设备使用</li>
                <li>24h快速客服响应</li>
              </ul>
              <NButton block>
                {{ $t('store.vip') }}
              </NButton>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card mb-4 shadow-sm">
            <div class="card-header">
              <h4 class="my-0 fw-normal">
                基础季付套餐
              </h4>
            </div>
            <div class="card-body">
              <h1 class="card-title pricing-card-title">
                ￥69 <small class="text-dark">/ 季付</small>
              </h1>
              <ul class="list-unstyled mt-3 mb-4 text-muted subtitle">
                <li>折合每月23元/月</li>
                <li>每月300次提问次数</li>
                <li>限制1台设备使用</li>
                <li>24h快速客服响应</li>
              </ul>
              <NButton block>
                {{ $t('store.vip') }}
              </NButton>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card mb-4 shadow-sm">
            <div class="card-header">
              <h4 class="my-0 fw-normal">
                奢华年付套餐
              </h4>
            </div>
            <div class="card-body">
              <h1 class="card-title pricing-card-title">
                ￥229 <small class="text-dark">/ 年付</small>
              </h1>
              <ul class="list-unstyled mt-3 mb-4 text-muted subtitle">
                <li>折合每月19元/月</li>
                <li>每月300次提问次数</li>
                <li>限制1台设备使用</li>
                <li>24h快速客服响应</li>
              </ul>
              <NButton block>
                {{ $t('store.vip') }}
              </NButton>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="card mb-4 shadow-sm">
            <div class="card-header">
              <h4 class="my-0 fw-normal">
                加量年付套餐
              </h4>
            </div>
            <div class="card-body">
              <h1 class="card-title pricing-card-title">
                ￥249 <small class="text-dark">/ 季付</small>
              </h1>
              <ul class="list-unstyled mt-3 mb-4 text-muted">
                <li>折合约每月21元/月</li>
                <li>每月400次提问次数</li>
                <li>限制1台设备使用</li>
                <li>24h快速客服响应</li>
              </ul>
              <NButton block>
                {{ $t('store.vip') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped src="@/styles/lib/editor.css"></style>

<style scoped src="@/styles/lib/bundle.css"></style>
