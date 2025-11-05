import { DisconnectReason } from 'baileys'

class ConnectionControl {
    constructor(socketInstance) {
        this.socket = socketInstance
        this.reconnectDelay = 5000 // 5 detik
        this.maxRetry = 5
        this.retryCount = 0
    }

    async onConnectionUpdate(connection) {
        if (!connection) return
        console.log('Connection update:', connection)
    }

    async onConnectionClose(lastDisconnect) {
        if (!lastDisconnect) return

        const code = lastDisconnect.error?.statusCode || lastDisconnect.error?.output?.statusCode

        if (code === DisconnectReason.loggedOut) {
            console.log('Logged out permanently, please delete auth file and scan QR again.')
            return
        }

        if (
            code === DisconnectReason.restartRequired ||
            code === DisconnectReason.connectionLost ||
            code === 515
        ) {
            if (this.retryCount >= this.maxRetry) {
                console.log('Max reconnect attempts reached. Exiting...')
                process.exit(1)
            }

            console.log(`Connection closed with code ${code}. Reconnecting in ${this.reconnectDelay/1000}s...`)
            this.retryCount++
            setTimeout(async () => {
                await this.socket.restartSocket()
            }, this.reconnectDelay)
            return
        }

        console.log('Unknown disconnect, reconnecting...')
        setTimeout(async () => {
            await this.socket.restartSocket()
        }, this.reconnectDelay)
    }

    resetRetryCount() {
        this.retryCount = 0
    }
}

export default ConnectionControl