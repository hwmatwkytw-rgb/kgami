const axios = require("axios");

module.exports = {
  name: "فاكت",
  otherName: ["fact"],
  rank: 0,
  cooldown: 2,
  description: "يعرض حقيقة عشوائية",

  run: async (api, event) => {
    try {
      // API الأساسي
      let res = await axios.get(
        "https://uselessfacts.jsph.pl/random.json?language=en",
        { timeout: 7000 }
      );

      let fact = res.data?.text;

      // لو لا توجد نتيجة → نستخدم API بديل
      if (!fact) {
        const alt = await axios.get("https://api.api-ninjas.com/v1/facts?limit=1", {
          headers: { "X-Api-Key": "DEMO-API-KEY" } // مفتاح عام مجاني للاستخدام البسيط
        });

        fact = alt.data?.[0]?.fact || null;
      }

      if (!fact) return api.sendMessage("تعذر جلب حقيقة حالياً، حاول لاحقاً.", event.threadID, event.messageID);

      api.sendMessage(`⊳ ${fact}`, event.threadID, event.messageID);

    } catch (err) {
      api.sendMessage("حدث خطأ أثناء جلب الحقيقة.", event.threadID, event.messageID);
    }
  }
};
