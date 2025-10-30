export default class MessageHandler {
    static denied = [
        'protocolMessage',
        'senderKeyDistributionMessage',
        'messageContextInfo'
    ]
    constructor() {}
    async messageFetch(rawMessage) {
        const { remoteJid } = rawMessage.key
        const { pushName, message, key } = rawMessage

        const res = Object.keys(message)
            .filter(key => !MessageHandler.denied.includes(key))
            .reduce((obj, key) => {
                obj[key] = message[key]
                return obj
            }, {}) || {}
        if (Object.keys(res).length === 0) return null

        const object = Object.keys(res)
        const text = res[object[0]]?.text || res[object[0]]?.caption || null

        const { contextInfo } = res[object[0]] || {}
        const { expiration } = contextInfo || {}
        const lid = key?.remoteJidAlt?.endsWith('@lid') ? Number(key.remoteJidAlt.split('@')[0]) : key?.participant?.endsWith('@lid') ? Number(key.participant.split('@')[0]) : null
        if (!text) return null
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