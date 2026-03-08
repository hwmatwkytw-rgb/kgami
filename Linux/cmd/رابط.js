module.exports = {
  name: "رابط",
  rank: 0,
  description: "إرسال رابط إنطلاقا من المرفق",
  hide: true,  
  run: async (api, event) => {
    const { messageReply } = event;

    // التحقق من أن الرسالة هي رسالة مُعاد توجيهها وأن لديها مرفق واحد على الأقل
    if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length !== 1) {
      return api.sendMessage(getText("رد علي صورة"), event.threadID, event.messageID);
    }

    // إرسال رابط المرفق في الرسالة المُعاد توجيهها
    return api.sendMessage(messageReply.attachments[0].url, event.threadID, event.messageID);
  },
};
