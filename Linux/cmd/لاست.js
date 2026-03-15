module.exports = {
  name: "لاست",
  otherName: ["groups", "ls"],
  category: "المطور",
  rank: 2, 
  cooldown: 5,
  description: "عرض المجموعات والتحكم فيها",

  handleReply: async ({ api, event, handleReply }) => {
    const { body, threadID, messageID, senderID } = event;
    const FLOWER = "✾";
    
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
        api.sendMessage(`${FLOWER} ┇ ✅ تـم الـخـروج بـنـجـاح من: ${targetID}`, threadID, messageID);
      });
    }
  },

  run: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    
    try {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const groups = inbox.filter(g => g.isGroup && g.isSubscribed);

      if (groups.length === 0) return api.sendMessage(`${FLOWER} ┇ الـبوت ليس في مـجموعات.`, threadID, messageID);

      let msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ قـائمـة الـمجـموعـات (${groups.length}) ⟭\n${FLOWER} ┇\n`;
      const groupIds = [];

      groups.forEach((g, i) => {
        msg += `${FLOWER} ┇ ⟬ ${i + 1} ⟭ ${g.name || "بـدون اسـم"}\n${FLOWER} ┇  ID: ${g.threadID}\n`;
        if (i < groups.length - 1) msg += `${FLOWER} ┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
        groupIds.push(g.threadID);
      });

      msg += `${FLOWER} ┇\n${SEP}\n${FLOWER} ┇ رد بـ [ خروج + الـرقم ] لـلـمـغادرة`;

      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: "لاست",
          messageID: info.messageID,
          author: senderID,
          groupIds
        });
      }, messageID);

    } catch (err) {
      api.sendMessage(`${FLOWER} ┇ ❌ حدث خطأ في الـقائمة.`, threadID, messageID);
    }
  }
};
