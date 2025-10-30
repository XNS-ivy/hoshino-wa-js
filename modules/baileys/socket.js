import { makeWASocket, useMultiFileAuthState } from "baileys"
import pino from 'pino'
import QRCode from 'qrcode'
import ConnectionControl from "@baileys/connection-control"
import MessageHandler from "./message-fetch"
import CommandFetch from '@misc/command-fetch'
import { BotConfigs } from '@misc/config-loader'

export default class Socket {
    constructor() {
        this.sock = null
        this.saveCreds = null
        this.ConnectionControl = null
        this.messageHandler = null
        this.botConfigs = new BotConfigs()
        this.commandFetch = new CommandFetch()
    }

    async init() {
        const { sock, saveCreds } = await this.socketConfig()
        this.sock = sock
        this.saveCreds = saveCreds
        this.ConnectionControl = new ConnectionControl(this)
        this.messageHandler = new MessageHandler()
        await this.commandFetch.init()
        await this.socketEvent()
    }

    async socketConfig() {
        const { state, saveCreds } = await useMultiFileAuthState('./auth')
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: "silent" })
        })
        return { sock, saveCreds }
    }

    async socketEvent() {
        const sock = this.sock
        const connectionControl = this.ConnectionControl
        sock.ev.on('creds.update', this.saveCreds)
        sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
            try {
                if (qr) console.log(await QRCode.toString(qr, { type: 'terminal', small: true, scale: 1 }))
                connectionControl.onConnectionUpdate(connection)

                if (connection === 'close') {
                    await connectionControl.onConnectionClose(lastDisconnect)
                }
            } catch (err) {
                console.error('Error handling connection update:', err)
            }
        })

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return

            for (const msg of messages) {
                if (!msg.pushName || msg.key.remoteJid === 'status@broadcast') continue
                const parsed = await this.messageHandler.messageFetch(msg)
                if (parsed) {
                    if (!parsed.text.startsWith(this.botConfigs.getConfig('prefix'))) continue
                    this.commandFetch.fetchCommand(
                        parsed.text.split(this.botConfigs.getConfig('prefix'))[1],
                        parsed
                    )
                }
            }
        })
    }

    async restartSocket() {
        try {
            console.log('Restarting socket...')
            await this.init()
        } catch (err) {
            console.error('Restart failed:', err)
        }
    }
}