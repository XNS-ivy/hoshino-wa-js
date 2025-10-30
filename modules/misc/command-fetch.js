import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const databasePath = path.resolve(__dirname, '../../databases/dbcommands.json')
const commandsPath = path.resolve(__dirname, '../../commands/')

export default class CommandFetch {
    constructor() {
        this.commands = new Map()
        this.commandData = new Map()
    }

    async init() {
        await this.loadCommands()
    }

    async loadCommands(dirPath = commandsPath) {
        const files = fs.readdirSync(dirPath)
        for (const file of files) {
            const fullPath = path.join(dirPath, file)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                await this.loadCommands(fullPath)
            } else if (file.endsWith('.js')) {
                const commandModule = await import(fullPath)
                const command = commandModule.default
                if (!command?.name || typeof command.execute !== 'function') continue
                this.commandData.set(command.name, command)
            }
        }
    }

    async fetchCommand(messagetext, { remoteJid, pushName, lid }) {
        const command = messagetext.split(" ")[0]
        const args = messagetext.split(" ").slice(1)
        this.saveCommandToDatabase({ lid, command, args, remoteJid, pushName })
    }

    async saveCommandToDatabase(commands) {
        console.log(commands)
    }
}

