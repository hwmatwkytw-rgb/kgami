const { styleText, styleNum } = require('../tools');

module.exports = {
  name: "موافقة",
  otherName: ["pending", "طلبات"],
  category: "المطور", // وضعت في فئة المطور
  rank: 2, 
  cooldown: 5,
  hide: true,
  description: "إدارة طلبات تفعيل البوت في المجموعات الجديدة",

  handleReply: async ({ api, event, handleReply }) => {
    const { body, threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    
    if (senderID !== handleReply.author) return;

    try {
      const args = body.split(/\s+/);
      const num = parseInt(args[0]) || parseInt(args[1]); // دعم الرقم في حال كتب (رفض 1)
      const isBan = body.includes("حظر");
      const isRefuse = body.includes("رفض");
      
      const target = handleReply.pending[num - 1];
      if (!target) {
        return api.sendMessage(`${FLOWER} ┇ ❌ الـرقم غير مـوجود في الـقائمة.`, threadID, messageID);
      }

      if (isBan || isRefuse) {
        await api.sendMessage(`${SEP}\n${FLOWER} ┇ ⚠️ تـم ${isBan ? "حـظـر" : "رفـض"} طـلـبكم مـن قـبل الـمطور.\n${SEP}`, target.threadID);
        await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
        
        api.sendMessage(`${SEP}\n${FLOWER} ┇ ⦿ ⟬ تـم الـرفـض ❌ ⟭\n${FLOWER} ┇\n${FLOWER} ┇ الـمجموعة: ${target.name}\n${FLOWER} ┇ الإجـراء: ${isBan ? "حـظر طـرد" : "رفـض"}\n${SEP}`, threadID);
      } else {
        await api.sendMessage(`${SEP}\n${FLOWER} ┇ ✅ تـم تـفعيل الـبوت بـنجاح!\n${FLOWER} ┇ اكتب (اوامر) للبدء واستكشاف الـميزات.\n${SEP}`, target.threadID);
        
        api.sendMessage(`${SEP}\n${FLOWER} ┇ ⦿ ⟬ تـم الـتـفـعـيـل ✅ ⟭\n${FLOWER} ┇\n${FLOWER} ┇ الـمجموعة: ${target.name}\n${FLOWER} ┇ الـحالة: نـاجح ومستقر\n${SEP}`, threadID);
      }

      api.unsendMessage(handleReply.messageID);

    } catch (e) {
      api.sendMessage(`${FLOWER} ┇ ❌ حدث خطأ أثناء التنفيذ.`, threadID);
    }
  },

  run: async ({ api, event }) => {
    const { threadID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    try {
      const list = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
      const pendingGroups = list.filter(t => t.isGroup);

      if (!pendingGroups.length) {
        return api.sendMessage(`${SEP}\n${FLOWER} ┇ 𓆩 📭 𓆪 لا تـوجـد طـلـبـات حالياً.\n${SEP}`, threadID);
      }

      let msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ طـلـبـات الـتـفـعـيـل ⟭\n${FLOWER} ┇\n`;

      pendingGroups.forEach((t, i) => {
        msg += `${FLOWER} ┇ ⟬ ${styleNum(i + 1)} ⟭ ❪ ${t.name || "مجموعة مجهولة"} ❫\n`;
        msg += `${FLOWER} ┇ 🆔 ID: ${t.threadID}\n`;
        if (i < pendingGroups.length - 1) msg += `${FLOWER} ┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
      });

      msg += `${FLOWER} ┇\n${SEP}\n`;
      msg += ` ⠇رد بـ [ الـرقم ] لـلقـبـول\n`;
      msg += ` ⠇رد بـ [ رفض + الـرقم ] لـلرفـض\n`;
      msg += ` ⠇رد بـ [ حظر + الـرقم ] لـلحـظر والـطرد`;

      api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: "الطلبات",
          messageID: info.messageID,
          author: senderID,
          pending: pendingGroups
        });
      });
    } catch (e) {
      api.sendMessage(`${FLOWER} ┇ ❌ فشل جلب قائمة الطلبات.`, threadID);
    }
  }
};
