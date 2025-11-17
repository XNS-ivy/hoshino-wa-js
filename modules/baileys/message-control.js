import { botConfigs } from "@misc/config-loader"
import { getLID } from "./functions/get-lid"

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
        const isGroup = rawMessage.key.remoteJid.endsWith('@g.us') ? true : false
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
        const text = (
            first?.text ||
            first?.caption ||
            res?.conversation || ''
        ).toLowerCase() || null

        const { contextInfo } = res[object[0]] || {}
        const { expiration } = contextInfo || {}
        const lid = getLID(key)
        if (!text) return null
        if (await botConfigs.getConfig('debugMessage') === true) console.log(`💬 got new message after fetch : ${text}\nfrom : ${pushName}`)
        return {
            remoteJid,
            lid,
            isGroup,
            pushName,
            text,
            key,
            expiration,
            res,
            rawMessage,
        }
    }
}