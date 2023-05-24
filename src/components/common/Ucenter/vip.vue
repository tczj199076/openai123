<script setup lang='ts'>
import { computed, nextTick, ref, watch } from 'vue'
import { NButton, NModal, useMessage } from 'naive-ui'
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
// 在顶部定义一个新的ref，表示余额抵扣金额
const couponPrice = ref<number>(0)
const message = useMessage()

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

const inputRef = ref<HTMLInputElement | null>(null)
const balanceValue = ref(0)

// 计算属性，用于动态显示余额信息
const balance = computed(() => `￥${balanceValue.value}`)
async function handleBuy(item: Product) {
  try {
    // 调用接口获取余额信息
    const formData = new FormData()
    formData.append('token', getToken())
    const response = await fetch('https://cms.openai123.vip/api/getBalance', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code === 0) {
      balanceValue.value = result.data.info // 读取余额信息
    }
    else {
      // 处理请求失败的情况
      console.error('获取余额信息失败：', result.msg)
      message.error('获取余额信息失败，请检查网络连接或稍后重试！')
    }
  }
  catch (error) {
    // 处理网络错误等异常情况
    console.error('获取余额信息时发生异常：', error)
    message.error('获取余额信息失败，请检查网络连接或稍后重试！')
  }

  // 显示购买页面
  buy.value = true
  currentItem.value = item
}

const orderIdFinal = ref<string>('')
async function handleConfirmOrder() {
  const vip_id = currentItem.value?.id ?? ''
  const order_price = currentItem.value?.price ?? 0
  const actualPrice = order_price - couponPrice.value
  const price = actualPrice.toFixed(2)
  const coupon_price = inputRef.value?.value ?? ''

  try {
    const formData = new FormData()
    formData.append('token', getToken())
    formData.append('vip_id', vip_id.toString())
    formData.append('price', price.toString())
    formData.append('coupon_price', coupon_price)
    const response = await fetch('https://cms.openai123.vip/api/order/create', {
      method: 'POST',
      body: formData,
    })
    const result = await response.json()
    if (result.code === 0) {
      orderIdFinal.value = result.data.order_id // 保存订单ID到ref
      confirmOrder.value = true
      updateImageAndText(result)
    }
    else {
      message.error(result.info)
    }
  }
  catch (error) {
    message.error('创建订单失败，请检查网络连接或稍后重试！')
  }
}

function updateImageAndText(result: any): void {
  let count = 0
  const maxCount = 150 // 最大请求次数
  nextTick(() => {
    const wxImg = document.getElementById('wxImg') as HTMLImageElement
    const aliImg = document.getElementById('aliImg') as HTMLImageElement

    // 检查元素是否存在再更新 src 属性
    if (wxImg)
      wxImg.src = result.data.wx_url
    if (aliImg)
      aliImg.src = result.data.ali_url

    // 更新订单号和创建日期
    const orderId = document.getElementById('orderId')
    const orderTime = document.getElementById('orderTime')
    orderId!.textContent = result.data.order_id
    orderTime!.textContent = result.data.order_time

    // 每2秒请求一次订单状态，直到订单支付成功
    const intervalID = setInterval(async () => {
      try {
        const formData = new FormData()
        const token = getToken()
        if (token) {
          if (orderIdFinal.value) {
            // 执行相关操作
            formData.append('order_id', orderIdFinal.value)
          }
          formData.append('token', token)

          const response = await fetch('https://cms.openai123.vip/api/orderQuery', {
            method: 'POST',
            body: formData,
          })
          const result = await response.json()
          if (result.code === 0) {
            confirmOrder.value = false
            message.success('支付成功')
            clearInterval(intervalID) // 如果订单已支付成功，清除定时器并退出方法
            window.location.reload() // 刷新页面
          }
          else if (result.code === 2) {
            message.success(result.info)
            clearInterval(intervalID) // 如果订单已支付成功，清除定时器并退出方法
          }
        }
      }
      catch (error) {
        console.error('查询订单状态时发生异常：', error)
        message.warning('查询订单状态失败，请检查网络连接或稍后重试！')
      }

      // 每次请求之后将计数器加1，并判断是否达到最大值
      count++
      if (count >= maxCount) {
        clearInterval(intervalID) // 清除定时器
        message.warning('支付结果确认超时，请联系客服处理！') // 弹出提示信息
      }
    }, 2000)
  })
}

