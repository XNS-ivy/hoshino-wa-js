import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import { initAuthCreds, BufferJSON } from 'baileys'

export class ImprovedAuthWithCache {
  constructor(baseDir = './auth') {
    this.baseDir = baseDir
    this.credsPath = path.join(baseDir, 'creds.json')
    this.keysDir = path.join(baseDir, 'keys')
    fs.mkdirSync(this.keysDir, { recursive: true })

    this.cache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
    this.creds = this.#loadJSON(this.credsPath) || initAuthCreds()
  }

  #loadJSON(file) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf-8'), BufferJSON.reviver)
      }
    } catch (e) {
      console.error('⚠️ [Auth] Failed To Read', file, e)
    }
    return null
  }

  #saveJSON(file, data) {
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, BufferJSON.replacer, 2))
    fs.renameSync(tmp, file)
  }

  saveCreds = () => this.#saveJSON(this.credsPath, this.creds)

  keys = {
    get: async (type, ids) => {
      const result = {}
      for (const id of ids) {
        const key = `${type}-${id}`
        let value = this.cache.get(key)
        if (!value) {
          const keyPath = path.join(this.keysDir, `${key}.json`)
          if (fs.existsSync(keyPath)) {
            value = this.#loadJSON(keyPath)
            this.cache.set(key, value)
          }
        }

        if (value) result[id] = value
      }
      return result
    },

    set: async (data) => {
      for (const type in data) {
        for (const id in data[type]) {
          const key = `${type}-${id}`
          const keyPath = path.join(this.keysDir, `${key}.json`)
          const value = data[type][id]
          this.cache.set(key, value)
          clearTimeout(this[`_save_${key}`])
          this[`_save_${key}`] = setTimeout(() => {
            this.#saveJSON(keyPath, value)
          }, 300)
        }
      }
    }
  }

  get state() {
    return { creds: this.creds, keys: this.keys }
  }
}