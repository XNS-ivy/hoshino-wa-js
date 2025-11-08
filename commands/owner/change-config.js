import { botConfigs } from "@misc/config-loader"

export default {
    name: 'prefix-change',
    desc: '',
    access: 'owner',
    usage: 'prefix-change <your-prefix>',
    execute: async ({ args, pushName, lid }) => {
        console.log(lid)
        if (!args) return { text: 'Please provide new prefix', outputType: 'text' }
        if (!botConfigs.getOwnerByLid(lid)) return { text: 'Sorry you are not the owner', outputType: 'text'}
        else {
            await botConfigs.changeConfigToDatabase('prefix', args[0])
            console.log('prefix changed by owner : ', pushName)
            return { text: `prefix changed to: "${args[0]}"`, outputType: 'text' }
        }
    }
}