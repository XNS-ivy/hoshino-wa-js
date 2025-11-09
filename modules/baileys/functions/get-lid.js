export function getLID(key){
    const lid = key?.remoteJidAlt?.endsWith('@lid') ? Number(key.remoteJidAlt.split('@')[0]) : key?.participant?.endsWith('@lid') ? Number(key.participant.split('@')[0]) : null
    return lid
}