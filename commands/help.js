import { botConfigs } from '@misc/config-loader'

export default {
    name: 'help',
    desc: 'Provides a list of available commands or details for a specific one.',
    access: 'all',
    usage: ['help <comman-name>'],

    async execute({ args }, commandData) {
        const prefix = await botConfigs.getConfig('prefix')
        const accessOrder = ['owner', 'admin', 'premium', 'all']

        if (args && args.length > 0) {
            const cmdName = args[0].toLowerCase()
            const cmd = Array.from(commandData.values()).find(
                c => c.name.toLowerCase() === cmdName
            )

            if (!cmd) {
                return {
                    text: `❌ Command *${cmdName}* not found.`,
                    outputType: 'text',
                }
            }

            const detail = [
                `📘 *Command:* ${prefix}${cmd.name}`,
                `🧾 *Description:* ${cmd.desc || 'No description'}`,
                `🔑 *Access:* ${cmd.access || 'all'}`,
                cmd.args && cmd.args.length
                    ? `🎯 *Available Args:* ${cmd.args.join(', ')}`
                    : '',
                cmd.usage && cmd.usage.length
                    ? `💡 *Usage:* ${cmd.usage.map(u => `${prefix}${u}`).join('\n')}`
                    : ''
            ]
                .filter(Boolean)
                .join('\n')

            return { text: detail, outputType: 'text' }
        }
        const grouped = {}
        for (const cmd of commandData.values()) {
            const acc = cmd.access?.toLowerCase() || 'all'
            if (acc === 'owner') continue
            if (!grouped[acc]) grouped[acc] = []
            grouped[acc].push(cmd)
        }

        const sections = accessOrder
            .filter(acc => grouped[acc])
            .map(acc => {
                const list = grouped[acc]
                    .map(c => `• ${prefix}${c.name} — ${c.desc || 'No description'}`)
                    .join('\n')
                const emoji =
                    acc === 'owner' ? '👑' :
                        acc === 'admin' ? '⚙️' :
                            acc === 'premium' ? '💎' : '🌐'
                return `${emoji} *${acc.toUpperCase()} Commands:*\n${list}`
            })

        const text = `📜 *Command Help*\n\n${sections.join('\n\n')}`

        return { text, outputType: 'text' }
    }
}