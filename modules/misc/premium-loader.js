import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const dbpath = '../../databases/premium.json'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const premiumPath = path.resolve(__dirname, dbpath)

export class PremiumUser {
    constructor() {
        this.days = null
        this.action = null
        this.userid = null
    }

    #loadDB() {
        if (!fs.existsSync(premiumPath)) {
            fs.writeFileSync(premiumPath, JSON.stringify({}), "utf-8")
        }
        return JSON.parse(fs.readFileSync(premiumPath, "utf-8"))
    }

    #saveDB(db) {
        fs.writeFileSync(premiumPath, JSON.stringify(db, null, 2), "utf-8")
    }

    async #saveUser() {
        const db = this.#loadDB()
        if (db[this.userid]) {
            return { ok: false, msg: "User already premium" }
        }

        db[this.userid] = {
            days: this.days,
            since: Date.now()
        }

        this.#saveDB(db)
        return { ok: true, msg: "User premium added" }
    }

    async #checkUser() {
        const db = this.#loadDB()
        return db[this.userid] || null
    }

    async #updateUser() {
        const db = this.#loadDB()
        if (!db[this.userid]) {
            return { ok: false, msg: "User not premium" }
        }

        db[this.userid].days = this.days
        db[this.userid].updated = Date.now()

        this.#saveDB(db)
        return { ok: true, msg: "User premium updated" }
    }

    async #deleteUser() {
        const db = this.#loadDB()
        if (!db[this.userid]) {
            return { ok: false, msg: "User not found" }
        }

        delete db[this.userid]
        this.#saveDB(db)

        return { ok: true, msg: "User premium removed" }
    }


    async execute(lid, action = 'save', days = null) {
        const ids = Array.isArray(lid) ? lid : [lid]
        const cleanIds = [...new Set(
            ids
                .map(x => String(x).replace(/@/g, ""))
                .filter(x => /^\d+$/.test(x))
        )]
        this.days = days
        this.action = action
        const results = []
        for (const id of cleanIds) {
            this.userid = id

            if (action === "save") results.push(await this.#saveUser())
            if (action === "check") results.push(await this.#checkUser())
            if (action === "update") results.push(await this.#updateUser())
            if (action === "delete") results.push(await this.#deleteUser())
        }

        return results
    }



    async premium() {
        // event auto delete here (under development)
    }
}

export const loadPremium = new PremiumUser()