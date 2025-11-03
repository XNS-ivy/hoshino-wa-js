export default {
    name: "ping",
    description: "Check the bot's latency.",
    execute: async ({ commandID }) => {
        const latency = (Date.now() - commandID - 4000) > 0 ? (Date.now() - commandID - 4000) :
            (Date.now() - commandID - 3000) > 0 ? (Date.now() - commandID - 3000) :
                (Date.now() - commandID - 2000) > 0 ? (Date.now() - commandID - 2000) :
                    (Date.now() - commandID - 1000) > 0 ? (Date.now() - commandID - 1000) :
                        (Date.now() - commandID)
        const roundedLatency = parseFloat(latency.toFixed(2))
        return { text: `Pong! Command Latency is ${roundedLatency}ms.`, outputType: 'text' }
    }
}