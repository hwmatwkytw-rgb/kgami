// Command: اختار (choose)
module.exports = {
  name: "اختار",
  otherName: ["choose"],
  rank: 0,
  description: 'يختار ليك البوت من بين عدة خيارات | يدعم من خيارين الي ما لا نهاية',
  usage: 'اختار ستارك مودي رودي',
  cooldown: 1,
  run: async (api, event, commands, args) => {
    if (args.length < 2) return api.sendMessage("أدخل الخيارات.\nمثال: اختار قهوة شاي عصير", event.threadID, event.messageID);
    
    const options = args.join(" ").split(/[\s|]/).filter(s => s.trim() !== "");
    
    if (options.length < 2) return api.sendMessage("أدخل خيارين على الأقل.", event.threadID, event.messageID);
    
    const choice = options[Math.floor(Math.random() * options.length)];
    api.sendMessage(`اختار ${choice} '-'`, event.threadID, event.messageID);
  }
};
