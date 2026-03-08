// cmd/الاقوي.js
const { getAllUsers } = require('../data/user'); // 💡 يجب التأكد من صحة مسار الاستيراد
const log = require('../logger')
const DIVIDER = '＿＿＿＿＿＿';
const FLOWER = '⊳';
const { styleNum } = require('../tools')
module.exports = {
  name: "الاقوي",
  otherName: ['الاسياد', 'الاقوى'],
  rank: 0,
  cooldown: 5,
  run: async (api, event) => {
    const { threadID, messageID } = event;
    try {
      // 1. جلب جميع المستخدمين
      const allUsers = await getAllUsers();
      
      // 2. تصفية المستخدمين الذين لديهم بيانات شخصية وإحصائيات قصوى (X-Stats)
      const qualifiedUsers = allUsers.filter(user =>
        user.character &&
        (user.character.XHP || user.character.XATK || user.character.XDEF || user.character.XSPD || user.character.XIQ)
      );
      
      if (qualifiedUsers.length === 0) {
        return api.sendMessage(
          `${FLOWER}Zero '-'`,
          threadID,
          messageID
        );
      }
    
      const rankedUsers = qualifiedUsers.map(user => {
        const stats = user.character;
        const totalPower =
          (stats.XHP || 0) +
          (stats.XATK || 0) +
          (stats.XDEF || 0) +
          (stats.XSPD || 0) +
          (stats.XIQ || 0 );
        
        return {
          name: stats.name,
          nenType: stats.type || 'غير محدد',
          totalPower: totalPower, // يتم الاحتفاظ بها للفرز فقط
        };
      });
      
      rankedUsers.sort((a, b) => b.totalPower - a.totalPower);
      
      // 5. أخذ أفضل 5
      const topFive = rankedUsers.slice(0, 5);

      let message =
        `${FLOWER}الاسياد الخمسة\n` + 
  	     `${DIVIDER}\n` 
      topFive.forEach((user, index) => {
        message += `${FLOWER}${index + 1} .${user.name} ☇ ${user.nenType}\n`;
        //message += `${FLOWER}الفئة: ${user.nenType}\n`;
        message += `  القوة الكلية: ${styleNum(user.totalPower)}\n${DIVIDER}\n`;
        //message += (index < topFive.length - 1) ? `${DIVIDER}\n` : '';
      });
      
     // message += `\n${DIVIDER}`;
      
      return api.sendMessage(message, threadID, messageID);
      
    } catch (error) {
      log.error('خطأ في أمر الأقوى:' + error );
      return api.sendMessage(
        `${FLOWER}${error}.`,
        threadID,
        messageID
      );
    }
  }
};
