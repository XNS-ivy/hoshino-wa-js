
export class PremiumUser {
    constructor() {
        this.inputValue
        this.action
        this.userid
    }
    async #saveUser() {

    }
    async #checkUser() {

    }
    async #updateUser() {

    }
    async #deleteUser() {

    }
    async execute(lid = '', action = ('save' || 'delete' || 'update'), input = '') {
        this.userid = lid
        this.action = action
        this.inputValue = input
    }
}