import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { botConfigs } from './config-loader'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const databasePath = path.resolve(__dirname, '../../databases/dbcommands.json')
const commandsPath = path.resolve(__dirname, '../../commands/')

export default class CommandFetch {
    constructor() {
        this.commands = new Map()
        this.commandData = new Map()
        this.commandQueue = []
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

    async fetchCommand(messagetext, { remoteJid, pushName, lid, expiration, rawMessage }) {
        const command = messagetext.split(" ")[0]
        const args = messagetext.split(" ").slice(1)
        if (!this.commandData.has(command)) return null
        this.saveCommandToDatabase({ lid, command, args, remoteJid, pushName, expiration, rawMessage })
    }

    async saveCommandToDatabase(commands) {
        const newCommand = {
            commandID: Date.now(),
            lid: commands.lid,
            remoteJid: commands.remoteJid,
            replyExpiration: commands.expiration,
            pushName: commands.pushName,
            name: commands.command,
            args: commands.args,
            status: 'pending',
            keyQuoted: commands.rawMessage,
        }
        let dbCommands = []
        if (fs.existsSync(databasePath)) {
            const rawData = fs.readFileSync(databasePath)
            dbCommands = JSON.parse(rawData)
        }
        const userIndex = dbCommands.findIndex(entry => entry.lid === commands.lid)

        if (userIndex !== -1) {
            dbCommands[userIndex].commands.push(newCommand)
        } else {
            dbCommands.push({
                lid: commands.lid,
                pushName: commands.pushName,
                commands: [newCommand],
                userExpired: Date.now() + 7 * 24 * 60 * 60 * 1000,
            })
        }
        fs.writeFileSync(databasePath, JSON.stringify(dbCommands, null, 2))
    }
    async updateCommandStatus(commandID, status) {
        const rawData = fs.readFileSync(databasePath)
        const dbCommands = JSON.parse(rawData)
        let found = false

        for (const entry of dbCommands) {
            for (const cmd of entry.commands) {
                if (cmd.commandID == commandID) {
                    cmd.status = status
                    found = true
                    break
                }
            }
            if (found) break
        }

        fs.writeFileSync(databasePath, JSON.stringify(dbCommands, null, 2))
    }

    async checkCommand() {
        if (!fs.existsSync(databasePath)) return

        const rawData = fs.readFileSync(databasePath)
        const dbCommands = JSON.parse(rawData)
        let modified = false
        const now = Date.now()

        const filteredDb = dbCommands
            .map(entry => {
                if (entry.userExpired && entry.userExpired < now) {
                    console.log(`⏰ User ${entry.lid} expired and removed.`)
                    modified = true
                    return null
                }
                const activeCommands = []
                for (const command of entry.commands) {
                    if (command.status === 'pending') {
                        if (!this.commandQueue.includes(command.commandID)) {
                            this.commandQueue.push(command.commandID)
                        }
                        activeCommands.push(command)
                    } else {
                        modified = true
                    }
                }

                entry.commands = activeCommands
                return entry.commands.length > 0 ? entry : null
            })
            .filter(Boolean)

        if (modified) {
            fs.writeFileSync(databasePath, JSON.stringify(filteredDb, null, 2))
        }
    }



    async executeCommand() {
        await this.checkCommand()

        while (this.commandQueue.length > 0) {
            const commandID = this.commandQueue.shift()
            const rawData = fs.readFileSync(databasePath)
            const dbCommands = JSON.parse(rawData)
            const entry = dbCommands.find(e => e.commands.some(cmd => cmd.commandID === commandID))
            const commandToExecute = entry?.commands.find(cmd => cmd.commandID === commandID)
            if (!commandToExecute) continue

            const commandData = this.commandData.get(commandToExecute.name)
            if (commandData) {
                try {
                    const output = await commandData.execute(commandToExecute, this.commandData)
                    if (await botConfigs.getConfig('debugCommand') == true) console.log(commandToExecute)
                    if (output) {
                        await this.updateCommandStatus(commandToExecute.commandID, 'completed')
                        return { info: commandToExecute, output }
                    }
                } catch (err) {
                    console.error('Error executing command:', err)
                    await this.updateCommandStatus(commandToExecute.commandID, 'failed')
                    return { info: commandToExecute, output: { text: '❌ Error executing command.', outputType: 'text' } }
                }
            }
        }
    }
}
