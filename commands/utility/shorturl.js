import axios from 'axios'

export default {
  name: 'shorturl',
  desc: 'Shortens a URL using multiple free APIs',
  access: 'all',
  usage: ['shorturl', 'shorturl <url>'],

  async execute({ args }) {
    if (!args[0]) {
      return { text: '⚠️ Please provide a URL to shorten.', outputType: 'text' }
    }
    const longUrl = args[0]
    const bitlyToken = process.env.BITLY_TOKEN

    const services = [
      async () => {
        if (!bitlyToken) throw new Error('No Bitly token found')
        const res = await axios.post(
          'https://api-ssl.bitly.com/v4/shorten',
          { long_url: longUrl },
          { headers: { Authorization: `Bearer ${bitlyToken}` } }
        )
        return res.data.link
      },
      async () => { 
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`)
        return res.data
      },
      async () => {
        const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`)
        return res.data
      },
      async () => {
        const res = await axios.post(
          'https://cleanuri.com/api/v1/shorten',
          new URLSearchParams({ url: longUrl }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        return res.data.result_url
      }
    ]

    for (const shorten of services) {
      try {
        const shortLink = await shorten()
        if (shortLink) {
          return { text: `🔗 Shortened URL: ${shortLink}`, outputType: 'text' }
        }
      } catch (err) {
        console.warn('Shortener failed:', err.message)
      }
    }

    return { text: '❌ All shortening services failed. Try again later.', outputType: 'text' }
  }
}