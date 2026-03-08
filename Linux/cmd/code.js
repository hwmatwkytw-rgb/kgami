const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { getUser, updateUser } = require('../data/user');
const { styleText, styleNum } = require('../tools');

const codesPath = path.join(__dirname, '..', 'data', 'code.json');
const PREFIX = "⊳";
const DIVIDER = "───────";

module.exports = {
  name: "كود",
  rank: 0,
  type: ['الاموال'],
  cooldown: 3,
  run: async (api, event, commands, args) => {
    try {
      // تصحيح: إضافة messageID
      const { senderID, threadID, messageID } = event;
      const txt = args[0];
      
      if (!txt) {
        return api.sendMessage(`${PREFIX} كود <الرمز>`, threadID, messageID);
      }
      
      const user = await getUser(senderID);
      if (!user) {
        return api.sendMessage(`${PREFIX} ليس لديك شخصية`, threadID, messageID);
      }
      
      // التأكد من وجود status
      if (!user.status) user.status = {};
      
      // قراءة الملف
      let codes;
      try {
        codes = JSON.parse(fs.readFileSync(codesPath, 'utf8'));
      } catch (e) {
        return api.sendMessage("حدث خطأ في قراءة قاعدة بيانات الأكواد.", threadID, messageID);
      }

      const codeIndex = codes.findIndex(c => c.txt === txt);
      const code = codes[codeIndex];
      
      if (!code) {
        return api.sendMessage(`${PREFIX} الكود غير صحيح.`, threadID, messageID);
      }
      
      if (code.usageCount <= 0) {
        return api.sendMessage(`${PREFIX} هذا الكود منتهي الصلاحية.`, threadID, messageID);
      }
      
      user.status.usedCodes = user.status.usedCodes || [];
      if (user.status.usedCodes.includes(txt)) {
        return api.sendMessage(`${PREFIX} لقد استخدمت هذا الكود مسبقاً!`, threadID, messageID);
      }
      
      // إضافة الموارد (مع الحماية من القيم الفارغة)
      user.money = (user.money || 0) + (code.money || 0);
      user.diamond = (user.diamond || 0) + (code.diamond || 0);
      user.gold = (user.gold || 0) + (code.gold || 0);
      let isIMG = false
      if (code.img && code.img.length > 5) {
        user.img = code.img
        isIMG = true
        }
      
      if (user.character) {
        const stats = [
          'ATK', 'DEF', 'SPD', 'IQ', 'HP',
          'XATK', 'XDEF', 'XSPD', 'XIQ', 'XHP'
        ];
        
        for (const s of stats) {
          // تصحيح: استخدام || 0 لتجنب NaN
          if (code[s] > 0) {
            user.character[s] = (user.character[s] || 0) + (code[s] || 0);
          }
        }
      }
      
      // تحديث الكود في المصفوفة
      codes[codeIndex].usageCount -= 1;
      
      // تحديث المستخدم وحفظ الملف
      user.status.usedCodes.push(txt);
      await updateUser(senderID, user);
      fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2));
      
      // بناء الرسالة
      let msg = `${PREFIX} ${styleText('Success')}\n${DIVIDER}\n`;
      
      if (code.money > 0) msg += `${styleText('money')} +${styleNum(code.money)}\n`;
      if (code.diamond > 0) msg += `${styleText('diamond')} +${styleNum(code.diamond)}\n`;
      if (code.gold > 0) msg += `${styleText('gold')} +${styleNum(code.gold)}\n`;
      if (isIMG) msg += `\n${styleText('new profile img')}\n`
      // إضافة تفاصيل القوة للرسالة فقط إذا كانت موجودة
      const statKeys = ['ATK', 'DEF', 'SPD', 'IQ', 'HP', 'XATK', 'XDEF', 'XSPD', 'XIQ', 'XHP'];
      statKeys.forEach(s => {
          if (code[s] > 0) msg += `${styleText(s)} +${styleNum(code[s])}\n`;
      });
      
      api.sendMessage(msg.trim(), threadID, messageID);
      
    } catch (err) {
      log.error(err);
      api.sendMessage(`${PREFIX} حدث خطأ غير متوقع.`, event.threadID, event.messageID);
    }
  }
};

