const axios = require('axios');

module.exports = {
  name: "img",
  cooldown: 5,
  rank: 2,
  run: async (api, event, commands, args) => {
    try {
      const url = args[0];
      if (!url)
        return api.sendMessage(
          "⊳ أرسل رابط صورة",
          event.threadID,
          event.messageID
        );

      const res = await axios.get(url, {
        responseType: "stream",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const contentType = res.headers["content-type"];

      // التحقق الحقيقي من نوع الملف
      if (!contentType || !contentType.includes("image")) {
        return api.sendMessage(
          "⊳ الرابط لا يحتوي على صورة",
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
        {
          body: "",
          attachment: res.data
        },
        event.threadID,
        event.messageID
      );

    } catch (e) {
      api.sendMessage(
        "⊳ تعذر جلب الصورة من الرابط",
        event.threadID,
        event.messageID
      );
    }
  }
};
