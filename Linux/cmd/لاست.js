const { styleText, styleNum } = require('../tools');

module.exports = {
  name: "لاست",
  otherName: ["قائمة", "groups", "last"],
  category: "المطور",
  rank: 2, 
  cooldown: 5,
  hide: true,
  description: "عرض المجموعات التي يتواجد بها البوت والتحكم فيها",

  handleReply: async ({ api, event, handleReply }) => {
    const { body, threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    
    // التحقق من المطور (استخدام الرتبة 2)
    if (handleReply.author !== senderID) return;

    const args = body.split(/\s+/);
    const action = args[0];
    const index = parseInt(args[1]) - 1;

    if (isNaN(index) || index < 0 || index >= handleReply.groupIds.length) {
      return api.sendMessage(`${FLOWER} ┇ ⚠️ رقـم الـمـجموعة غير صـحيح!`, threadID, messageID);
    }

    const targetID = handleReply.groupIds[index];

    if (action === "خروج" || action === "غادر") {
      api.removeUserFromGroup(api.getCurrentUserID(), targetID, (err) => {
        if (err) return api.sendMessage(`${FLOWER} ┇ ❌ فشل الخروج من: ${targetID}`, threadID, messageID);
        api.sendMessage(`${SEP}\n${FLOWER} ┇ ✅ تـم الـخـروج بـنـجـاح!\n${FLOWER} ┇ ID: ${targetID}\n${SEP}`, threadID, messageID);
      });
    } else if (action === "حظر") {
       api.sendMessage(`${FLOWER} ┇ ✅ تـم تـسجيل حـظر الـمجموعة: ${targetID}`, threadID, messageID);
    }
  },

  run: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    
    try {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const groups = inbox.filter(g => g.isGroup && g.isSubscribed);

      if (groups.length === 0) {
        return api.sendMessage(`${FLOWER} ┇ ⚠️ الـبوت ليس عضواً في أي مـجموعة حالياً.`, threadID, messageID);
      }

      let msg = `${SEP}\n`;
      msg += `${FLOWER} ┇ ⦿ ⟬ قـائمـة الـمجـموعـات (${styleNum(groups.length)}) ⟭\n${FLOWER} ┇\n`;
      
      const groupIds = [];
      const mentions = [];

      groups.forEach((g, i) => {
        const gName = g.name || "بـدون اسـم";
        msg += `${FLOWER} ┇ ⟬ ${styleNum(i + 1)} ⟭ ${gName}\n`;
        msg += `${FLOWER} ┇ 🆔 ID: ${g.threadID}\n`;
        if (i < groups.length - 1) msg += `${FLOWER} ┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
        
        groupIds.push(g.threadID);
      });

      msg += `${FLOWER} ┇\n${SEP}\n`;
      msg += ` ⠇رد بـ [ خروج + الـرقم ] لـلـطرد\n`;
      msg += ` ⠇رد بـ [ حظر + الـرقم ] لـلـحـظـر\n`;
      msg += `${SEP}`;

      return api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: "لاست",
          messageID: info.messageID,
          author: senderID,
          groupIds
        });
      }, messageID);

    } catch (err) {
      api.sendMessage(`${FLOWER} ┇ ❌ حدث خطأ أثناء جلب الـقائمة.`, threadID, messageID);
    }
  }
};
