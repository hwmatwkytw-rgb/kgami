const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: 'بنتراست',
  otherName: ['صور', 'pin'],
  category: 'الترفيه',
  rank: 0,
  cooldown: 5,

  run: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    const input = args.join(" ");

    if (!input) return api.sendMessage(`${FLOWER} ┇ أكتب ما تريد البحث عنه!`, threadID, messageID);

    api.setMessageReaction("🔍", messageID, () => {}, true);

    try {
      const res = await axios.get(`https://pinterest-ashen.vercel.app/api?search=${encodeURIComponent(input)}`);
      const data = res.data.data || [];
      if (data.length === 0) return api.sendMessage(`⚠️ لم أجد نتائج.`, threadID);

      const imgData = [];
      const tmpPath = path.join(process.cwd(), 'cache', `pin_${Date.now()}`);
      await fs.ensureDir(tmpPath);

      for (let i = 0; i < Math.min(6, data.length); i++) {
        const imgRes = await axios.get(data[i], { responseType: 'arraybuffer' });
        const imgFile = path.join(tmpPath, `${i}.jpg`);
        await fs.outputFile(imgFile, imgRes.data);
        imgData.push(fs.createReadStream(imgFile));
      }

      await api.sendMessage({
        body: `${SEP}\n${FLOWER} ┇ نـتائج الـبحث لـ: ${input}\n${SEP}`,
        attachment: imgData
      }, threadID, () => fs.removeSync(tmpPath), messageID);

    } catch (e) {
      api.sendMessage(`${FLOWER} ┇ حدث خطأ أثناء جلب الصور.`, threadID, messageID);
    }
  }
};
