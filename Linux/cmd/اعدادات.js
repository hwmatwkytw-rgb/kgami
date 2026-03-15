const fs = require('fs-extra');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config.json');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = {
  name: "اعدادات ",
  category: "المجموعة",
  rank: 1, 
  cooldown: 5,
  description: 'إدارة نظام الحماية بالأرقام',
  
  run: async (api, event, commands, args) => {
    const { threadID, messageID, senderID } = event;
    let config = await fs.readJson(configPath);

    if (!config.protection) config.protection = {};
    if (!config.protection[threadID]) {
      config.protection[threadID] = { antinick: false, antileave: false, antichange: false, antispam: false };
    }

    const p = config.protection[threadID];

    // لوحة التحكم
    const msg = `${SEP}\n` +
      `   ✾ ┇ ⦿ ⟬ درع إبـلـيـن ⟭\n` +
      `${SEP}\n` +
      `1 ┇ حـماية الـكنيات: [ ${p.antinick ? 'ON' : 'OFF'} ]\n` +
      `2 ┇ مـكافحة الـخروج: [ ${p.antileave ? 'ON' : 'OFF'} ]\n` +
      `3 ┇ حـماية (الاسم/الصورة): [ ${p.antichange ? 'ON' : 'OFF'} ]\n` +
      `4 ┇ مـكافحة الـسبام: [ ${p.antispam ? 'ON' : 'OFF'} ]\n` +
      `${SEP}\n` +
      `💡 رد برقم الخيار لتغيير حالته.`;

    return api.sendMessage(msg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  },

  handleReply: async ({ api, event, handleReply }) => {
    const { body, threadID, messageID, senderID } = event;
    if (handleReply.author !== senderID) return;

    let config = await fs.readJson(configPath);
    const p = config.protection[threadID];
    let type = "";

    switch (body) {
      case "1": p.antinick = !p.antinick; type = "حماية الكنيات"; break;
      case "2": p.antileave = !p.antileave; type = "مكافحة الخروج"; break;
      case "3": p.antichange = !p.antichange; type = "حماية المجموعة"; break;
      case "4": p.antispam = !p.antispam; type = "مكافحة السبام"; break;
      default: return api.sendMessage("⚠️ اختر رقم من 1 إلى 4 فقط.", threadID, messageID);
    }

    await fs.writeJson(configPath, config, { spaces: 2 });
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(`✾ ┇ تـم ${p[Object.keys(p)[body-1]] ? 'تـفـعـيل' : 'إيـقـاف'} ${type} بـنـجـاح ✅`, threadID, messageID);
  }
};
