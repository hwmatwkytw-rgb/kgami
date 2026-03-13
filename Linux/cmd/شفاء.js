const { getUser, updateUser } = require('../data/user');
const log = require('../logger');
const { styleText, styleNum } = require('../tools');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = {
  name: 'شفاء',
  otherName: ['انعاش', 'heal', 'ايدوتنسي'],
  category: 'الألعاب', // تم تصنيفه ضمن فئة الألعاب
  rank: 0,
  cooldown: 30,
  run: async (api, event) => {
    try {
      const senderId = event.senderID;
      const user = await getUser(senderId);
      
      if (!user || !user.character) {
        return api.sendMessage(`${FLOWER} ┇ أوه؟ يبدو أنه لا يوجد سجل لك في الفيلق.. عليك إنشاء حساب أولاً.`, event.threadID, event.messageID);
      }

      // التحقق من حالة القتال (إذا كان الكود يدعم نظام المعارك المستمرة)
      const isInBattle = user.character.battle?.status;
      
      if (isInBattle) {
          const opponentId = user.character.battle.opponent;
          const opp = await getUser(opponentId);
          let opponentName = opp.character.name;
          return api.sendMessage(
              `${FLOWER} ┇ "لا يمكن أخذ قسط من الراحة بينما القتال مع ${opponentName} لا يزال مستمراً.. ركز!"`,
              event.threadID, 
              event.messageID
          );
      }
      
      const cost = 50;
      if (user.diamond < cost) {
        return api.sendMessage(`${FLOWER} ┇ اعتذاري.. العلاج يتطلب ${styleNum(cost)} جوهرة، ينقصك ${styleNum(cost - user.diamond)} لتلقي العلاج الكامل.`, event.threadID, event.messageID);
      }
      
      // خصم الجواهر
      user.diamond -= cost;
      
      // استعادة كل القيم إلى حدها الأقصى (القيم التي تبدأ بـ X هي الحد الأقصى)
      if (typeof user.character.XHP === 'number') user.character.HP = user.character.XHP;
      if (typeof user.character.XATK === 'number') user.character.ATK = user.character.XATK;
      if (typeof user.character.XDEF === 'number') user.character.DEF = user.character.XDEF;
      if (typeof user.character.XSPD === 'number') user.character.SPD = user.character.XSPD;
      if (typeof user.character.XIQ === 'number') user.character.IQ = user.character.XIQ;
      
      await updateUser(senderId, user);
      
      api.sendMessage(
        `${SEP}\n` +
        `   ✾ ┇ ⦿ ⟬ ${styleText('BUTTERFLY ESTATE')} ⟭\n` +
        `${SEP}\n` +
        `✾ ┇ الصياد: ${styleText(user.character.name)}\n` +
        `✾ ┇ : تم استعادة كامل القوة ✅\n\n` +
        ` "أسرع العبيد بلوك  \n` +
        `${SEP}`,
        event.threadID,
        event.messageID
      );
      
    } catch (error) {
      log.error(error);
      api.sendMessage(`${FLOWER} ┇ حدث خطأ في تحضير الدواء.`, event.threadID, event.messageID);
    }
  }
};
