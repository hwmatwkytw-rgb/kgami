const config = require('../config.json');
const log = require('../logger');

module.exports = {
  name: 'غادر',
  otherName: ['اخرج', 'out'],
  category: "المطور", // إضافة الفئة هنا
  rank: 1,
  cooldown: 5,
  hide: true,
  run: async (api, event) => {
    
    const threadID = event.threadID;
    
    // جلب ID البوت
    let botID;
    try {
      botID = await api.getCurrentUserID();
    } catch (e) {
      return api.sendMessage("✾ ┇ فشل الحصول على ID البوت.", threadID, event.messageID);
    }
    
    // محاولة مغادرة المجموعة
    try {
      // إرسال رسالة وداع قبل الخروج
      await api.sendMessage("✾ ┇ بناءً على طلب المطور، سأغادر الآن. وداعاً!", threadID);
      
      // تنفيذ أمر الخروج (إزالة البوت لنفسه)
      await api.removeUserFromGroup(botID, threadID);
      
    } catch (e) {
      log.error("Kick Error: " + e);
      api.sendMessage("✾ ┇ لا أستطيع الخروج، تأكد من أنني أدمن في المجموعة.", threadID);
    }
  }
};
