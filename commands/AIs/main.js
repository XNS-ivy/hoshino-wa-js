export default {
    name: 'chatgpt',
    desc: 'using ai <still under development>',
    access: 'premium',
    execute: async ({ args }) => {
        return { text: 'hello this is demo AI output ', outputType: 'text' }
    }
}