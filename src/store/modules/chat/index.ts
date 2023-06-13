import { defineStore } from 'pinia'
import { getToken } from '../auth/helper'
import { getLocalState, setLocalState } from './helper'
import { router } from '@/router'
import { fetchClearChat, fetchCreateChatRoom, fetchDeleteChat, fetchDeleteChatRoom, fetchGetChatHistory, fetchGetChatRooms, fetchRenameChatRoom, fetchUpdateChatRoomUsingContext } from '@/api'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat.ChatState => getLocalState(),

  getters: {
    getChatHistoryByCurrentActive(state: Chat.ChatState) {
      const index = state.history.findIndex(item => item.uuid === state.active)
      if (index !== -1)
        return state.history[index]
      return null
    },

    getChatByUuid(state: Chat.ChatState) {
      return (uuid?: number) => {
        if (uuid)
          return state.chat.find(item => item.uuid === uuid)?.data ?? []
        return state.chat.find(item => item.uuid === state.active)?.data ?? []
      }
    },
  },

  actions: {
    async syncHistory(callback: () => void) {
      const rooms = (await fetchGetChatRooms()).data
      let uuid = this.active
      this.history = []
      this.chat = []
      if (rooms.findIndex((item: { uuid: number | null }) => item.uuid === uuid) <= -1)
        uuid = null

      for (const r of rooms) {
        this.history.unshift(r)
        if (uuid == null)
          uuid = r.uuid
        this.chat.unshift({ uuid: r.uuid, data: [] })
      }
      if (uuid == null) {
        await this.addHistory({ title: 'New Chat', uuid: Date.now(), isEdit: false, usingContext: true })
      }
      else {
        this.active = uuid
        this.reloadRoute(uuid)
      }
      callback && callback()
    },

    async syncChat(h: Chat.History, lastId?: number, callback?: () => void,
      callbackForStartRequest?: () => void,
      callbackForEmptyMessage?: () => void) {
      // 如果用户未登录，不加载历史记录
      const userToken = getToken()

      if (!h.uuid) {
        callback && callback()
        return
      }
      const hisroty = this.history.filter(item => item.uuid === h.uuid)[0]
      if (hisroty === undefined || hisroty.loading || hisroty.all) {
        if (lastId === undefined) {
          // 加载更多不回调 避免加载概率消失
          callback && callback()
        }
        if (hisroty?.all ?? false)
          callbackForEmptyMessage && callbackForEmptyMessage()
        return
      }
      try {
        hisroty.loading = true
        const chatIndex = this.chat.findIndex(item => item.uuid === h.uuid)
        if (chatIndex <= -1 || this.chat[chatIndex].data.length <= 0 || lastId !== undefined) {
          callbackForStartRequest && callbackForStartRequest()
          const chatData = (await fetchGetChatHistory(h.uuid, lastId)).data

          if (chatData.length <= 0)
            hisroty.all = true
          // 获取历史记录，然后请求一下接口，并将返回值追加到历史记录里，然后存localstorage，如果已经有storage，怎么不请求，也不添加。
          // storage只对当天有效。次日登录的时候，判断是否过期，如果过期，则清空storage，并继续请求
          // 获取登录次数
          // 如果用户未登录，不加载历史记录
          const today = new Date().toLocaleDateString()
          if (localStorage.getItem('lastLoginDate') !== today)
            localStorage.removeItem('tmp')
          let tmp
          if (!localStorage.getItem('tmp') && userToken) {
            const formData = new FormData()
            formData.append('token', getToken())
            const countResult = await fetch('https://cms.openai123.vip/api/getLoginCount', {
              method: 'POST',
              body: formData,
            })
            const responseJson = await countResult.json()
            const date = new Date()
            const formattedDate = date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
            if (responseJson && responseJson.data && responseJson.data.count === 1) {
              tmp = {
                uuid: 1682588796913,
                dateTime: formattedDate,
                text: `尊敬的主人，登录成功，我已为你赠送${responseJson.data.register_gift_num}次提问次数。以后每天登录将固定赠送${responseJson.data.login_gift_num}次/天。请开始你的提问吧~`,
                inversion: false,
                error: false,
                conversationOptions: null,
                requestOptions: {
                  prompt: '',
                  options: null,
                },
              }
              chatData.push(tmp)
              localStorage.setItem('tmp', JSON.stringify(tmp))
              localStorage.setItem('lastLoginDate', today)
            }
            else {
              tmp = {
                uuid: 1682588796913,
                dateTime: formattedDate,
                text: `尊敬的主人，登录成功。今天免费为您赠送${responseJson.data.login_gift_num}次。请开始你的提问吧~`,
                inversion: false,
                error: false,
                conversationOptions: null,
                requestOptions: {
                  prompt: '',
                  options: null,
                },
              }
              chatData.push(tmp)
              localStorage.setItem('tmp', JSON.stringify(tmp))
              localStorage.setItem('lastLoginDate', today)
            }
          }
          // 结束
          if (chatIndex <= -1)
            this.chat.unshift({ uuid: h.uuid, data: chatData })
          else
            this.chat[chatIndex].data.unshift(...chatData)
        }
      }
      finally {
        hisroty.loading = false
        if (hisroty.all)
          callbackForEmptyMessage && callbackForEmptyMessage()
        this.recordState()
        callback && callback()
      }
    },

    async  setUsingContext(context: boolean, roomId: number) {
      await fetchUpdateChatRoomUsingContext(context, roomId)
      this.recordState()
    },

    async addHistory(history: Chat.History, chatData: Chat.Chat[] = []) {
      await fetchCreateChatRoom(history.title, history.uuid)
      this.history.unshift(history)
      this.chat.unshift({ uuid: history.uuid, data: chatData })
      this.active = history.uuid
      this.reloadRoute(history.uuid)
    },

    updateHistory(uuid: number, edit: Partial<Chat.History>) {
      const index = this.history.findIndex(item => item.uuid === uuid)
      if (index !== -1) {
        this.history[index] = { ...this.history[index], ...edit }
        this.recordState()
        if (!edit.isEdit)
          fetchRenameChatRoom(this.history[index].title, this.history[index].uuid)
      }
    },

    async deleteHistory(index: number) {
      await fetchDeleteChatRoom(this.history[index].uuid)
      this.history.splice(index, 1)
      this.chat.splice(index, 1)

      if (this.history.length === 0) {
        await this.addHistory({ title: 'New Chat', uuid: Date.now(), isEdit: false, usingContext: true })
        return
      }

      if (index > 0 && index <= this.history.length) {
        const uuid = this.history[index - 1].uuid
        this.active = uuid
        this.reloadRoute(uuid)
        return
      }

      if (index === 0) {
        if (this.history.length > 0) {
          const uuid = this.history[0].uuid
          this.active = uuid
          this.reloadRoute(uuid)
        }
      }

      if (index > this.history.length) {
        const uuid = this.history[this.history.length - 1].uuid
        this.active = uuid
        this.reloadRoute(uuid)
      }
    },

    async setActive(uuid: number) {
      this.active = uuid
      return await this.reloadRoute(uuid)
    },

    getChatByUuidAndIndex(uuid: number, index: number) {
      if (!uuid || uuid === 0) {
        if (this.chat.length)
          return this.chat[0].data[index]
        return null
      }
      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1)
        return this.chat[chatIndex].data[index]
      return null
    },

    addChatByUuid(uuid: number, chat: Chat.Chat) {
      if (!uuid || uuid === 0) {
        if (this.history.length === 0) {
          const uuid = Date.now()
          fetchCreateChatRoom(chat.text, uuid)
          this.history.push({ uuid, title: chat.text, isEdit: false, usingContext: true })
          this.chat.push({ uuid, data: [chat] })
          this.active = uuid
          this.recordState()
        }
        else {
          this.chat[0].data.push(chat)
          if (this.history[0].title === 'New Chat') {
            this.history[0].title = chat.text
            fetchRenameChatRoom(chat.text, this.history[0].uuid)
          }
          this.recordState()
        }
      }

      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index !== -1) {
        this.chat[index].data.push(chat)
        if (this.history[index].title === 'New Chat') {
          this.history[index].title = chat.text
          fetchRenameChatRoom(chat.text, this.history[index].uuid)
        }
        this.recordState()
      }
    },

    updateChatByUuid(uuid: number, index: number, chat: Chat.Chat) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          chat.uuid = this.chat[0].data[index].uuid
          this.chat[0].data[index] = chat
          this.recordState()
        }
        return
      }

      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        chat.uuid = this.chat[chatIndex].data[index].uuid
        this.chat[chatIndex].data[index] = chat
        this.recordState()
      }
    },

    updateChatSomeByUuid(uuid: number, index: number, chat: Partial<Chat.Chat>) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          chat.uuid = this.chat[0].data[index].uuid
          this.chat[0].data[index] = { ...this.chat[0].data[index], ...chat }
          this.recordState()
        }
        return
      }

      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        chat.uuid = this.chat[chatIndex].data[index].uuid
        this.chat[chatIndex].data[index] = { ...this.chat[chatIndex].data[index], ...chat }
        this.recordState()
      }
    },

    deleteChatByUuid(uuid: number, index: number) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          fetchDeleteChat(uuid, this.chat[0].data[index].uuid || 0, this.chat[0].data[index].inversion)
          this.chat[0].data.splice(index, 1)
          this.recordState()
        }
        return
      }

      const chatIndex = this.chat.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1) {
        fetchDeleteChat(uuid, this.chat[chatIndex].data[index].uuid || 0, this.chat[chatIndex].data[index].inversion)
        this.chat[chatIndex].data.splice(index, 1)
        this.recordState()
      }
    },

    clearChatByUuid(uuid: number) {
      if (!uuid || uuid === 0) {
        if (this.chat.length) {
          fetchClearChat(this.chat[0].uuid)
          this.chat[0].data = []
          this.recordState()
        }
        return
      }

      const index = this.chat.findIndex(item => item.uuid === uuid)
      if (index !== -1) {
        fetchClearChat(uuid)
        this.chat[index].data = []
        this.recordState()
      }
    },

    async clearLocalChat() {
      this.chat = []
      this.history = []
      this.active = null
      this.recordState()
      await router.push({ name: 'Chat' })
    },

    async reloadRoute(uuid?: number) {
      this.recordState()
      await router.push({ name: 'Chat', params: { uuid } })
    },

    recordState() {
      setLocalState(this.$state)
    },
  },
})
