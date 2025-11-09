import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const botConfigPath = path.resolve(__dirname, "../../configs/bot.json")

export class Configs {
    constructor() {
        this.configs = new Map()
    }
}

export class BotConfigs extends Configs {
    constructor() {
        super()
        this.ready = this.init()
    }

    async init() {
        await this.loadDefaultConfigs()
        await this.loadCustomConfigs()
    }

    async loadDefaultConfigs() {
        this.configs.set("prefix", ".")
        this.configs.set("owners", [])
    }

    async loadCustomConfigs() {
        if (!fs.existsSync(botConfigPath)) return
        const json = JSON.parse(fs.readFileSync(botConfigPath, "utf8"))
        for (const [key, val] of Object.entries(json)) {
            this.configs.set(key, val)
        }
    }

    async getConfig(key) {
        await this.ready
        return this.configs.get(key)
    }

    async getOwners() {
        await this.ready
        return this.configs.get("owners") || []
    }

    async addLocalOwner(localOwner) {
        await this.ready
        const owners = await this.getOwners()
        const exists = owners.some(o => o.lid === localOwner.lid)

        if (!exists) {
            owners.push(localOwner)
            this.configs.set("owners", owners)
            const obj = Object.fromEntries(this.configs)
            fs.writeFileSync(botConfigPath, JSON.stringify(obj, null, 4), "utf8")
            console.log(`✅ Added new owner : ${localOwner.name} (${localOwner.lid})`)
        } else {
            console.log(`ℹ️  Owner ${localOwner.name} (${localOwner.lid}) already exists.`)
        }
    }
    async getOwnerByLid(lid) {
        const owners = await this.getOwners()
        return owners.find(o => o.lid === Number(lid)) || null
    }
    async changeConfigToDatabase(key, val) {
        await this.ready
        if (!this.configs.has(key) && key !== 'owners') {
            throw new Error(`📢 Unknown config key: ${key}`)
        }
        if (key === 'owners') {
            const currentOwners = this.configs.get('owners') || []
            if (Array.isArray(val)) {
                this.configs.set('owners', val)
            }
            else if (typeof val === 'object' && val !== null) {
                const existing = currentOwners.find(o => o.lid === val.lid)

                if (existing) {
                    Object.assign(existing, val)
                } else {
                    currentOwners.push(val)
                }

                this.configs.set('owners', currentOwners)
            }

            else if (typeof val === 'number' || typeof val === 'string') {
                const lidNum = Number(val)
                const updated = currentOwners.filter(o => o.lid !== lidNum)
                this.configs.set('owners', updated)
            }
        }
        else {
            this.configs.set(key, val)
        }
        const obj = Object.fromEntries(this.configs)
        fs.writeFileSync(botConfigPath, JSON.stringify(obj, null, 4), "utf8")
        new Promise(resolve => setTimeout(resolve, 100))
        await this.init()
    }
}

export const botConfigs = new BotConfigs()