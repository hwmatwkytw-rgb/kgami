const fs = require('fs');
const path = require('path');
const { getUser, updateUser } = require('../data/user');
const { styleText, styleNum } = require('../tools');
const codesPath = path.join(__dirname, '..', 'data', 'code.json');

// التهدئة: 20 دقيقة
const COOLDOWN = 20 * 60 * 1000; 

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = {
  name: 'هدية',
  category: 'الألعاب',
  rank: 2, // للمطورين أو الرتب العالية حسب نظامك
  run: async (api, event) => {
    try {
      const { senderID, threadID, messageID } = event;
      
      const user = await getUser(senderID);
      if (!user || !user.character) {
        return api.sendMessage(`${FLOWER} ┇ ليس لديك سجل في الفيلق.. استخدم "تسجيل" أولاً.`, threadID, messageID);
      }
      
      if (!user.status) user.status = {};
      
      const lastGift = user.status.lastGiftTime || 0;
      const now = Date.now();
      
      if (now - lastGift < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastGift);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        return api.sendMessage(
          `${SEP}\n` +
          `   ✾ ┇ ⦿ ⟬ ${styleText('COOLDOWN')} ⟭\n` +
          `${SEP}\n` +
          `✾ ┇ صبراً جميلاً أيها المحارب..\n` +
          `✾ ┇ انتظر: ${styleNum(minutes)} دقيقة و ${styleNum(seconds)} ثانية\n` +
          `${SEP}`, 
          threadID, messageID
        );
      }
      
      if (!fs.existsSync(codesPath)) {
          return api.sendMessage(`${FLOWER} ┇ حديقة الأكواد غير موجودة حالياً.`, threadID, messageID);
      }

      const codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
      const validCodes = codes.filter(c => c.usageCount > 0);
      
      if (validCodes.length === 0) {
        return api.sendMessage(`${FLOWER} ┇ للاسف.. لا توجد زهور (أكواد) في الحديقة حالياً.`, threadID, messageID);
      }
      
      const randomCode = validCodes[Math.floor(Math.random() * validCodes.length)];
      
      try {
        const giftMsg = 
          `${SEP}\n` +
          `   ✾ ┇ ⦿ ⟬ ${styleText('ROYAL GIFT')} ⟭\n` +
          `${SEP}\n` +
          `✾ ┇ كود الهدية الخاص بك:\n` +
          `» ${styleText(randomCode.txt)} «\n\n` +
          `✨ "استخدمه بحكمة في تطوير قوتك" ✨\n` +
          `${SEP}`;
                        
        await api.sendMessage(giftMsg, senderID);
        
        user.status.lastGiftTime = now;
        await updateUser(senderID, user);
        
        return api.sendMessage(
          `${SEP}\n` +
          `   ✾ ┇ ⦿ ⟬ ${styleText('SENT SUCCESS')} ⟭\n` +
          `${SEP}\n` +
          `✾ ┇ تفقد خاصك الآن (طلبات المراسلة).\n` +
          `${SEP}`, 
          threadID, messageID
        );
        
      } catch (sendError) {
        // في حال كان الخاص مغلقاً
        const publicMsg = 
          `${SEP}\n` +
          `   ✾ ┇ ⦿ ⟬ ${styleText('GIFT ALERT')} ⟭\n` +
          `${SEP}\n` +
          `✾ ┇ كودك هو: ${styleText(randomCode.txt)}\n` +
          `⚠️ (فشل الإرسال للخاص، تم العرض هنا)\n` +
          `${SEP}`;
        api.sendMessage(publicMsg, threadID, messageID);        
      }
      
    } catch (err) {
      console.error('Error in هدية command:', err);
      return api.sendMessage(`${FLOWER} ┇ حدث خطأ أثناء استخراج الهدية.`, event.threadID, event.messageID);
    }
  }
};
