module.exports = {
  name: "رابط",
  rank: 0,
  category: "الوسائط", // إضافة الفئة المطلوبة
  description: "إرسال رابط إنطلاقا من المرفق",
  hide: true,  
  run: async (api, event) => {
    const { messageReply, threadID, messageID } = event;

    // التحقق من أن الرد يحتوي على مرفق واحد
    if (event.type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length !== 1) {
      return api.sendMessage("✾ ┇ ⚠️ | يرجى الرد على صورة أو فيديو لاستخراج الرابط.", threadID, messageID);
    }

    // إرسال الرابط داخل برواز إبلين الصغير
    const url = messageReply.attachments[0].url;
    const response = `●────── ✾ ⌬ ✾ ──────●\n✾ ┇ ⦿ ⟬ رابـط الـمـرفـق ⟭\n✾ ┇\n✾ ┇ ${url}\n✾ ┇\n●────── ✾ ⌬ ✾ ──────●`;

    return api.sendMessage(response, threadID, messageID);
  },
};
