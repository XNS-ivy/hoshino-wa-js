import { botConfigs } from "@misc/config-loader"

export default {
    name: "help",
    desc: "Displays usage and details for a specific command.",
    access: "all",
    usage: ["help", "help <command>"],

    execute: async ({ args }, commands) => {
        const prefix = await botConfigs.getConfig('prefix')

        if (args.length > 0) {
            const commandName = args[0].toLowerCase()
            const command = [...commands.values()].find(cmd => cmd.name === commandName)

            if (!command) {
                return {
                    text: `❌ Command *${commandName}* was not found.`,
                    outputType: 'text'
                }
            }

            const usageText = Array.isArray(command.usage)
                ? command.usage.map(u => `• ${prefix}${u}`).join('\n')
                : `• ${prefix}${command.usage}`

            const info = `📘 *Help: ${command.name}*\n\n`
                + `📝 Description: ${command.desc || 'No description provided.'}\n`
                + `🔧 Access: ${command.access || 'all'}\n`
                + `📚 Usage:\n${usageText}`

            return {
                text: info,
                outputType: 'text'
            }
        } else {
            return {
                text: `ℹ️ Use *${prefix}help <command>* to view details of a command.\n\nExamples:\n• ${prefix}help menu\n• ${prefix}help ping`,
                outputType: 'text'
            }
        }
    }
}
