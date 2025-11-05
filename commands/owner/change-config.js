import { botConfigs } from "@misc/config-loader"

export default {
    name: 'prefix-change',
    desc: '',
    access: 'owner',
    execute: async ({ args, pushName }) => {
        if (!args) return { text: 'Please provide new prefix' , outputType: 'text'}
        else {
            await botConfigs.changeConfigToDatabase('prefix', args[0])
            console.log('prefix changed by owner : ', pushName)
            return { text: `prefix changed to: "${args[0]}"`, outputType: 'text'}
        }
    }
}