// 计算actualPrice的计算属性
const actualPrice = computed(() => {
  const currentItemPrice = currentItem.value?.price ?? 0
  const actualPrice = currentItemPrice - couponPrice.value
  return Math.max(actualPrice, 0).toFixed(2) // 添加Math.max方法，确保actualPrice的值最少等于0，并且保留两位小数
})

watch(
  () => inputRef.value?.value,
  (newVal) => {
    const num = Number(newVal || 0)
    if (num > balanceValue.value) { // 如果用户输入的余额抵扣金额大于可用余额，则将其设置为可用余额
      couponPrice.value = balanceValue.value
    }
    else {
      couponPrice.value = num // 否则直接更新couponPrice
    }
  },
)
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
              <div v-if="loaded && data && confirmOrder" class="mt-5">
                <div class="row mt-2 dark:text-black" style="font-size:16px">
                  <div class="col text-center">
                    订单号：
                  </div>
                  <div id="orderId" class="col " />
                </div>
                <div class="row mt-2 dark:text-black" style="font-size:16px">
                  <div class="col text-center">
                    订单创建时间：
                  </div>
                  <div id="orderTime" class="col " />
                </div>
              </div>
              <div v-if="loaded && buy && currentItem">
                <div class="row mt-2 dark:text-black" style="font-size:16px">
                  <div class="col text-center">
                    订单金额：
                  </div>
                  <div class="col ">
                    ￥ {{ currentItem.price }}
                  </div>
                </div>
                <div class="row mt-2 dark:text-black" style="font-size:16px">
                  <div class="col text-center">
                    余额抵扣：
                  </div>
                  <div class="col" style="display: flex; align-items: center;">
                    <input id="coupon_price" ref="inputRef" v-model="couponPrice" max="4" type="number" class="form-control form-control-sm" style="margin-right: 4px;">
                    <span style="font-size: 14px;">可用余额：{{ balance }}</span>
                  </div>
                </div>
                <div class="row mt-2 dark:text-black" style="font-size:16px">
                  <div class="col text-center">
                    实际支付：
                  </div>
                  <div class="col " style="color:#ff580b;font-weight: bold;">
                    ￥{{ actualPrice }}
                  </div>
                </div>
              </div>
              <div class="row pl-5 mt-4">
                <NButton type="info" block @click="buy = false;confirmOrder = false">
                  返回
                </NButton>
                <NButton class="mt-3" type="warning" block @click="handleConfirmOrder">
                  确认支付
                </NButton>
              </div>
              <div v-if="loaded && data && confirmOrder" class="mt-5">
                <p class="lead dark:text-black" style="font-weight:bold">
                  支付方式(支付完成前，请勿刷新页面)
                </p>
                <div class="row mt-4 mb-20">
                  <div class="col">
                    <div class="text-center">
                      <div style="position: relative; display: inline-block;">
                        <img id="wxImg" src="" style="width:150px;height:150px">
                        <span style="position: absolute; bottom: -1.5rem; left: 50%; transform: translateX(-50%); text-align:center;">微信</span>
                      </div>
                    </div>
                  </div>
                  <div class="col">
                    <div class="text-center">
                      <div style="position: relative; display: inline-block;">
                        <img id="aliImg" src="" style="width:150px;height:150px">
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
        <p class="lead fs-2 dark:text-black" style="font-weight:bold">
          开通会员，获取AI聊天权限
        </p>
        <p class="lead dark:text-black" style="font-weight:bold">
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
                <NButton type="warning" block @click="handleBuy(item)">
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
