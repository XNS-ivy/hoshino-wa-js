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

    async changeConfigToDatabase(key, val) {
        this.configs.set(key, val)
        const obj = Object.fromEntries(this.configs)
        fs.writeFileSync(botConfigPath, JSON.stringify(obj, null, 4), "utf8")
        new Promise(resolve => setTimeout(resolve, 100))
        await this.init()
    }
}

export const botConfigs = new BotConfigs()