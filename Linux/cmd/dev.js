const config = require('../config.json');

module.exports = {
  name: "معالجة",
  otherName: ['وضع_المطور', 'تطوير'],
  category: "المطور", // إضافة الفئة المطلوبة
  rank: 1, // رتبة المطور
  hide: true,
  description: 'يقوم بتشغيل وضع التطوير (منع الأعضاء من استخدام الأوامر)',
  cooldowns: 0,
  run: async (api, event, commands, args) => {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(`✾ ┇ يرجى اختيار الحالة [ تشغيل | ايقاف ]`, threadID, messageID);
    }

    let msg = "";
    switch (args[0].toLowerCase()) {
      case 'on':
      case 'تشغيل':
        config.developmentMode = true;
        msg = "🚀 تـم تـفعيل وضع الـتطوير.\n⏣ ┇";
        break;
      case 'off':
      case 'ايقاف':
        config.developmentMode = false;
        msg = "✅ لآن يـمكن للـجميع اسـتخدام الـبوت بـحرية.";
        break;
      default:
        return api.sendMessage(`✾ ┇ خيار غير صحيح، استخدم [ تشغيل | ايقاف ]`, threadID, messageID);
    }

    const response = `●────── ✾ ⌬ ✾ ──────●\n✾ ┇ ⦿ ⟬ وﺿﻊ الـتـطـويـر ⟭\n✾ ┇\n✾ ┇ ${msg}\n✾ ┇\n●────── ✾ ⌬ ✾ ──────●`;
    
    api.sendMessage(response, threadID, messageID);
  }
};
