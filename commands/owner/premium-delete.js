import { botConfigs } from "@misc/config-loader"
import { parseDeletePremiumArray } from "@misc/functions/parse-premium"
import { loadPremium } from "@misc/premium-loader"

export default {
    name: 'delete-prem',
    access: 'owner',
    desc: 'Delete premium to user on group (owner only)',
    usage: `delete-prem <tag-member-1> <tag-member-N>`,
    async execute({ isGroup, lid, args }) {
        const owners = await botConfigs.getOwnerByLid(lid)
        if (isGroup == false) {
            return { text: 'Adding Premium Member Must Be On Group!', outputType: 'text' }
        } if (!owners) {
            return { text: '❌ Sorry, you are not registered as an owner.', outputType: 'text' }
        }
        if (owners && isGroup == true) {
            const { ids } = parseDeletePremiumArray(args)
            const result = await loadPremium.execute(ids, 'delete')
            for (const out of result) {
                return { text: `ℹ️ ${out.msg}.`, outputType: 'text' }
            }
        }
    }
}