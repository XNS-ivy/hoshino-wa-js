import { botConfigs } from "@misc/config-loader"
import { parseDeletePremiumArray } from "@misc/functions/parse-premium"
import { loadPremium } from "@misc/premium-loader"

export default {
    name: 'del-prem',
    access: 'owner',
    desc: 'Delete premium user (owner only)',
    usage: `del-prem <tag-member-1> <tag-member-N>`,
    async execute({ isGroup, lid, args }) {
        const owners = await botConfigs.getOwnerByLid(lid)
        if (!isGroup) {
            return { text: '❌ Delete Premium Must Be On Group!', outputType: 'text' }
        }
        if (!owners) {
            return { text: '❌ Sorry, you are not registered as an owner.', outputType: 'text' }
        }
        const parsed = parseDeletePremiumArray(args)
        const { ids, error } = parsed
        if (error) {
            return { text: `❌ ${error}`, outputType: "text" }
        }
        const result = await loadPremium.execute(ids, 'delete')
        const msgs = result.map(r => `• ${r.msg}`).join('\n')
        return { 
            text: `ℹ️ Hasil:\n${msgs}`, 
            outputType: 'text' 
        }
    }
}