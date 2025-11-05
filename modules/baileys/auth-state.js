import { initAuthCreds, BufferJSON } from 'baileys'
import fs from 'fs'
import path from 'path'

export async function useSingleFileAuthState(filePath = './auth/') {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true })
  }
  if (!filePath.endsWith('.json')) {
    filePath = path.join(filePath, 'creds.json')
  }

  let data
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'), BufferJSON.reviver)
  } catch {
    data = null
  }

  const creds = data?.creds || initAuthCreds()
  let keysStore = data?.keys || {}

  const save = () => {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ creds, keys: keysStore }, BufferJSON.replacer, 2)
    )
  }

  const keys = {
    get: async (type, ids) => {
      return Object.fromEntries(
        ids
          .map(id => [id, keysStore?.[type]?.[id]])
          .filter(([, v]) => v)
      )
    },
    set: async (updates) => {
      for (const type in updates) {
        keysStore[type] = keysStore[type] || {}
        Object.assign(keysStore[type], updates[type])
      }
      save()
    }
  }

  const saveCreds = save
  return { state: { creds, keys }, saveCreds }
}
