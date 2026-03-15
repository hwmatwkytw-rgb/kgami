const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: "ازالة",
  otherName: ["bg", "removebg"],
  category: "الوسائط ",
  rank: 0,
  cooldown: 5,
  description: "إزالة خلفية الصور",

  run: async function ({ api, event }) {
    const { threadID, messageID, messageReply, type } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage(`${FLOWER} ┇ يـرجى الـرد على صورة يا بطل.`, threadID, messageID);
    }

    const apiKey = "CNYjGk9RRUB6XRmP4UsuceoU"; 
    const cachePath = path.join(process.cwd(), 'cache', `rem_${Date.now()}.png`);

    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
      await fs.ensureDir(path.join(process.cwd(), 'cache'));
      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: { image_url: messageReply.attachments[0].url, size: 'auto' },
        headers: { 'X-Api-Key': apiKey },
        responseType: 'arraybuffer'
      });

      await fs.writeFile(cachePath, response.data);
      api.setMessageReaction("✅", messageID, () => {}, true);

      await api.sendMessage({
        body: `${SEP}\n${FLOWER} ┇ تـم إزالـة الـخـلـفـية بـنـجـاح ✨\n${SEP}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`${FLOWER} ┇ حـدث خطأ في الـسيرفر أو انـتهى رصـيد الـمفتاح.`, threadID, messageID);
    }
  }
};
