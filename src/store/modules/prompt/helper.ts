// import { ss } from '@/utils/storage'

// const LOCAL_NAME = 'promptStore'

// export type PromptList = []

// export interface PromptStore {
//   promptList: PromptList
// }

// export function getLocalPromptList(): PromptStore {
//   const promptStore: PromptStore | undefined = ss.get(LOCAL_NAME)
//   return promptStore ?? { promptList: [] }
// }

// export function setLocalPromptList(promptStore: PromptStore): void {
//   ss.set(LOCAL_NAME, promptStore)
// }

import { getToken } from '../auth/helper'
import { ss } from '@/utils/storage'

export type PromptList = {
  key: string
  value: string
}[]

export interface PromptStore {
  promptList: PromptList
}

const localStorageKey = (date: string) => `tips_${date}`

export function getLocalPromptList(): PromptStore {
  const dateKey = localStorageKey(new Date().toISOString().slice(0, 10))
  const promptStore: PromptStore | undefined = ss.get(dateKey)

  return promptStore ?? { promptList: [] }
}

export function setLocalPromptList(promptStore: PromptStore): void {
  const dateKey = localStorageKey(new Date().toISOString().slice(0, 10))
  ss.set(dateKey, promptStore)
}

export async function fetchAndSaveTips(): Promise<PromptList> {
  const formData = new FormData()
  formData.append('token', getToken())
  const response = await fetch('https://cms.openai123.vip/api/help', {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()

  const categories = Object.values(data.data.info)

  const promptList: PromptList = categories.flat().map((item: any) => ({
    key: item.content,
    value: item.desc,
  }))

  setLocalPromptList({ promptList })
  return promptList
}
