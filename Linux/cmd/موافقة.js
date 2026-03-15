const fs = require('fs');
const path = require('path');

module.exports = {
  name: "موافقة",
  otherName: ["requests", "pending"],
  rank: 2, // مخصص للمطورين فقط
  cooldown: 5,

  run: async (api, event) => {
    const { threadID, messageID, senderID } = event;

    try {
      // جلب قائمة الطلبات المعلقة (PENDING)
      const spam = await api.getThreadList(100, null, ["PENDING"]);
      const other = await api.getThreadList(100, null, ["OTHER"]);
      const allRequests = [...spam, ...other];

      if (allRequests.length === 0) {
        return api.sendMessage("✾ ┇ لا توجد طلبات انضمام للمجموعات حالياً.", threadID, messageID);
      }

      let msg = `⦿ طـلـبات الانـضمـام الـمعلـقة (${allRequests.length})\n\n`;
      const requestsInfo = [];

      allRequests.forEach((req, i) => {
        // إظهار اسم المجموعة أو كتابة "بدون اسم" لو كانت خاصة
        const groupName = req.name || "مجموعة جديدة / محادثة خاصة";
        msg += `${i + 1}. الاسم: ${groupName}\n🆔 ID: ${req.threadID}\n──────────────\n`;
        
        requestsInfo.push({
          threadID: req.threadID,
          name: groupName
        });
      });

      msg += `\nرد برقم المجموعة للموافقة عليها.. 🥱`;

      return api.sendMessage(msg, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: 'طلبات',
          messageID: info.messageID,
          author: senderID,
          requestsInfo
        });
      }, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ حدث خطأ أثناء جلب قائمة الطلبات.", threadID, messageID);
    }
  }
};
