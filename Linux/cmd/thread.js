const { styleNum, styleText } = require('../tools');
module.exports = {
  name: "مجموعتي",
  otherName: ["groupinfo"],
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    const { threadID, messageID } = event;

    try {
      const info = await api.getThreadInfo(threadID);

      if (!info || !info.isGroup) {
        return api.sendMessage(
          "هذا الأمر يعمل فقط داخل المجموعات.",
          threadID,
          messageID
        );
      }

      const userInfo = info.userInfo || [];

      // جلب أسماء الأدمن
      const adminNames = (info.adminIDs || [])
        .map(a => {
          const id = typeof a === "object" ? a.id : a;
          const user = userInfo.find(u => u.id == id);
          return user ? user.name : `[${id}]`;
        })
        .join("\n- ");

      const header = `＿＿＿＿＿＿＿＿＿＿\n`;
      const footer = `＿＿＿＿＿＿＿＿＿＿`;

      // لون الدردشة
      const chatColor = info.color
        ? String(info.color).replace("#", "")
        : "غير محدد";

      // رابط الدعوة
      const inviteLink =
        info.inviteLink && info.inviteLink.enable
          ? info.inviteLink.link
          : "معطل";

      const response =
        header +
        ` ${styleText('ID')}: ${threadID}:\n` +
        `⊳ ${styleText('name')}: ${info.threadName || "غير معروف"}\n` +
        `⊳ ${styleText('members count')}: ${styleNum(info.participantIDs?.length) || 0}\n` +
        `⊳ ${styleText('message count')}: ${info.messageCount || 0}\n` +
        `⊳ ${styleText('admins')}:\n -    ${adminNames || "لا يوجد"}\n` +
        `⊳ ${styleText('emoji')}: ${info.emoji || "غير محدد"}\n` +
        `⊳ ${styleText('chat color')}: ${chatColor}\n` +
        `⊳ ${styleText('invite')}: ${inviteLink}\n` +
        footer;

      api.sendMessage(response, threadID, messageID);

    } catch (err) {
      console.error("خطأ أمر مجموعتي:", err);
      api.sendMessage(
        "⚠ حدث خطأ أثناء جلب بيانات المجموعة.",
        threadID,
        messageID
      );
    }
  }
};
