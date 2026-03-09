const { getAllUsers } = require('../data/user');
const config = require('../config.json');
const log = require('../logger');
const { styleNum, styleText } = require('../tools');

const SEP = "⎔────────────⎔";
const ICON = "㊙︎"; // الرمز الجديد اللي اخترته يا بطل

module.exports = {
  name: 'توب',
  type: ['الاموال'],
  otherName: ['top', 'الاغنى'],
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    try {
      const MAX_USERS = 10;
      const allUsers = await getAllUsers();

      if (!allUsers || allUsers.length === 0) {
        return api.sendMessage(`⎔ السجلات فارغة، لا يوجد مستخدمون حالياً.`, event.threadID, event.messageID);
      }

      const rankedUsers = allUsers
        .map(user => {
          const money = Number(user.money) || 0;
          return {
            id: user.id,
            name: user.character?.name || `صياد مجهول`,
            totalWealth: money
          };
        })
        .sort((a, b) => b.totalWealth - a.totalWealth);

      const usersToShow = Math.min(rankedUsers.length, MAX_USERS);

      // الفاصل في البداية فقط
      let message = `${SEP}\n  ${styleText('TOP WEALTH')}\n\n`;

      for (let i = 0; i < usersToShow; i++) {
        const user = rankedUsers[i];
        const rank = i + 1;
        const formattedWealth = user.totalWealth.toLocaleString('en-US');

        // استخدام الرمز الجديد ㊙︎ بين الاسم والمبلغ
        message += `${styleNum(rank)}. ${user.name} ${ICON} ${styleNum(formattedWealth)} جنيه\n`;
      }

      // الفاصل في النهاية فقط
      message += `\n${SEP}`;

      api.sendMessage(message, event.threadID, event.messageID);

    } catch (err) {
      log.error('Error in توب command: ' + err);
      api.sendMessage(`❌ حدث خطأ أثناء فحص الخزينة.`, event.threadID, event.messageID);
    }
  }
};
