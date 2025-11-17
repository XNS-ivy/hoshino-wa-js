export function getLID(key){
    const lid = key?.remoteJid?.endsWith('@lid') ? Number(key.remoteJid.split('@')[0]) : key?.participant?.endsWith('@lid') ? Number(key.participant.split('@')[0]) : null
    return lid
}