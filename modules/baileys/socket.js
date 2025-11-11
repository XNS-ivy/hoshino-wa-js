import { makeWASocket } from "baileys"
import { ImprovedAuthWithCache } from "./auth-state"
import QRCode from 'qrcode'
import ConnectionControl from "@baileys/connection-control"
import MessageHandler from "./message-control"
import CommandFetch from '@misc/command-fetch'
import { botConfigs } from "@misc/config-loader"
import NodeCache from "node-cache"
import { createFilteredLogger } from './functions/filter-logger'
import fs from 'fs'

export default class Socket {
    constructor() {
        this.sock = null
        this.saveCreds = null
        this.ConnectionControl = null
        this.messageHandler = null
        this.authFolderName = null
        this.setlocalowner = null
    }

    async init(authenticationFolderName = 'auth') {
        this.authFolderName = authenticationFolderName
        this.auth = new ImprovedAuthWithCache(this.authFolderName)
        const { sock, saveCreds } = await this.#socketConfig()
        this.sock = sock
        this.saveCreds = saveCreds
        this.ConnectionControl = new ConnectionControl(this)
        this.botConfigs = botConfigs
        this.prefix = await botConfigs.getConfig('prefix')
        this.messageHandler = new MessageHandler(sock)
        this.commandFetch = new CommandFetch()
        await this.commandFetch.init()
        await this.#socketEvent()
        this.#startCommandLoop()
        this.#cleanupOnExit()
    }

    async #socketConfig() {
        const { state, saveCreds } = this.auth
        const filteredLogger = createFilteredLogger('silent')
        this.groupCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60, useClones: false })
        const sock = makeWASocket({
            auth: state,
            logger: filteredLogger,
            printQRInTerminal: false,
            markOnlineOnConnect: false,
            cachedGroupMetadata: async (jid) => this.groupCache.get(jid),
            generateHighQualityLinkPreview: true,
        })
        return { sock, saveCreds }
    }

    async #socketEvent() {
        this.sock.ev.on('creds.update', this.saveCreds)
        this.sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
            try {
                if (qr) console.log(await QRCode.toString(qr, { type: 'terminal', small: true, scale: 1 }))
                this.ConnectionControl.onConnectionUpdate(connection)

                if (connection === 'close') {
                    await this.ConnectionControl.onConnectionClose(lastDisconnect, this.authFolderName)
                }
                if (connection === 'open') {
                    this.setlocalowner = Number(this.sock.user.lid.split(':')[0])
                    const ownerData = {
                        lid: this.setlocalowner,
                        name: this.sock.user.name || "Unnamed Owner",
                        contact: this.sock.user.id?.replace(/:[0-9]+/g, "") || ""
                    }
                    await this.botConfigs.addLocalOwner(ownerData)
                    console.log(`✅ Setting local owner : ${this.setlocalowner}\n✅ Name local owner : ${this.sock.user.name}`)
                }

            } catch (err) {
                console.error('❌ Error handling connection update:', err)
            }
        })

        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return

            for (const msg of messages) {
                if (!msg.pushName || msg.key.remoteJid === 'status@broadcast') continue
                const parsed = await this.messageHandler.messageFetch(msg)
                const prefix = this.prefix
                if (!parsed) continue
                switch (true) {
                    case parsed.text.startsWith(prefix):
                        this.commandFetch.fetchCommand(parsed.text.slice(prefix.length).trim(), parsed)
                        break
                    case parsed.text.startsWith('hoshino'):
                    case parsed.text.startsWith('hoshino bot'):
                        const text = `Hi _${parsed.pushName}_\nTo Use Bot Feature Type "_${prefix}menu_"\n\nLove you from _Ojiisan_`
                        const stikerPath = 'src/static/image/wave.webp'
                        const sticker = fs.readFileSync(stikerPath)
                        await this.sock.sendMessage(parsed.remoteJid, { text: text }, { quoted: parsed.rawMessage, ephemeralExpiration: parsed.expiration })
                        await this.sock.sendMessage(parsed.remoteJid, { sticker: sticker }, { quoted: parsed.rawMessage, ephemeralExpiration: parsed.expiration })
                        break
                    default:
                        break
                }
            }
        })

        this.sock.ev.on('groups.update', async ([event]) => {
            try {
                const metadata = await this.sock.groupMetadata(event.id)
                this.groupCache.set(event.id, metadata)
            } catch (e) {
                console.error('❌ Error updating group cache:', e)
            }
        })
        this.sock.ev.on('group-participants.update', async (event) => {
            try {
                const metadata = await this.sock.groupMetadata(event.id)
                this.groupCache.set(event.id, metadata)
            } catch (e) {
                console.error('❌ Error updating participant cache:', e)
            }
        })
    }

    async restartSocket() {
        try {
            console.log('🔄 Restarting socket...')
            await this.init()
        } catch (err) {
            console.error('❌ Restart failed:', err)
        }
    }
    async #startCommandLoop() {
        try {
            while (true) {
                const result = await this.commandFetch.executeCommand()
                if (result) {
                    const { info, output } = result
                    const { outputType, text, mediaURL } = output
                    const { remoteJid, replyExpiration, keyQuoted } = info
                    if (outputType === 'text') {
                        await this.sock.sendMessage(remoteJid, { text: text }, { quoted: keyQuoted, ephemeralExpiration: replyExpiration })
                        continue
                    }
                }
                await new Promise(r => setTimeout(r, 5000))
            }
        } catch (error) {
            console.error('❌ Error in command loop')
        }
    }
    #cleanupOnExit() {
        const cleanup = () => this.groupCache.flushAll()
        process.on('exit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
    }
}