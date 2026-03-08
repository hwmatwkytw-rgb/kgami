const fs = require('fs');
const path = require('path');
const { getUser, updateUser } = require('../data/user');
const { styleText, styleNum } = require('../tools');
const codesPath = path.join(__dirname, '..', 'data', 'code.json');

const COOLDOWN = 20 * 60 * 1000; 

module.exports = {
  name: 'هدية',
  rank: 2,
  run: async (api, event) => {
    try {
      const { senderID, threadID, messageID } = event;
      
      const user = await getUser(senderID);
      if (!user || !user.character) {
        return api.sendMessage('🦋 | لَيس لَديكَ كِيانٌ بَعد.. استَخدم "تسجيل" أولاً.', threadID, messageID);
      }
      
      if (!user.status) user.status = {};
      
      const lastGift = user.status.lastGiftTime || 0;
      const now = Date.now();
      
      if (now - lastGift < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastGift);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        return api.sendMessage(
          `🦋 ╰⊱ صَبراً جَميلاً.. ⊱╮\n\n` +
          `⌬ اِنتظر قليلاً أيها المحارب:\n` +
          `⌛ | ${styleNum(minutes)} دقيقة و ${styleNum(seconds)} ثانية`, 
          threadID, messageID
        );
      }
      
      const codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
      const validCodes = codes.filter(c => c.usageCount > 0);
      
      if (validCodes.length === 0) {
        return api.sendMessage('࿇ | للاسف.. لا توجد زهور (أكواد) في الحديقة حالياً.', threadID, messageID);
      }
      
      const randomCode = validCodes[Math.floor(Math.random() * validCodes.length)];
      
      try {
        const giftMsg = `🦋 ⊱ شـيـنـوبـو تُـرسـل لـك ⊰ 🦋\n\n` +
                        `✨ كـود الـهـديـة الخاص بـك:\n` +
                        `» ${randomCode.txt} «\n\n` +
                        `• استمتع بها بحكمة!`;
                        
        await api.sendMessage(giftMsg, senderID);
        
        user.status.lastGiftTime = now;
        await updateUser(user.id, user);
        
        return api.sendMessage(
          `⊱✿⊰ تَمَّ الإِرسال بنجاح ⊱✿⊰\n\n` +
          `🦋 | تَفقد خَاصك الآن (طلبات المراسلة).`, 
          threadID, messageID
        );
        
      } catch (sendError) {
        const publicMsg = `🦋 ⊱ هـديـة مـن شـيـنـوبـو ⊰ 🦋\n\n` +
                          `⌬ كودك هو: ${randomCode.txt}\n\n` +
                          `⚠️ (فشل الإرسال للخاص، تم العرض هنا)`;
        api.sendMessage(publicMsg, threadID, messageID);        
      }
      
    } catch (err) {
      console.error('Error in هدية command:', err);
      return api.sendMessage('❌ | حدث اضطراب في كيمياء البوت، حاول لاحقاً.', event.threadID, event.messageID);
    }
  }
};
