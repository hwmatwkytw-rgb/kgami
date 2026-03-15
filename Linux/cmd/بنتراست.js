const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  name: 'بنتراست',
  otherName: ['صور', 'pin'],
  category: "الترفيه", // الفئة
  rank: 0,
  cooldown: 5,

  run: async (api, event, args) => {
    const { threadID, messageID } = event;
    const input = args.join(" ");

    if (!input) return api.sendMessage("🔍 يـرجى كـتابة مـا تـريد الـبـحث عـنه.", threadID, messageID);

    api.setMessageReaction("🔍", messageID, (err) => {}, true);

    try {
      const res = await axios.get(`https://pinterest-ashen.vercel.app/api?search=${encodeURIComponent(input)}`);
      const data = res.data.data || [];
      const tmpPath = path.join(__dirname, 'cache', `pin_${Date.now()}`);
      await fs.ensureDir(tmpPath);

      const attachments = [];
      for (let i = 0; i < Math.min(6, data.length); i++) {
        const imgRes = await axios.get(data[i], { responseType: 'arraybuffer' });
        const imgFile = path.join(tmpPath, `${i}.jpg`);
        fs.outputFileSync(imgFile, imgRes.data);
        attachments.push(fs.createReadStream(imgFile));
      }

      await api.sendMessage({
        body: `🎏 نـتـائـج الـبـحث عـن: ${input}`,
        attachment: attachments
      }, threadID, () => fs.removeSync(tmpPath), messageID);

    } catch (e) {
      api.sendMessage("❌ فـشل الـبـحث عـن صـور.", threadID, messageID);
    }
  }
};
