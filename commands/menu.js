import { botConfigs } from '@misc/config-loader'
export default {
    name: 'menu',
    desc: 'Display the list of available commands.',
    accsess: 'all',
    execute: async ({ }, commandData) => {
        const prefix = await botConfigs.getConfig('prefix')
        const commandList = Array.from(commandData.values())
            .map(cmd => `${prefix}${cmd.name} — ${cmd.desc || 'No description'}`)
            .join('\n')

        const menuText = `📜 *Command Menu*\n\n${commandList}`
        return {
            text: menuText,
            outputType: 'text',
        }
    }
}