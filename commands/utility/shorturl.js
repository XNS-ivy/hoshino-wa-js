import axios from 'axios'

export default {
  name: 'shorturl',
  desc: 'Shortens a URL using Bitly',
  access: 'all',
  usage: ['shorturl','shorturl <url>'],
  async execute({ args }) {
    if (!args[0]) {
      return { text: '⚠️ Please provide a URL to shorten.', outputType: 'text' }
    }
    const longUrl = args[0]
    const bitlyToken = process.env.BITLY_TOKEN
    try {
      const res = await axios.post(
        'https://api-ssl.bitly.com/v4/shorten',
        { long_url: longUrl },
        { headers: { Authorization: `Bearer ${bitlyToken}` } }
      )
      return { text: `🔗 Shortened URL: ${res.data.link}`, outputType: 'text' }
    } catch (err) {
      console.error('ShortURL Error:', err.response?.data || err)
      return { text: '❌ Failed to shorten the URL.', outputType: 'text' }
    }
  }
}