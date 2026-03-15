const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: "ازالة",
  otherName: ["bg", "removebg", "إزالة"],
  version: "1.1",
  author: "سينكو",
  rank: 0, // متاح للجميع
  cooldown: 15,
  description: "إزالة خلفية الصور باستخدام الذكاء الاصطناعي",
  category: "الوسائط ",

  run: async function ({ api, event }) {
    const { threadID, messageID, messageReply, type } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    // التحقق من وجود صورة في الرد
    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage(`${FLOWER} ┇ يـرجى الـرد على الـصورة الـتي تـريد إزالة خـلفـيتها.`, threadID, messageID);
    }

    const apiKey = "CNYjGk9RRUB6XRmP4UsuceoU"; 
    const imageUrl = messageReply.attachments[0].url;
    const cachePath = path.join(process.cwd(), 'cache', `rembg_${Date.now()}.png`);

    // التفاعل بالساعة لبدء العملية
    api.setMessageReaction("⏳", messageID, (err) => {}, true);

    try {
      await fs.ensureDir(path.join(process.cwd(), 'cache'));

      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: {
          image_url: imageUrl,
          size: 'auto'
        },
        headers: {
          'X-Api-Key': apiKey
        },
        responseType: 'arraybuffer'
      });

      await fs.writeFile(cachePath, response.data);

      // التفاعل بعلامة الصح عند النجاح
      api.setMessageReaction("✅", messageID, (err) => {}, true);

      const msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ إزالـة الـخـلـفـية ⟭\n${FLOWER} ┇\n${FLOWER} ┇ تـم الـمـعالـجـة بـنـجـاح ✨\n${SEP}`;

      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      api.sendMessage(`${FLOWER} ┇ ❌ حـدث خطأ! تأكد من رصيد الـ API أو جودة الـصورة.`, threadID, messageID);
    }
  }
};
