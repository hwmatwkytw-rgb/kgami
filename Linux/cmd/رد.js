const { addReply, removeReply, getAllReplies } = require("../data/replice");

module.exports = {
  name: "ردود",
  otherName: ["reply"],
  category: "المجموعة", // تم النقل لقسم المجموعة
  cooldown: 0,
  hide: true,
  rank: 1, // رتبة الإدارة (أدمن/مطور)
  run: async (api, event) => {
    const { threadID, messageID } = event;
    const args = event.body.split(" ").slice(1);
    const action = args.shift()?.toLowerCase();
    
    if (!action) {
      return api.sendMessage("✾ ┇ حـدد الإجـراء الـمطلوب [ اضف | حذف ].", threadID, messageID);
    }
    
    if (action === "اضف" || action === "أضف") {
      const input = args.join(" ").split("|").map(t => t.trim());
      const trigger = input[0];
      const response = input[1];

      if (!trigger || !response) {
        return api.sendMessage("✾ ┇ الـصـيغة: ردود اضف [الكلمة] | [الرد]", threadID, messageID);
      }
      
      await addReply(trigger, response);
      api.sendMessage(`✅`, threadID, messageID);

    } else if (action === "حذف") {
      const trigger = args.join(" ").trim();
      if (!trigger) {
        return api.sendMessage("✾ ┇ الـصـيغة: ردود حذف [الكلمة]", threadID, messageID);
      }
      
      try {
        await removeReply(trigger);
        api.sendMessage(`✅ تم الـحذف.`, threadID, messageID);
      } catch (err) {
        api.sendMessage(`✾ ┇ ${err.message}`, threadID, messageID);
      }
    } else {
      api.sendMessage("✾ ┇ خـيار غـير مـعروف، اسـتخدم اضف أو حذف.", threadID, messageID);
    }
  }
};
