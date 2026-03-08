const { getAllUsers } = require('../data/user');
const config = require('../config.json');
const log = require('../logger');
const { styleNum } = require('../tools')
module.exports = {
  name: 'توب',
    type: ['الاموال'],
  otherName: ['top', 'الاغني'],
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    try {
      const DIAMOND_VALUE = Number(config.DIAMOND_VALUE) || 0; // قيمة الماسة من config.json
      const MAX_USERS = 10;

      const allUsers = await getAllUsers();

      if (!allUsers || allUsers.length === 0) {
        return api.sendMessage(`مافي ناس '-'`, event.threadID, event.messageID);
      }

      // ترتيب الأغنى
      const rankedUsers = allUsers
        .map(user => {
          const money = Number(user.money) || 0;
          const diamond = Number(user.diamond) || 0;

          const totalWealth = money ;

          return {
            id: user.id,
            name: user.character?.name || `مستخدم ${user.id}`,
            totalWealth
          };
        })
        .sort((a, b) => b.totalWealth - a.totalWealth);

      const usersToShow = Math.min(rankedUsers.length, MAX_USERS);

      // موضوع الرسالة
      let message = `أغنى ${usersToShow} مستخدمين:\n`;
      message += "＿＿＿＿＿＿＿＿＿\n";

      for (let i = 0; i < usersToShow; i++) {
        const user = rankedUsers[i];
        const rank = i + 1;
        const formattedWealth = user.totalWealth.toLocaleString('en-US');

        message += `${styleNum(rank)}. ${user.name}  ${styleNum(formattedWealth)} جنيه\n`;
      }

      //message += "───────────";

      api.sendMessage(message, event.threadID, event.messageID);

    } catch (err) {
      log.error('Error in توب command: ' + err);
      api.sendMessage(`⊳ Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};
