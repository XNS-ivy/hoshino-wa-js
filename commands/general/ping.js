import ping from 'ping'

export default {
  name: "ping",
  description: "Check the bot's latency.",
  access: 'all',
  usage: 'ping [host]',
  execute: async ({ args = [], commandID }) => {
    const target = args[0] ? args[0].replace(/^https?:\/\//, '') : 'google.com'
    const host = target.includes('.') ? target : `${target}.com`
    const now = Date.now()
    const latency = now - commandID
    const roundedLatency = parseFloat(latency.toFixed(2))
    let networkLatency = null
    try {
      const res = await ping.promise.probe(host)
      networkLatency = res.time ? `${res.time} ms` : 'Timeout'
    } catch (err) {
      networkLatency = 'Error'
    }
    return {
      text: `✅ Pong!\n📦 Command Latency: ${roundedLatency} ms\n🌐 Network Latency (${host}): ${networkLatency}`,
      outputType: 'text'
    }
  }
}