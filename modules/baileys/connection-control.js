import { DisconnectReason } from 'baileys'
import { botConfigs } from '@misc/config-loader'

import fs from 'fs'
import readline from 'readline'

class ConnectionControl {
    constructor(socketInstance) {
        this.socket = socketInstance
        this.reconnectDelay = 5000
        this.maxRetry = 5
        this.retryCount = 0
    }

    async onConnectionUpdate(connection) {
        if (!connection) return
        console.log('🔔 Connection update : ', connection)
    }

    async onConnectionClose(lastDisconnect, authPath) {
        if (!lastDisconnect) return

        const code = lastDisconnect.error?.statusCode || lastDisconnect.error?.output?.statusCode
        console.log(`⚠️ Connection closed with code ${code}`)

        switch (code) {
            case DisconnectReason.loggedOut:
            case DisconnectReason.badSession:
            case DisconnectReason.multideviceMismatch:
            case DisconnectReason.connectionReplaced:
                console.log('⛔ Session invalid. Deleting auth...')
                try {
                    await fs.promises.rm(authPath, { recursive: true, force: true })
                    console.log('✅ Auth deleted. Please rescan QR.')
                    if (await botConfigs.getConfig('usePM2') == false) await this.#askToReconnect('Scan QR Again? [y/n]')
                    else setTimeout(() => this.socket.restartSocket(), this.reconnectDelay)
                } catch (err) {
                    console.error('❌ Failed to delete auth:', err)
                }
                break

            case DisconnectReason.connectionLost:
            case DisconnectReason.restartRequired:
            case DisconnectReason.connectionClosed:
            case 515:
                console.log('🔄 Attempting reconnect...')
                setTimeout(() => this.socket.restartSocket(), this.reconnectDelay)
                break
            case DisconnectReason.forbidden:
            case DisconnectReason.unavailableService:
                console.log(`🚨 Connection Forbidden or unvailable service, Reconnect...`)
                setTimeout(() => this.socket.restartSocket(), this.reconnectDelay)
                break
            default:
                console.log('⚠️ Unknown disconnect. Reconnecting...')
                setTimeout(() => this.socket.restartSocket(), this.reconnectDelay)
        }
    }

    async #askToReconnect(question = '') {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
        return new Promise(resolve => {
            rl.question(`${question}: `, async answer => {
                rl.close()
                if (answer.toLowerCase() === 'y') {
                    this.retryCount = 0
                    await this.socket.restartSocket()
                } else {
                    console.log('⛔ Exiting...')
                    process.exit(0)
                }
                resolve()
            })
        })
    }
}

export default ConnectionControl