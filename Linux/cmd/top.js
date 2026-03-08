const { getAllUsers } = require('../data/user');
const config = require('../config.json');
const log = require('../logger');
const { styleNum } = require('../tools')

const SEP = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";
const BUTTERFLY = "🦋";

module.exports = {
  name: 'توب',
  type: ['الاموال'],
  otherName: ['top', 'الاغني'],
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    try {
      const DIAMOND_VALUE = Number(config.DIAMOND_VALUE) || 0; 
      const MAX_USERS = 10;

      const allUsers = await getAllUsers();

      if (!allUsers || allUsers.length === 0) {
        return api.sendMessage(`${BUTTERFLY} | السجلات فارغة، لا يوجد مستخدمون حالياً.`, event.threadID, event.messageID);
      }

      // ترتيب الأغنى (بدون تغيير في المنطق)
      const rankedUsers = allUsers
        .map(user => {
          const money = Number(user.money) || 0;
          const totalWealth = money ;

          return {
            id: user.id,
            name: user.character?.name || `صياد مجهول`,
            totalWealth
          };
        })
        .sort((a, b) => b.totalWealth - a.totalWealth);

      const usersToShow = Math.min(rankedUsers.length, MAX_USERS);

      // تنسيق الرسالة بأسلوب إبلين
      let message = `${SEP}\n${BUTTERFLY} | أغـنـى ${styleNum(usersToShow)} مـسـتـخـدمـيـن\n${SEP}\n`;

      for (let i = 0; i < usersToShow; i++) {
        const user = rankedUsers[i];
        const rank = i + 1;
        const formattedWealth = user.totalWealth.toLocaleString('en-US');

        message += `${styleNum(rank)}. ${user.name} ⊳ ${styleNum(formattedWealth)} جـنـيـه\n`;
      }

      message += `\n${SEP}`;

      api.sendMessage(message, event.threadID, event.messageID);

    } catch (err) {
      log.error('Error in توب command: ' + err);
      api.sendMessage(`${BUTTERFLY} | حدث خطأ أثناء فحص الخزينة: ${err.message}`, event.threadID, event.messageID);
    }
  }
};
