const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: "ازالة",
  otherName: ["bg", "removebg"],
  category: "الترفيه", // الفئة هنا يا بطل
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    const { threadID, messageID, messageReply, type } = event;
    const apiKey = "CNYjGk9RRUB6XRmP4UsuceoU"; 

    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("⚠️ يـرجى الـرد على صـورة لإزالـة خـلفـيتها.", threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID, (err) => {}, true);
    const cachePath = path.join(__dirname, 'cache', `rembg_${Date.now()}.png`);

    try {
      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: { image_url: messageReply.attachments[0].url, size: 'auto' },
        headers: { 'X-Api-Key': apiKey },
        responseType: 'arraybuffer'
      });

      fs.outputFileSync(cachePath, response.data);
      api.setMessageReaction("✅", messageID, (err) => {}, true);

      await api.sendMessage({
        body: "✨ تـم إزالـة الـخـلـفـية بـنـجـاح",
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      api.sendMessage("❌ حـدث خـطأ في الـ API أو الـصورة.", threadID, messageID);
    }
  }
};
