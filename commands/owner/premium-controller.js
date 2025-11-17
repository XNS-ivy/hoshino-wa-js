import { botConfigs } from "@misc/config-loader"

export default {
    name: 'add-prem',
    access: 'owner',
    desc: 'Add premium to user on group (owner only)',
    async execute({ isGroup, lid, args }) {
        const owners = await botConfigs.getOwnerByLid(lid)
        if (isGroup == false) {
            return { text: 'Adding Premium Member Must Be On Group!', outputType: 'text' }
        } if (!owners) {
            return { text: '❌ Sorry, you are not registered as an owner.', outputType: 'text' }
        }
        if (owners && isGroup == true) {

        }
    }
}