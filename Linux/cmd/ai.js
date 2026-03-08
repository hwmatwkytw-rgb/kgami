const fs = require("fs");
const path = require("path");
const config = require("../config.json");

module.exports = {
    name: "linux",
    rank: 1,
    cooldowns: 0,
    hide: true,
    run: async (api, event, commands, args) => {
        if (!args[0]) {
            return api.sendMessage(
                `palace choice [ on | off ] '-'`,
                event.threadID,
                event.messageID
            );
        }

        const configPath = path.join(__dirname, "..", "config.json");

        switch (args[0].toLowerCase()) {
            case "on":
            case "تشغيل":
                config.AI = true;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                api.sendMessage(
                    `Linux Ai Is On '-'`,
                    event.threadID,
                    event.messageID
                );
                break;

            case "off":
            case "ايقاف":
                config.AI = false;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                api.sendMessage(
                    `Linux Ai Is Off '-'`,
                    event.threadID,
                    event.messageID
                );
                break;

            default:
                api.sendMessage(
                    `palace choice [ on | off ] '-'`,
                    event.threadID,
                    event.messageID
                );
        }
    }
};
