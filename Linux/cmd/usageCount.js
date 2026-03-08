const log = require("../logger");
const { styleNum } = require('../tools')
module.exports = {
  name: "usagecount",
  otherName: ["الاستخدام", "استخدام"],
  rank: 1, // يتطلب رتبة Admin أو أعلى
  cooldown: 5,
  type: ['معلومات'],
  description: "عرض إحصائيات استخدام الأوامر وتصنيفها حسب الأكثر استخداماً.",
  usage: "احصائيات_البوت",
  hide: true,
  run: async (api, event, commands, args) => {
    
    // 1. تصفية الأوامر التي تم استخدامها
    const usedCommands = commands.filter(cmd => cmd.usageCount && cmd.usageCount > 0);

    if (usedCommands.length === 0) {
      return api.sendMessage("لم يتم استخدام أي أوامر بعد لتظهر الإحصائيات.", event.threadID, event.messageID);
    }

    // 2. ترتيب الأوامر حسب usageCount تنازلياً
    usedCommands.sort((a, b) => b.usageCount - a.usageCount);

    // 3. بناء الرسالة
    let msg = `إحصائيات استخدام الأوامر\n`;
    msg += `ـــــــــــــــــ\n`;

    usedCommands.slice(0, 10).forEach((cmd, index) => { // عرض أعلى 10 أوامر
      msg += `[${styleNum(index + 1)}]${cmd.name}    ${styleNum(cmd.usageCount)}\n`;
    });
    
    // حساب إجمالي الاستخدام
    const totalUsage = commands.reduce((sum, cmd) => sum + (cmd.usageCount || 0), 0);
    
    msg += `\nإجمالي استخدام الأوامر: ${styleNum(totalUsage.toLocaleString())}`;

    api.sendMessage(msg, event.threadID, event.messageID);
  }
};

