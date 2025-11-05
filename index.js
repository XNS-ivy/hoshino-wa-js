import { botConfigs } from "@misc/config-loader"
import Socket from "@baileys/socket"

const bot = new Socket()

await botConfigs.ready
await bot.init()