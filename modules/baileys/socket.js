import { makeWASocket } from "baileys"
import { SingleFileAuth } from "./auth-state"
import QRCode from 'qrcode'
import ConnectionControl from "@baileys/connection-control"
import MessageHandler from "./message-control"
import CommandFetch from '@misc/command-fetch'
import { botConfigs } from "@misc/config-loader"
import NodeCache from "node-cache"
import { createFilteredLogger } from './functions/filter-logger'

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
        this.auth = new SingleFileAuth(this.authFolderName)
        const { sock, saveCreds } = await this.socketConfig()
        this.sock = sock
        this.saveCreds = saveCreds
        this.ConnectionControl = new ConnectionControl(this)
        this.botConfigs = botConfigs
        this.messageHandler = new MessageHandler(sock)
        this.commandFetch = new CommandFetch()
        await this.commandFetch.init()
        await this.socketEvent()
        this.startCommandLoop()
    }

    async socketConfig() {
        const { state, saveCreds } = this.auth
        const filteredLogger = createFilteredLogger('silent')
        this.groupCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60, useClones: false })
        const sock = makeWASocket({
            auth: state,
            logger: filteredLogger,
            printQRInTerminal: false,
            markOnlineOnConnect: false,
            cachedGroupMetadata: async (jid) => this.groupCache.get(jid)
        })
        return { sock, saveCreds }
    }

    async socketEvent() {
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
                if (parsed) {
                    if (!parsed.text.startsWith(await botConfigs.getConfig('prefix'))) continue
                    this.commandFetch.fetchCommand(
                        parsed.text.split(await botConfigs.getConfig('prefix'))[1],
                        parsed
                    )
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
    async startCommandLoop() {
        try {
            while (true) {
                const result = await this.commandFetch.executeCommand()
                if (result) {
                    const { info, output } = result
                    const { outputType, text, mediaUrl } = output
                    const { remoteJid, replyExpiration, keyQuoted } = info
                    if (outputType === 'text') {
                        await this.sock.sendMessage(remoteJid, { text: text }, { quoted: keyQuoted, ephemeralExpiration: replyExpiration })
                        continue
                    }
                }
                await new Promise(r => setTimeout(r, 5000))
            }
        } catch (err) {
            console.error('❌ Error in command loop:', err)
        }
    } catch(err) {
        console.error('❌ Error in command loop:', err)
    }
}