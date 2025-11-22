export function parsePremiumArray(arr = []) {
    if (!Array.isArray(arr) || arr.length < 2) {
        return { ids: [], days: null, error: "Invalid format: need <tag> <days>" }
    }
    const last = arr[arr.length - 1]
    if (!/^\d+$/.test(last)) {
        return { ids: [], days: null, error: "Days must be numbers!" }
    }

    const days = last
    const rawIds = arr.slice(0, arr.length - 1)

    const ids = [...new Set(
        rawIds
            .map(x => x.replace(/@/g, ""))  
            .filter(x => /^\d+$/.test(x))    
            .filter(x => x.length >= 5)
    )]
    return { ids, days, error: null }
}

export function parseDeletePremiumArray(arr = []) {
    if (!Array.isArray(arr) || arr.length < 1) {
        return { ids: [], error: "Invalid format: use delete-prem <tag-1> <tag-N>" }
    }

    const ids = [...new Set(
        arr
            .map(x => String(x).trim())
            .map(x => x.replace(/@/g, ""))
            .filter(x => /^\d+$/.test(x))
            .filter(x => x.length >= 5)
    )]

    if (ids.length === 0) {
        return { ids: [], error: "No valid users tagged!" }
    }

    return { ids, error: null }
}
