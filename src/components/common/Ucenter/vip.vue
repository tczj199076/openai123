<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
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

const data = ref<any>(null)
const loaded = ref(false)
// 请求接口并保存返回值到data
async function fetchData() {
  const response = await fetch('https://cms.openai123.vip/api/vip')
  const result = await response.json()
  data.value = result
  loaded.value = true
}

// 监听visible的变化，并在visible为true时调用fetchData方法
watch(() => props.visible, (newVal) => {
  if (newVal === true && !loaded.value)
    fetchData()
})

const buy = ref(false)
const confirmOrder = ref(false)

interface Product {
  id: number
  name: string
  price: number
  sub_name: string
  desc: string[]
}

const currentItem = ref<Product | null>(null)
</script>

<template>
  <NModal v-model:show="vip" style="width: 90%; max-width: 960px;background: linear-gradient(to bottom right, #728da8, #abadb9);" preset="card">
    <div v-if="loaded && buy">
      <div class="container">
        <div class="row mt-5">
          <div class="col-12 col-md-12">
            <p class="lead dark:text-black" style="font-weight:bold">
              商品信息
            </p>
            <div v-if="loaded && buy && currentItem">
              <div class="row  mt-2 dark:text-black" style="font-size:16px">
                <div class="col  text-center">
                  套餐名称：
                </div>
                <div class="col ">
                  {{ currentItem.name }}
                </div>
              </div>
              <div class="row  mt-2 dark:text-black" style="font-size:16px">
                <div class="col  text-center">
                  套餐金额：
                </div>
                <div class="col " style="color:#ff580b;font-weight: bold;">
                  {{ currentItem.price }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-12 ms-auto pt-5 pt-md-0">
            <form>
              <div class="row">
                <p class="lead dark:text-black" style="font-weight:bold">
                  订单信息
                </p>
              </div>
              <div class="row mt-2 dark:text-black" style="font-size:16px">
                <div class="col text-center">
                  订单号：
                </div>
                <div class="col ">
                  2023042680000001
                </div>
              </div>
              <div class="row mt-2 dark:text-black" style="font-size:16px">
                <div class="col text-center">
                  订单创建时间：
                </div>
                <div class="col ">
                  2023-04-26 11:12
                </div>
              </div>
              <div class="row mt-2 dark:text-black" style="font-size:16px">
                <div class="col text-center">
                  订单金额：
                </div>
                <div class="col ">
                  ￥100.00
                </div>
              </div>
              <div class="row mt-2 dark:text-black" style="font-size:16px">
                <div class="col text-center">
                  余额抵扣：
                </div>
                <div class="col">
                  <input type="email" class="form-control form-control-sm " placeholder="可用余额：￥20.00">
                </div>
              </div>
              <div class="row mt-2 dark:text-black" style="font-size:16px">
                <div class="col text-center">
                  实际支付：
                </div>
                <div class="col " style="color:#ff580b;font-weight: bold;">
                  ￥80.00
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <NButton type="info" block @click="buy = false;confirmOrder = false">
                  返回
                </NButton>
                <NButton class="mt-3" type="warning" block @click="confirmOrder = true">
                  确认订单
                </NButton>
              </div>
              <div v-if="loaded && data && confirmOrder" class="mt-5">
                <p class="lead dark:text-black" style="font-weight:bold">
                  支付方式
                </p>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- 初次加载时 -->
    <div v-else>
      <div class="pricing-header  px-3 py-3 pt-md-3 pb-md-3 mx-auto text-center">
        <p class="lead fs-2 dark:text-black">
          开通会员，获取AI聊天权限
        </p>
        <p class="lead dark:text-black">
          不同套餐，发送的消息次数不同。
        </p>
      </div>
      <div v-if="loaded && data">
        <div class="row row-cols-1 row-cols-md-3 mb-3 ">
          <div v-for="item in data.data.info" :key="item.id" class="col">
            <div class="card mb-4 shadow-sm border-0">
              <div class="card-body dark:text-black dark:bg-[#909eb1]" style="background: linear-gradient(to bottom right, #728da8, #abadb9);border-radius: 5px;">
                <p class="fs-5 ">
                  {{ item.name }}
                </p>
                <ul class="list-unstyled text-black" style="font-size:14px">
                  <li v-for="(desc, index) in item.desc" :key="index">
                    <span class=" mr-2" style="color:#fff !important;font-weight: bold;">√</span>{{ desc }}
                  </li>
                </ul>
                <p class="fs-5 font-weight" style="color:#ff580b;font-weight: bold;">
                  ￥{{ item.price }} <small class="text-dark">/ {{ item.sub_name }} </small>
                </p>
                <NButton type="warning" block @click="buy = true; currentItem = item">
                  {{ $t('store.vip') }}
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
