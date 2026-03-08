const { getUser, updateUser } = require('../data/user');
const log = require('../logger')
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
        return api.sendMessage(`ما عندك حساب '-'`, event.threadID, event.messageID);
      }

      const isInBattle = user.character.battle?.status;
      
      if (isInBattle) {
          const opponentId = user.character.battle.opponent;
          const opp = await getUser(opponentId)
          let opponentName = opp.character.name;
          return api.sendMessage(
              `⊳خلص التحدي مع ${opponentName} اول.`,
              event.threadID, 
              event.messageID
          );
      }
      
      const cost = 50;
      if (user.diamond < cost) {
        return api.sendMessage(`ما عندك جواهر كفاية \n⊳ناقصك ${cost - user.diamond} جوهرة`, event.threadID, event.messageID);
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
        `⊳${user.character.name}\n كل الاحصائيات ماكس.`,
        event.threadID,
        event.messageID
      );
      
    } catch (error) {
      log.error(error);
      api.sendMessage(`${error}`, event.threadID, event.messageID);
    }
  }
};

