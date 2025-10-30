import { DisconnectReason } from 'baileys'

class ConnectionControl {
    constructor(socketInstance) {
        this.socket = socketInstance
    }

    async onConnectionUpdate(connection) {
        if (!connection) return
        console.log('Connection update:', connection)
    }

    async onConnectionClose(lastDisconnect) {
        if (!lastDisconnect) return

        const code = lastDisconnect.error?.statusCode || lastDisconnect.error?.output?.statusCode
        if (code === DisconnectReason.restartRequired) {
            console.log('Restart requested...')
            await this.socket.restartSocket()
        }
    }
}

export default ConnectionControl