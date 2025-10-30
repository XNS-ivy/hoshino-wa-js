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
        this.init()
    }

    async init() {
        await this.loadDefaultConfigs()
        await this.loadCustomConfigs()
    }

    async loadDefaultConfigs() {
        this.configs.set("prefix", ".")
    }

    async loadCustomConfigs() {
        console.log("Loading custom configurations...")
        const isExist = fs.existsSync(botConfigPath)
        const parsing = JSON.parse(fs.readFileSync(botConfigPath, "utf8"))
        for (const [key, val] of Object.entries(parsing)) {
            this.configs.set(key, val)
        }
        if (isExist) {
            const json = JSON.parse(fs.readFileSync(botConfigPath, "utf8"))
            for (const [key, val] of Object.entries(json)) {
                this.configs.set(key, val)
            }
        }
    }
    getConfig(key) {
        return this.configs.get(key)
    }
    async changeConfigToDatabase(key, val) {
        this.configs.set(key, val)
        const obj = {}
        for (const [k, v] of this.configs) {
            obj[k] = v
        }
        fs.writeFileSync(botConfigPath, JSON.stringify(obj, null, 4), "utf8")
        this.loadCustomConfigs()
    }
    
}