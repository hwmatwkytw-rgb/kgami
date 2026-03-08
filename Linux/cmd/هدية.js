const fs = require('fs');
const path = require('path');
const { getUser, updateUser } = require('../data/user');
// تأكد من المسار الصحيح للأدوات
const { styleText, styleNum } = require('../tools') 
const codesPath = path.join(__dirname, '..', 'data', 'code.json');

const COOLDOWN = 20 * 60 * 1000; // 20 دقيقة

module.exports = {
  name: 'هدية',
  rank: 2,
  run: async (api, event) => {
    try {
      const { senderID, threadID, messageID } = event;
      
      const user = await getUser(senderID);
      if (!user || !user.character) {
        return api.sendMessage('ما عندك شخصية. استخدم "تسجيل" أولاً.', threadID, messageID);
      }
      
      if (!user.status) user.status = {};
      
      // التحقق من الوقت
      const lastGift = user.status.lastGiftTime || 0;
      const now = Date.now();
      
      if (now - lastGift < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastGift);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return api.sendMessage(`تعال بعد :\n${styleNum(minutes)} دقيقة و ${styleNum(styleNum(seconds))} ثانية`, threadID, messageID);
      }
      
      // قراءة الأكواد
      const codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
      const validCodes = codes.filter(c => c.usageCount > 0);
      
      if (validCodes.length === 0) {
        return api.sendMessage('لا توجد أكواد متاحة حالياً.', threadID, messageID);
      }
      
      const randomCode = validCodes[Math.floor(Math.random() * validCodes.length)];
      
      // محاولة الإرسال للخاص
      try {
        await api.sendMessage(`${randomCode.txt}`, senderID);
        
        // الحفظ فقط إذا نجح الإرسال
        user.status.lastGiftTime = now;
        await updateUser(user.id, user);
        
        return api.sendMessage(' تم إرسال هديتك في الخاص، تفقد رسائلك (قد تكون في طلبات المراسلة).', threadID, messageID);
        
      } catch (sendError) {
        // إذا فشل الإرسال (الخاص مغلق)
      api.sendMessage(`${randomCode.txt}`, event.threadID, event.messageID);        
// return api.sendMessage('❌ لم أتمكن من إرسال الهدية. تأكد أن الخاص مفتوح ولست تحظر البوت.', threadID, messageID);
      }
      
    } catch (err) {
      console.error('Error in هدية command:', err);
      return api.sendMessage('حدث خطأ أثناء تنفيذ أمر هدية.', event.threadID, event.messageID);
    }
  }
};

