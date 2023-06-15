import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { getCacheConfig } from '../storage/config'
import { getUserById } from '../storage/mongo'
import { Status } from '../storage/model'

const auth = async (req, res, next) => {
  const config = await getCacheConfig()
  if (config.siteConfig.loginEnabled) {
    try {
      // 临时修改，用户免登录可聊天
      let token = req.header('Authorization')
      let info = { userId: '64721746d7ec1f8002965101' }
      if (token) {
        token = token.replace('Bearer ', '')
        info = jwt.verify(token, config.siteConfig.loginSalt.trim())
      }
      // 修改结束
      // const token = req.header('Authorization').replace('Bearer ', '')
      // const info = jwt.verify(token, config.siteConfig.loginSalt.trim())
      req.headers.userId = info.userId
      const user = await getUserById(info.userId)
      if (user == null || user.status !== Status.Normal)
        throw new Error('用户不存在 | User does not exist.')
      else
        next()
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    // fake userid
    req.headers.userId = '6406d8c50aedd633885fa16f'
    next()
  }
}

async function getUserId(req: Request): Promise<string | undefined> {
  try {
    let token = req.header('Authorization')
    let info = { userId: '64721746d7ec1f8002965101' }
    const config = await getCacheConfig()
    if (token) {
      token = token.replace('Bearer ', '')
      info = jwt.verify(token, config.siteConfig.loginSalt.trim())
    }
    // const token = req.header('Authorization').replace('Bearer ', '')
    // const config = await getCacheConfig()
    // const info = jwt.verify(token, config.siteConfig.loginSalt.trim())
    return info.userId
  }
  catch (error) {

  }
  return null
}

export { auth, getUserId }
