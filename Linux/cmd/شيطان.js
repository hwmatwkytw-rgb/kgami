const config = require('../config.json');
const { styleText } = require('../tools'); // تأكد من وجود دالة الزخرفة في الـ tools

const SEP = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";

module.exports = {
  name: "شيطان", // تم تغيير الاسم كما طلبت
  rank: 1,
  description: 'يُفعل حجاب الحماية لمنع الأقوياء من استغلال الضعفاء (منع التنمر).',
  cooldowns: 0,
  run: async (api, event, args) => {
    
    if (!args[0]) {
        return api.sendMessage(
            `${SEP}\n🦋 | أوه؟ عليكِ الاختيار أولاً:\n` +
            `⌬ [ تشغيل | ايقاف ]\n` +
            `${SEP}`, 
            event.threadID, event.messageID
        );
    }

    switch (args[0].toLowerCase()) {
      case 'on':
      case 'تشغيل':
        config.ATTACKD = true;
        api.sendMessage(
            `${SEP}\n🦋 | "تَمَّ تفعيل حجاب الحماية.. لن أسمح لأي شيطان بالتنمر على من هم أضعف منه هنا." ✨\n${SEP}`, 
            event.threadID, event.messageID
        );
        break;

      case 'off':
      case 'ايقاف':
        config.ATTACKD = false;
        api.sendMessage(
            `${SEP}\n🦋 | "تَمَّ رفع القيود.. ساحة القتال الآن بلا رحمة، كوني حذرة." 🥀\n${SEP}`, 
            event.threadID, event.messageID
        );
        break;
        
      default:
        api.sendMessage(`🦋 | عذراً.. الخيار الصحيح هو [ تشغيل ] أو [ ايقاف ].`, event.threadID, event.messageID);
    }
  }
}
