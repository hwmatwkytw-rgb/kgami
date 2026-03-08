const axios = require("axios");

module.exports = {
  name: "url",
  type: ['معلومات'],
  rank: 0,
  cooldown: 5,
  description: "يختصر الروابط",
  hide: true,
  run: async (api, event, commands, args) => {
    let url = args[0];

    if (!url) {
      return api.sendMessage("أدخل الرابط الذي تريد اختصاره.", event.threadID, event.messageID);
    }

    // إصلاح الروابط التي بدون https
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      // API الأساسي is.gd
      const res = await axios.get(
        `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`
      );

      if (res.data?.errormsg) {
        return api.sendMessage(`⚠️ خطأ: ${res.data.errormsg}`, event.threadID, event.messageID);
      }

      let shortUrl = res.data?.shorturl;

      // حماية لو API رجع بدون shorturl
      if (!shortUrl) {
        // API بديل tinyurl
        const alt = await axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
        );
        shortUrl = alt.data || null;
      }

      if (!shortUrl) {
        return api.sendMessage("⚠️ لم أستطع اختصار الرابط، حاول مرة أخرى.", event.threadID, event.messageID);
      }

      api.sendMessage(`${shortUrl}`, event.threadID, event.messageID);

    } catch (err) {
      api.sendMessage("⚠️ فشل في اختصار الرابط.", event.threadID, event.messageID);
    }
  }
};
