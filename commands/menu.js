export default {
    name: 'menu',
    description: 'Display the list of available commands.',
    execute: async ({}, commandData) => {
        const commandList = Array.from(commandData.values())
            .map(cmd => `• ${cmd.name} — ${cmd.description || 'No description'}`)
            .join('\n')

        const menuText = `📜 *Command Menu*\n\n${commandList}`

        return {
            text: menuText,
            outputType: 'text',
        }
    }
}