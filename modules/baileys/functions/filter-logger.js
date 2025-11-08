import pino from 'pino'

export function createFilteredLogger(level = 'info') {
    const stream = {
        write: (msg) => {
            if (
                /Closing open session in favor of incoming prekey bundle/.test(msg) ||
                /Closing session: SessionEntry\s*\{/.test(msg)
            ) {
                console.log('⚙️ [Baileys] Closing session entry [filtered log]')
                return
            }

            process.stdout.write(msg)
        },
    }
    return pino(
        {
            level,
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
        },
        stream
    )
}
