const config = require('../config.json');
const log = require('../logger');

module.exports = {
name: 'غادر',
otherName: ['اخرج', 'out'],
rank: 1,
cooldown: 5,
hide: true,
run: async (api, event) => {
  
  const senderID = event.senderID;
  const threadID = event.threadID;
  
  // جلب ID البوت
  let botID;
  try {
    botID = await api.getCurrentUserID();
  } catch (e) {
    return api.sendMessage("⊳فشل الحصول على ID البوت.", threadID, event.messageID);
  }
  
  // إرسال طلب تأكيد
  
  try {
    await api.gcmember("remove", botID, event.threadID)
    
  } catch (e) {
    log.error("Kick Error: " + e);
    api.sendMessage("⊳لا أستطيع الخروج، تأكد من الصلاحيات.", threadID);
  }
  
}

}

