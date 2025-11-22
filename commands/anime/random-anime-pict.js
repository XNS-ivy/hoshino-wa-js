import axios from 'axios'

export default {
    name: 'waifu-pict',
    desc: 'Send a random anime image (safe for work)',
    access: 'all',
    args: [
        'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cry', 'cuddle', 'lick',
        'pat', 'smug', 'blush', 'bonk', 'yeet', 'smile', 'wave', 'highfive',
        'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy',
        'wink', 'poke', 'dance', 'cringe'
    ],
    usage: ['waifu-pict <type>'],
    async execute({ args }) {
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
            const res = await axios.get(`https://api.waifu.pics/sfw/${category}`)
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
    },
}