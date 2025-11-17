export function parsePremiumArray(arr) {
    const days = arr[arr.length - 1]
    const rawIds = arr.slice(0, arr.length - 1)

    const ids = [...new Set(
        rawIds
            .map(x => x.replace(/@/g, ""))
            .filter(x => /^\d+$/.test(x))
            .filter(x => x.length >= 15)
    )]

    return { ids, days }
}
