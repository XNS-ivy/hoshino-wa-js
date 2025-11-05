export default {
    name: "help",
    desc: "Provides a list of available commands and their descriptions.",
    access: 'all',
    execute: async ({ args }, commands) => {
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name === commandName);
        }
    }
}