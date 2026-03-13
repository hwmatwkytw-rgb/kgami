const { getAllUsers } = require('../data/user');
const config = require('../config.json');
const log = require('../logger');
const { styleText } = require('../tools');

// ستايل أرقام عريض (Bold) - الستايل الخامس
const styleNumBold = (num) => {
  const boldNums = {
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
    '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  return String(num).split('').map(d => boldNums[d] || d).join('');
};

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = {
  name: 'توب',
  category: 'الألعاب', 
  otherName: ['top', 'الاغنى'],
  rank: 0,
  cooldown: 5,

  run: async (api, event) => {
    try {
      const MAX_USERS = 10;
      const allUsers = await getAllUsers();

      if (!allUsers || allUsers.length === 0) {
        return api.sendMessage(`${FLOWER} ┇ السجلات فارغة، لا يوجد محاربون حالياً.`, event.threadID, event.messageID);
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

      let message = `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText('TOP WEALTH')} ⟭\n${SEP}\n`;

      for (let i = 0; i < usersToShow; i++) {
        const user = rankedUsers[i];
        const rank = i + 1;
        const formattedWealth = user.totalWealth.toLocaleString('en-US');

        // استخدام الأرقام العريضة والزقرة الجديدة
        message += `✾ ┇ ${styleNumBold(rank)} . ${user.name} ➪ ${styleText(formattedWealth)} 𝖲𝖣𝖦\n`;
      }

      message += `${SEP}`;

      api.sendMessage(message, event.threadID, event.messageID);

    } catch (err) {
      log.error('Error in توب command: ' + err);
      api.sendMessage(`${FLOWER} ┇ حدث خطأ أثناء فحص خزينة الفيلق.`, event.threadID, event.messageID);
    }
  }
};
