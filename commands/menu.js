import { botConfigs } from '@misc/config-loader'

export default {
    name: 'menu',
    desc: 'Display the list of available commands.',
    access: 'all',
    usage: ['menu', 'menu <access-category>'],
    execute: async ({ args }, commandData) => {
        const prefix = await botConfigs.getConfig('prefix')
        const accessOrder = ['owner', 'admin', 'premium', 'all']
        let targetAccess = args?.length
            ? args.map(a => a.toLowerCase())
            : accessOrder.filter(a => a !== 'owner')
        const filteredCommands = Array.from(commandData.values())
            .filter(cmd => targetAccess.includes(cmd.access?.toLowerCase() || 'all'))
            .sort((a, b) => {
                const aIndex = accessOrder.indexOf(a.access?.toLowerCase() || 'all')
                const bIndex = accessOrder.indexOf(b.access?.toLowerCase() || 'all')
                return aIndex - bIndex
            })
        const grouped = {}
        for (const cmd of filteredCommands) {
            const access = cmd.access?.toLowerCase() || 'all'
            if (!grouped[access]) grouped[access] = []
            grouped[access].push(cmd)
        }
        const menuSections = accessOrder
            .filter(acc => targetAccess.includes(acc) && grouped[acc])
            .map(acc => {
                const list = grouped[acc]
                    .map(cmd => `• ${prefix}${cmd.name} — ${cmd.desc || 'No description'}`)
                    .join('\n')
                return `🔹 *${acc.toUpperCase()} Commands:*\n${list}`
            })

        const menuText = `📜 *Command Menu*\n\n${menuSections.join('\n\n')}`
        return {
            text: menuText,
            outputType: 'text',
        }
    },
}