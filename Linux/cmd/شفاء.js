const { getUser, updateUser } = require('../data/user');
const log = require('../logger')

const SEP = "⎔────────────⎔";
const BUTTERFLY = "✮";

module.exports = {
  name: 'شفاء',
  otherName: ['انعاش', 'heal', 'ايدوتنسي'],
  rank: 0,
  cooldown: 30,
  run: async (api, event) => {
    try {
      const senderId = event.senderID;
      const user = await getUser(senderId);
      
      if (!user || !user.character) {
        return api.sendMessage(`${BUTTERFLY} | أوه؟ يبدو أنه لا يوجد سجل لك في الفيلق.. عليك إنشاء حساب أولاً.`, event.threadID, event.messageID);
      }

      const isInBattle = user.character.battle?.status;
      
      if (isInBattle) {
          const opponentId = user.character.battle.opponent;
          const opp = await getUser(opponentId)
          let opponentName = opp.character.name;
          return api.sendMessage(
              `${BUTTERFLY} | "لا يمكن أخذ قسط من الراحة بينما القتال مع ${opponentName} لا يزال مستمراً.. ركز!"`,
              event.threadID, 
              event.messageID
          );
      }
      
      const cost = 50;
      if (user.diamond < cost) {
        return api.sendMessage(`${BUTTERFLY} | اعتذاري.. العلاج يتطلب ${cost} جوهرة، ينقصك ${cost - user.diamond} لتلقي العلاج الكامل.`, event.threadID, event.messageID);
      }
      
      // خصم الكرستالات
      user.diamond -= cost;
      
      // استعادة كل القيم إلى حدها الأقصى
      if (typeof user.character.XHP === 'number') user.character.HP = user.character.XHP;
      if (typeof user.character.XATK === 'number') user.character.ATK = user.character.XATK;
      if (typeof user.character.XDEF === 'number') user.character.DEF = user.character.XDEF;
      if (typeof user.character.XSPD === 'number') user.character.SPD = user.character.XSPD;
      if (typeof user.character.XIQ === 'number') user.character.IQ = user.character.XIQ;
      
      await updateUser(senderId, user);
      
      api.sendMessage(
        `${SEP}\n${BUTTERFLY} | مـنـزل الـفـراشـة 🏡\n${SEP}\n` +
        `💠 الصياد: ${user.character.name}\n` +
        `✨ "تم استعادة كامل القوة.. أسرع، الشياطين لا تنتظر أحداً." ✨\n` +
        `${SEP}`,
        event.threadID,
        event.messageID
      );
      
    } catch (error) {
      log.error(error);
      api.sendMessage(`${BUTTERFLY} | حدث خطأ في تحضير الدواء: ${error}`, event.threadID, event.messageID);
    }
  }
};
