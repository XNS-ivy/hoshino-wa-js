import axios from 'axios'
import { botConfigs } from '@misc/config-loader'
import { loadPremium } from '@misc/premium-loader'
export default {
    name: 'waifu-nsfw',
    desc: 'Send a random anime image (NSFW & Premium / Owner Only)',
    access: 'premium',
    args: ['waifu', 'neko', 'trap', 'blowjob'],
    usage: ['waifu-nsfw <type>'],
    async execute({ lid, args }) {
        const owners = await botConfigs.getOwnerByLid(lid)
        const premium = await loadPremium.execute(lid, 'check')
        if (!owners || !premium) {
            return {
                text: 'You are not allowed to use this premium command, please subscribe to premium to use it.',
                outputType: 'text'
            }
        } else {
            const available = this.args
            const input = args?.[0]?.toLowerCase()
            const category = available.includes(input) ? input : 'waifu'
            if (input && !available.includes(input)) {
                const listText = available.map(a => `• ${a}`).join('\n')
                return {
                    text: `❌ Invalid category: *${input}*\n\n✅ Available types:\n${listText}`,
                    outputType: 'text',
                }
            }

            try {
                const res = await axios.get(`https://api.waifu.pics/nsfw/${category}`)
                const imgUrl = res.data.url

                if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                    return {
                        mediaURL: imgUrl,
                        text: `🖼️ Here's your random *${category}* image!`,
                        outputType: 'imageURL',
                    }
                } else {
                    return {
                        text: '⚠️ Failed to fetch a valid image URL.',
                        outputType: 'text',
                    }
                }
            } catch (err) {
                console.error('WaifuPics Error:', err.message)
                return {
                    text: '❌ Failed to fetch anime image. Try again later.',
                    outputType: 'text',
                }
            }
        }
    }
}