export default {
    name: "help",
    desc: "Provides a list of available commands and their descriptions.",
    accses: 'all',
    execute: async ({ args }, commands) => {
        // If args are not provided, show whole commands and usage,if args are provided, show specific command help
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name === commandName);
        }
    }
}