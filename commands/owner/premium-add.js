import { botConfigs } from "@misc/config-loader"
import { parsePremiumArray } from "@misc/functions/parse-premium"
import { loadPremium } from "@misc/premium-loader"

export default {
    name: 'add-prem',
    access: 'owner',
    desc: 'Add premium to user on group (owner only)',
    usage: `add-prem <tag-member-1> <tag-member-N> <days>`,
    async execute({ isGroup, lid, args }) {
        const owners = await botConfigs.getOwnerByLid(lid)
        const { ids, days } = parsePremiumArray(args)
        const result = await loadPremium.execute(ids, 'save', days)
        console.log({result})
        if (isGroup == false) {
            return { text: 'Adding Premium Member Must Be On Group!', outputType: 'text' }
        } if (!owners) {
            return { text: '❌ Sorry, you are not registered as an owner.', outputType: 'text' }
        }
        if (owners && isGroup == true) {

        }
    }
}