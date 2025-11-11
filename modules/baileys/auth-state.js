import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'
import { initAuthCreds, BufferJSON } from 'baileys'

export class ImprovedAuthWithCache {
  constructor(baseDir = './auth') {
    this.baseDir = baseDir
    this.credsPath = path.join(this.baseDir, 'creds.json')
    this.keysDir = path.join(this.baseDir, 'keys')
    fs.mkdirSync(this.keysDir, { recursive: true })
    this.cache = new NodeCache({ stdTTL: 1800, checkperiod: 600 })
    this.creds = this.#loadJSON(this.credsPath) || initAuthCreds()
    this.#cleanupOnExit()
  }
  #sanitizeFileName(name) {
    return name.replace(/[:<>"/\\|?*]/g, '_')
  }

  #loadJSON(file) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf-8'), BufferJSON.reviver)
      }
    } catch (e) {
      console.error('⚠️ [Auth] Failed to read', file, e)
    }
    return null
  }
  #saveJSON(file, data) {
    try {
      const baseName = this.#sanitizeFileName(path.basename(file))
      const dirName = path.dirname(file)
      const safeDir = path.resolve(dirName)
      const safeFile = path.join(safeDir, baseName)
      const tmp = safeFile + '.tmp'

      if (!fs.existsSync(safeDir)) fs.mkdirSync(safeDir, { recursive: true })
      fs.writeFileSync(tmp, JSON.stringify(data, BufferJSON.replacer, 2))
      fs.renameSync(tmp, safeFile)
    } catch (err) {
      console.error('❌ [Auth] Failed to save file:', file, err)
    }
  }
  saveCreds = () => this.#saveJSON(this.credsPath, this.creds)
  keys = {
    get: async (type, ids) => {
      const result = {}
      for (const id of ids) {
        const key = `${type}-${id}`
        const safeKey = key.replace(/[:<>"/\\|?*]/g, '_')

        let value = this.cache.get(safeKey)
        if (!value) {
          const keyPath = path.join(this.keysDir, `${safeKey}.json`)
          if (fs.existsSync(keyPath)) {
            value = this.#loadJSON(keyPath)
            this.cache.set(safeKey, value)
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
          const safeKey = key.replace(/[:<>"/\\|?*]/g, '_')
          const keyPath = path.join(this.keysDir, `${safeKey}.json`)
          const value = data[type][id]

          this.cache.set(safeKey, value)
          clearTimeout(this[`_save_${safeKey}`])
          this[`_save_${safeKey}`] = setTimeout(() => {
            this.#saveJSON(keyPath, value)
          }, 300)
        }
      }
    }
  }

  get state() {
    return { creds: this.creds, keys: this.keys }
  }
  #cleanupOnExit() {
    const cleanup = () => this.cache.flushAll()
    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }
}