const fs = require('fs');
const path = require('path');

module.exports = {
  name: "لاست",
  otherName: ["groups", "المجموعات"],
  category: "المطور", // الفئة هنا يا بطل
  rank: 2, 
  cooldown: 5,

  run: async (api, event) => {
    const { threadID, messageID, senderID } = event;
    
    try {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const groups = inbox.filter(g => g.isGroup && g.isSubscribed);

      if (groups.length === 0) {
        return api.sendMessage("⚠️ البوت لا يوجد في أي مجموعات حالياً.", threadID, messageID);
      }

      let msg = `⦿ قـائمـة الـمجـموعـات الـموجـودة (${groups.length})\n\n`;
      const groupIds = [];

      groups.forEach((g, i) => {
        const name = g.name || "مجموعة بدون اسم";
        msg += `${i + 1}. الاسـم: ${name}\n🆔 ID: ${g.threadID}\n──────────────\n`;
        groupIds.push(g.threadID);
      });

      msg += `\nرد بـ (خروج + الرقم) للمغادرة.. 🥱`;

      return api.sendMessage(msg, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: 'لاست',
          messageID: info.messageID,
          author: senderID,
          groupIds
        });
      }, messageID);

    } catch (err) {
      api.sendMessage("❌ حدث خطأ في جلب الأسماء.", threadID, messageID);
    }
  }
};
