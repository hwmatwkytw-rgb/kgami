const fs = require("fs");
const path = require("path");
const config = require("../config.json");

module.exports = {
    name: "شينوبو",
    rank: 1,
    cooldowns: 0,
    hide: true,
    run: async (api, event, commands, args) => {
        if (!args[0]) {
            return api.sendMessage(
                ` [ on | off ]؟ `,
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
                    ` تم`,
                    event.threadID,
                    event.messageID
                );
                break;

            case "off":
            case "ايقاف":
                config.AI = false;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                api.sendMessage(
                    `تم`,
                    event.threadID,
                    event.messageID
                );
                break;

            default:
                api.sendMessage(
                    `[ on | off ]؟ `,
                    event.threadID,
                    event.messageID
                );
        }
    }
};
