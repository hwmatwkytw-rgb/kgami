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
      const userRank = getUserRank(senderID, config);
      
      // تصفية الأوامر: المطور يرى كل شيء، المستخدم يرى رتبته فقط
      const availableCommands = (allCommands || []).filter(cmd => {
        if (userRank >= 2) return cmd.name !== 'اوامر'; 
        return cmd.rank <= userRank && cmd.hide === false && cmd.name !== 'اوامر';
      });

      if (availableCommands.length === 0) {
        return api.sendMessage(`⦿───── ✾ ⌬ ✾ ─────⦿\n✾ ┇ لا توجد أوامر متاحة حالياً.\n●───── ✾ ⌬ ✾ ─────●`, threadID, messageID);
      }
      
      const totalCommands = availableCommands.length;

      // تقسيم كل الأوامر المتاحة إلى فئات
      const categories = {};
      availableCommands.forEach(cmd => {
        const cat = cmd.category || "أخرى";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.name);
      });

      let finalCommands = "";
      for (const cat in categories) {
        finalCommands += `✾ ┇ ⦿ ⟬ ${cat} ⟭\n`;
        const cmds = categories[cat];
        // عرض الأوامر بنظام 3 في كل سطر
        for (let i = 0; i < cmds.length; i += 3) {
          finalCommands += `✾ ┇  ${cmds.slice(i, i + 3).join(' ⦿ ')}\n`;
        }
        finalCommands += `✾ ┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
      }

      const messageText = `⦿───── ✾ ⌬ ✾ ─────⦿
✾ ┇ ⦿ ⟬ ${styleText('𝒆𝒑𝒍𝒊𝒏 𝒃𝒐𝒕')} ⟭
●───── ✾ ⌬ ✾ ─────●
${finalCommands}
✾ ┇ . ${styleText('استمتع بل بوت')} : ${styleNum(totalCommands)}
✾ ┇ . ${styleText('🇯🇵')} : ${userRank >= 2 ? styleText('Developer') : styleText('User')}
●───── ✾ ⌬ ✾ ─────●`;
      
      api.sendMessage(messageText, threadID, messageID);
    } catch (err) {
      log.error(err);
      api.sendMessage('error in help.js', config.editor);
    }
  }
};
