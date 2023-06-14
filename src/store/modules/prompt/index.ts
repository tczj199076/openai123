// import { defineStore } from 'pinia'
// import type { PromptStore } from './helper'
// import { getLocalPromptList, setLocalPromptList } from './helper'

// export const usePromptStore = defineStore('prompt-store', {
//   state: (): PromptStore => getLocalPromptList(),

//   actions: {
//     updatePromptList(promptList: []) {
//       this.$patch({ promptList })
//       setLocalPromptList({ promptList })
//     },
//     getPromptList() {
//       return this.$state
//     },
//   },
// })

import { defineStore } from 'pinia'
import { getToken } from '../auth/helper'
import type { PromptList, PromptStore } from './helper'
import { fetchAndSaveTips, getLocalPromptList, setLocalPromptList } from './helper'

export const usePromptStore = defineStore('prompt-store', {
  state: (): PromptStore => {
    const localPromptList = getLocalPromptList()
    const token = getToken()
    if (token && localPromptList.promptList.length === 0) {
      fetchAndSaveTips().then((fetchedPromptList) => {
        usePromptStore().updatePromptList(fetchedPromptList)
      })
    }
    return localPromptList
  },

  actions: {
    updatePromptList(promptList: PromptList) {
      this.$patch({ promptList })
      setLocalPromptList({ promptList })
    },
    getPromptList() {
      return this.$state
    },
  },
})
