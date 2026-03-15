module.exports = {
  name: "موافقة",
  otherName: ["اريني", "الطلبات"],
  category: "المطور",
  rank: 2,
  cooldown: 5,

  handleReply: async ({ api, event, handleReply }) => {
    const { body, threadID, messageID, senderID } = event;
    if (handleReply.author !== senderID) return;

    const index = parseInt(body) - 1;
    if (isNaN(index) || index < 0 || index >= handleReply.requests.length) return;

    const target = handleReply.requests[index];

    api.handleGroupLeave(target.threadID, (err) => {
      // هنا تضع منطق القبول أو الرفض حسب مكتبتك
      api.sendMessage(`✾ ┇ تم التعامل مع المجموعة: ${target.threadID}`, threadID);
    });
  },

  run: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    try {
      const spam = await api.getThreadList(100, null, ["PENDING"]);
      if (spam.length === 0) return api.sendMessage(`${FLOWER} ┇ لا توجد طلبات انضمام حالياً.`, threadID, messageID);

      let msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ طـلـبات الانـضمـام (${spam.length}) ⟭\n${FLOWER} ┇\n`;
      spam.forEach((s, i) => {
        msg += `${FLOWER} ┇ ⟬ ${i + 1} ⟭ ${s.name || "مجموعة جديدة"}\n${FLOWER} ┇  ID: ${s.threadID}\n`;
      });
      msg += `${SEP}`;

      api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: "موافقة",
          messageID: info.messageID,
          author: senderID,
          requests: spam
        });
      }, messageID);
    } catch (e) {
      api.sendMessage(`${FLOWER} ┇ خطأ في جلب الطلبات.`, threadID);
    }
  }
};
