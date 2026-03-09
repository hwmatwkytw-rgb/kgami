// cmd/help.js المعدل لظهور كل الأوامر للمطور
const { getUserRank } = require("../handlers/handleCmd");
const log = require('../logger')
const config = require('../config.json')
const { styleText, styleNum } = require('../tools')

module.exports = {
  name: "اوامر",
  otherName: ['help', 'أوامر'],
  rank: 0,
  cooldown: 0,
  hide: false,
  prefix: true,
  run: async (api, event, allCommands) => {
    try {
      const { senderID, threadID, messageID } = event;
      const args = event.body.split(/\s+/).slice(1);
      const userRank = getUserRank(senderID, config);
      
      // التعديل هنا: إذا كانت الرتبة 2 (مطور) يعرض حتى الأوامر المخفية
      const availableCommands = (allCommands || []).filter(cmd => {
        if (userRank >= 2) return cmd.name !== 'اوامر'; // المطور يرى كل شيء
        return cmd.rank <= userRank && cmd.hide === false && cmd.name !== 'اوامر';
      });

      if (availableCommands.length === 0) {
        return api.sendMessage(`لا توجد أوامر متاحة حالياً.`, threadID, messageID);
      }
      
      // رفعنا العدد لـ 30 عشان المطور يشوف أغلب أوامره في صفحة واحدة
      const itemsPerPage = userRank >= 2 ? 30 : 15; 
      const pageNumber = parseInt(args[0], 10) || 1;
      const totalCommands = availableCommands.length;
      const totalPages = Math.ceil(totalCommands / itemsPerPage);
      
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      const commandsList = [];
      const slicedCmds = availableCommands.slice(startIndex, endIndex);
      
      for (let i = 0; i < slicedCmds.length; i += 3) {
        const row = slicedCmds.slice(i, i + 3).map(cmd => `${cmd.name}`).join(' ㊙︎ ');
        commandsList.push(row);
      }
      
      const finalCommands = commandsList.join('\n');

      const messageText = `⎔────────────⎔
  ${styleText(' 𝒔𝒉𝒊𝒏𝒐𝒑𝒐')}
⎔────────────⎔
${finalCommands}

. ${styleText('Total')} : ${styleNum(totalCommands)}
. ${styleText('Page')} : ${styleNum(pageNumber)} / ${styleNum(totalPages)}
⎔────────────⎔`;
      
      api.sendMessage(messageText, threadID, messageID);
    } catch (err) {
      log.error(err);
      api.sendMessage('erorr in help.js', config.editor);
    }
  }
};
