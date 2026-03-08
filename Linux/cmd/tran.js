const axios = require("axios");
const log = require('../logger');

module.exports = {
  name: "ترجم",
  otherName: ["translate"],
  type: ['الاموال'],
  rank: 0,
  cooldown: 3,
  description: 'ترجمة تلقائية إلى العربية مع التعرف التلقائي على اللغة',
  usage: 'الرد على رسالة للترجمة',

  run: async (api, event) => {
    try {
      if (!event.messageReply)
        return api.sendMessage("⚠️ الرجاء الرد على رسالة للترجمة.", event.threadID, event.messageID);

      const text = event.messageReply.body;

      // -----------------------------
      // 🎯 الخطوة 1: اكتشاف اللغة
      // -----------------------------
      let detectedLang = null;
      try {
        const detect = await axios.post(
          "https://libretranslate.de/detect",
          { q: text },
          { headers: { "Content-Type": "application/json" } }
        );

        detectedLang = detect.data?.[0]?.language;
      } catch (err) {
        log.error("فشل الكشف عن اللغة:", err);
      }

      // إذا فشل الكشف عن اللغة، نفترض "en"
      if (!detectedLang) detectedLang = "en";

      // -----------------------------
      // 🎯 الخطوة 2: الترجمة
      // -----------------------------
      let translated = null;

      try {
        const res = await axios.post(
          "https://libretranslate.de/translate",
          {
            q: text,
            source: detectedLang,
            target: "ar",
            format: "text"
          },
          { headers: { "Content-Type": "application/json" } }
        );

        translated = res.data?.translatedText;
      } catch (err) {
        log.error("LibreTranslate Error:", err);
      }

      // -----------------------------
      // 🎯 الخطوة 3: API احتياطي
      // -----------------------------
      if (!translated) {
        try {
          const res = await axios.get(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detectedLang}|ar`
          );
          translated = res.data?.responseData?.translatedText;
        } catch (err) {
          log.error("MyMemory Error:", err);
        }
      }

      // -----------------------------
      // 🎯 إذا فشلت كل المحاولات
      // -----------------------------
      if (!translated)
        return api.sendMessage("⚠️ تعذر ترجمة النص حالياً. حاول لاحقاً.", event.threadID, event.messageID);

      return api.sendMessage(translated, event.threadID, event.messageID);

    } catch (err) {
      log.error(err);
      api.sendMessage("⚠️ حدث خطأ أثناء الترجمة.", event.threadID, event.messageID);
    }
  }
};
