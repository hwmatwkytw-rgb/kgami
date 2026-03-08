const { addReply, removeReply, getAllReplies } = require("../data/replice");

module.exports = {
  name: "ردود",
  otherName: ["reply"],
  type: ['البوت'],
  cooldown: 0,
  hide: true,
  rank: 1, // فقط للأدمن
  run: async (api, event) => {
    const args = event.body.split(" ").slice(1);
    const action = args.shift()?.toLowerCase();
    
    if (!action) {
      api.sendMessage("حدد الاجراء المطلوب.", event.threadID, event.messageID);
      return;
    }
    
    if (action === "اضف") {
      const [trigger, response] = args.join(" ").split("|").map(t => t.trim());
      if (!trigger || !response) {
        api.sendMessage("الصيغة الصحيحة: ردود اضف نص الرسالة | الرد", event.threadID, event.messageID);
        return;
      }
      await addReply(trigger, response);
      api.sendMessage(`✅`, event.threadID, event.messageID);
    } else if (action === "حذف") {
      const trigger = args.join(" ").trim();
      if (!trigger) {
        api.sendMessage("❌ الصيغة الصحيحة: ردود حذف نص الرسالة", event.threadID, event.messageID);
        return;
      }
      try {
        await removeReply(trigger);
        api.sendMessage(`✅ تم`, event.threadID, event.messageID);
      } catch (err) {
        api.sendMessage(err.message, event.threadID, event.messageID);
      }
    } else {
      api.sendMessage("خيار غير معروف.", event.threadI, event.messageID);
    }
  }
};
