import { botConfigs } from "@misc/config-loader"

export default {
    name: 'prefix-change',
    desc: 'Change the bot prefix (owner only).',
    access: 'owner',
    usage: 'prefix-change <your-prefix>',
    execute: async ({ args, pushName, commandID }) => {

        if (!args || args.length === 0) {
            return { text: 'Please provide a new prefix.', outputType: 'text' }
        }
        const owner = await botConfigs.getOwnerByLid(commandID)
        if (!owner) {
            return { text: '❌ Sorry, you are not registered as an owner.', outputType: 'text' }
        }

        await botConfigs.changeConfigToDatabase('prefix', args[0])
        console.log(`✅ Prefix changed by owner: ${pushName} (${commandID})`)

        return { text: `✅ Prefix successfully changed to: *${args[0]}*`, outputType: 'text' }
    }
}