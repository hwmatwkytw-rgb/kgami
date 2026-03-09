// cmd/help.js
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
  description: 'يقوم بعرض الاوامر المتاحة',
  usageCount: 0,
  run: async (api, event, allCommands) => {
    try {
      const { senderID, threadID, messageID } = event;
      const args = event.body.split(/\s+/).slice(1);
      const userRank = getUserRank(senderID, config);
      
      const availableCommands = (allCommands || [])
        .filter(cmd => cmd.rank <= userRank)
        .filter(cmd => cmd.hide === false)
        .filter(cmd => cmd.name !== 'اوامر'); 
      
      if (availableCommands.length === 0) {
        return api.sendMessage(`${config.name}`, threadID, messageID);
      }
      
      const itemsPerPage = 15; // زيادة العدد لتناسب العرض الثلاثي
      const pageNumber = parseInt(args[0], 10) || 1;
      const totalCommands = availableCommands.length;
      const totalPages = Math.ceil(totalCommands / itemsPerPage);
      
      if (pageNumber > totalPages || pageNumber < 1) {
        return api.sendMessage(`إجمالي عدد الصفحات 𐃘 ${totalPages}`, threadID, messageID);
      }
      
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // منطق توزيع الأوامر: كل 3 في سطر
      const commandsList = [];
      const slicedCmds = availableCommands.slice(startIndex, endIndex);
      
      for (let i = 0; i < slicedCmds.length; i += 3) {
        const row = slicedCmds.slice(i, i + 3).map(cmd => `⊳${cmd.name}`).join(' | ');
        commandsList.push(row);
      }
      
      const finalCommands = commandsList.join('\n');

      const messageText = `⎔────────────⎔
  ${styleText('COMMANDS LIST')}
⎔────────────⎔
${finalCommands}

. ${styleText('Total')} : ${styleNum(totalCommands)}
. ${styleText('Page')} : ${styleNum(pageNumber)} / ${styleNum(totalPages)}
⎔────────────⎔`;
      
      api.sendMessage(messageText, threadID, messageID);
    } catch (err) {
      log.error(err);
      api.sendMessage('erorr in cmd file help.js', config.editor, null, true);
    }
  }
};
