const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const Replicate = require('replicate');
const { styleText, styleNum } = require('../tools');
const log = require('../logger');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

// إعداد المحرك باستخدام التوكن بتاعك
const replicate = new Replicate({
  auth: "R8_bwKWfTg5khHgLQrCebOYfRCI1chqpDs1raCNF",
});

module.exports = {
  name: "تحويل",
  otherName: ["anime", "تحويل"],
  rank: 0,
  category: "الترفيه",
  cooldown: 30,
  description: 'تحويل الصور لشخصيات أنمي عبر ذكاء اصطناعي حقيقي',

  run: async (api, event, commands, args) => {
    const { threadID, messageID, messageReply, type } = event;

    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage(`${FLOWER} ┇ يـرجى الـرد على صـورة لـتحـويلـها لـانـمـي.`, threadID, messageID);
    }

    const imageUrl = messageReply.attachments[0].url;
    api.setMessageReaction("🎨", messageID, (err) => {}, true);

    const waitMsg = 
      `${SEP}\n` +
      `✾ ┇ ⦿ ⟬ ${styleText('AI TRANSFORM')} ⟭\n` +
      `✾ ┇\n` +
      `✾ ┇ جـاري الـمـعـالـجـة بـأقـوى مـوديل.. 🧠\n` +
      `✾ ┇ أصـبـر ثـوانـي يـا ${styleText('Abu Obaida')}\n` +
      `${SEP}`;

    const info = await api.sendMessage(waitMsg, threadID);

    try {
      // استخدام موديل AnimeGAN v2 الاحترافي على Replicate
      const output = await replicate.run(
        "cjwbw/animegan2-v2:28af064d17d6bc61f60046a066914b30176ed7693d254b9d0b3014902875b1d4",
        { input: { image: imageUrl } }
      );

      const cachePath = path.join(__dirname, 'cache', `replicate_anime_${Date.now()}.png`);
      await fs.ensureDir(path.dirname(cachePath));

      const imgRes = await axios.get(output, { responseType: 'arraybuffer' });
      fs.outputFileSync(cachePath, imgRes.data);

      const successMsg = 
        `${SEP}\n` +
        `✾ ┇ ⦿ ⟬ ${styleText('COMPLETED')} ⟭\n` +
        `✾ ┇\n` +
        `✾ ┇ تـم الـتـحـويـل بـواسـطـة ${styleText('Eblin AI')}\n` +
        `✾ ┇ الـجـودة: ${styleText('Ultra HD')}\n` +
        `${SEP}`;

      await api.sendMessage({
        body: successMsg,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => fs.unlinkSync(cachePath), messageID);

      api.unsendMessage(info.messageID);
      api.setMessageReaction("✅", messageID, (err) => {}, true);

    } catch (err) {
      log.error("Replicate Error: " + err);
      api.unsendMessage(info.messageID);
      api.sendMessage(`${FLOWER} ┇ حـدث خـطأ في سـيرفر الـذكـاء الاصـطـنـاعي.`, threadID, messageID);
    }
  }
};
