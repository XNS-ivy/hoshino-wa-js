import fs from 'fs'
import path from 'path'
import { initAuthCreds, BufferJSON } from 'baileys'

export class SingleFileAuth {
  constructor(authDir = './auth') {
    this.authDir = authDir
    this.authFile = path.join(authDir, 'creds.json')

    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true })
    }
    this.data = this.#loadData()
    this.creds = this.data.creds || initAuthCreds()
    this.keysStore = this.data.keys || {}
  }
  #loadData() {
    try {
      if (fs.existsSync(this.authFile)) {
        const raw = fs.readFileSync(this.authFile, 'utf-8')
        return JSON.parse(raw, BufferJSON.reviver)
      }
    } catch (err) {
      console.error('❌ [Auth] Failed to load creds.json:', err)
    }
    return {}
  }
  save() {
    try {
      fs.writeFileSync(
        this.authFile,
        JSON.stringify({ creds: this.creds, keys: this.keysStore }, BufferJSON.replacer, 2)
      )
    } catch (err) {
      console.error('❌ [Auth] Failed to save creds.json:', err)
    }
  }
  get keys() {
    return {
      get: async (type, ids) => {
        return Object.fromEntries(
          ids
            .map(id => [id, this.keysStore?.[type]?.[id]])
            .filter(([, v]) => v)
        )
      },
      set: async (updates) => {
        for (const type in updates) {
          this.keysStore[type] = this.keysStore[type] || {}
          Object.assign(this.keysStore[type], updates[type])
        }
        this.save()
      }
    }
  }
  get state() {
    return {
      creds: this.creds,
      keys: this.keys
    }
  }

  get saveCreds() {
    return this.save.bind(this)
  }
}