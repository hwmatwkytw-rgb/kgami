const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'اغنية',
  otherName: ['song'],
  category: "الترفيه", // الفئة
  rank: 0,
  cooldown: 10,

  run: async (api, event, args) => {
    const { threadID, messageID, senderID } = event;
    const query = args.join(' ').trim();

    if (!query) return api.sendMessage('•-• أكـتـب اسـم الأغـنـية!', threadID, messageID);

    try {
      const getApi = await axios.get(`https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json`);
      const baseUrl = getApi.data.api;
      const res = await axios.get(`${baseUrl}/ytFullSearch?songName=${encodeURIComponent(query)}`);
      const results = res.data.slice(0, 6);

      let msg = "🎶 نـتـائـج الـبـحث:\n\n";
      results.forEach((r, i) => { msg += `${i + 1}. ${r.title}\n⏱️ ${r.time}\n\n`; });
      msg += "رد بـرقـم الأغـنـية لـلـتـحـمـيـل.. 🥱";

      api.sendMessage(msg, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: 'اغنية',
          messageID: info.messageID,
          author: senderID,
          result: results,
          baseUrl
        });
      }, messageID);
    } catch (e) {
      api.sendMessage("❌ خـطأ في الـبـحث.", threadID, messageID);
    }
  }
};
