import { botConfigs } from "@misc/config-loader"

export default class MessageHandler {
    static denied = [
        'protocolMessage',
        'senderKeyDistributionMessage',
        'messageContextInfo'
    ]

    constructor(sock) {
        this.sock = sock
    }
    async messageFetch(rawMessage) {
        if (!rawMessage.message) return null
        const { remoteJid } = rawMessage.key
        const { pushName, message, key } = rawMessage
        if (await botConfigs.getConfig('debugMessage') === true) console.log(`💬 got new message : ${JSON.stringify(message)}\nfrom : ${pushName}`)
        const res = Object.keys(message)
            .filter(key => !MessageHandler.denied.includes(key))
            .reduce((obj, key) => {
                obj[key] = message[key]
                return obj
            }, {}) || {}

        const object = Object.keys(res)
        const first = res[object[0]]
        const text =
            first?.text.toLowerCase() ??
            first?.caption.toLowerCase() ??
            res.conversation.toLowerCase() ??
            null

        const { contextInfo } = res[object[0]] || {}
        const { expiration } = contextInfo || {}
        const lid = key?.remoteJidAlt?.endsWith('@lid') ? Number(key.remoteJidAlt.split('@')[0]) : key?.participant?.endsWith('@lid') ? Number(key.participant.split('@')[0]) : null
        if (!text) return null
        if (await botConfigs.getConfig('debugMessage') === true) console.log(`💬 got new message after fetch : ${text}\nfrom : ${pushName}`)
        return {
            remoteJid,
            lid,
            pushName,
            text,
            key,
            expiration,
            res,
            rawMessage,
        }
    }
}