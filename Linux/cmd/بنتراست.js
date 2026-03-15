const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { styleText, styleNum } = require('../tools');

module.exports = {
  name: 'بنتراست',
  otherName: ['بنترست', 'pinterest', 'صور', 'فيديو_بنترست'],
  version: '1.5.0',
  author: 'سينكو',
  rank: 0, 
  cooldown: 10,
  description: 'البحث عن صور وفيديوهات في منصة بنترست',
  category: 'الوسائط ',

  run: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    try {
      const input = args.join(" ");
      if (!input) {
        return api.sendMessage(
          `${SEP}\n${FLOWER} ┇ يرجى إدخال كلمة البحث.\n${FLOWER} ┇ الـصـيـغة: بنتراست [الكلمة] - [العدد]\n${FLOWER} ┇ مـثـال: بنتراست انمي فيديو - 1\n${SEP}`,
          threadID, messageID
        );
      }

      const keySearch = input.includes('-') ? input.split('-')[0].trim() : input;
      const numberSearch = parseInt(input.split('-').pop().trim()) || 6;
      
      api.setMessageReaction("🔍", messageID, () => {}, true);

      // جلب البيانات من الـ API
      const res = await axios.get(`https://pinterest-ashen.vercel.app/api?search=${encodeURIComponent(keySearch)}`);
      const data = res.data.data || [];

      if (data.length === 0) {
        return api.sendMessage(`${FLOWER} ┇ ⚠️ لـم يـتم الـعثور على نتائج لـ "${keySearch}"`, threadID, messageID);
      }

      const attachments = [];
      const tmpPath = path.join(process.cwd(), 'cache', `pin_${Date.now()}`);
      await fs.ensureDir(tmpPath);

      // تصفية النتائج (البحث عن فيديوهات أولاً لو الكلمة فيها "فيديو")
      const isVideoRequest = input.toLowerCase().includes("فيديو") || input.toLowerCase().includes("video");
      const limit = isVideoRequest ? Math.min(numberSearch, data.length, 3) : Math.min(numberSearch, data.length, 9);

      for (let i = 0; i < limit; i++) {
        try {
          const url = data[i];
          const isVideo = url.includes(".mp4");
          const ext = isVideo ? ".mp4" : ".jpg";
          
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const file = path.join(tmpPath, `${i}${ext}`);
          await fs.outputFile(file, response.data);
          attachments.push(fs.createReadStream(file));
        } catch (e) { console.error("Error downloading content:", e); }
      }

      const msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ نـتـائج بـنـتـراست ⟭\n${FLOWER} ┇\n${FLOWER} ┇ الـبـحث: ${keySearch}\n${FLOWER} ┇ الـمحتوى: ${isVideoRequest ? 'فيديو 🎬' : 'صور 🖼️'}\n${FLOWER} ┇ الـعدد: ${styleNum(attachments.length)}\n${SEP}`;

      await api.sendMessage({
        body: msg,
        attachment: attachments
      }, threadID, () => {
        fs.removeSync(tmpPath);
      }, messageID);

    } catch (error) {
      api.sendMessage(`${FLOWER} ┇ ❌ حـدث خطأ أثـناء جـلب الـمحتوى.`, threadID, messageID);
    }
  },
};
