const axios = require('axios');

module.exports = {
  name: "جلب",
  otherName: ['صورة', 'جلب'],
  category: "الوسائط", // تمت إضافته لفئة الوسائط ليظهر في الأوامر
  cooldown: 5,
  rank: 2,
  run: async (api, event, commands, args) => {
    try {
      const url = args[0];
      if (!url)
        return api.sendMessage(
          "✾ ┇ أرسل رابط صورة صحيح  .",
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
          "✾ ┇ عذراً، الرابط ده ما فيهو صورة.",
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
        {
          body: "●───── ✾ ⌬ ✾ ─────●\n✾ ┇ تـم جـلـب الـصـورة بـنـجـاح ✅\n●───── ✾ ⌬ ✾ ─────●",
          attachment: res.data
        },
        event.threadID,
        event.messageID
      );

    } catch (e) {
      api.sendMessage(
        "✾ ┇ تعذر جلب الصورة، الرابط قد يكون تالفاً.",
        event.threadID,
        event.messageID
      );
    }
  }
};
