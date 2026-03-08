const axios = require("axios");
const log = require('../logger');

module.exports = {
  name: "اقتباس",
  otherName: ["quote"],
  type: ['النصوص', 'اخري'],
  rank: 0,
  cooldown: 2,
  description: 'يجلب لك اقتباس عشوائي',

  run: async (api, event) => {
    try {
      const res = await axios.get("https://zenquotes.io/api/random");
      const data = res.data[0]; // لأن الـ API يرجع Array

      const msg = `⊳ ${data.q}\n⊳ ${data.a}`;
      api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      api.sendMessage('⚠ حدث خطأ أثناء جلب الاقتباس', event.threadID, event.messageID);
      log.error(err);
    }
  }
};
