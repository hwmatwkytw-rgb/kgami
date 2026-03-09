const { styleText, styleNum } = require('../tools');
const log = require('../logger');

const SEP = "⎔────────────⎔";
const ICON = "㊙︎";

module.exports = {
  name: "بث",
  otherName: ['sendall', 'broadcast'],
  rank: 2,
  hide: true,
  cooldown: 15,
  description: 'يقوم بإرسال رسالة لجميع المجموعات المشترك بها البوت',
  run: async (api, event, commands, args) => {
    const startTime = Date.now();
    const { threadID, messageID } = event;
    const broadcastMessage = args.join(' ');

    if (!broadcastMessage) {
      return api.sendMessage(`${ICON} | الرجاء كتابة الرسالة المراد بثها.`, threadID, messageID);
    }

    try {
      const threads = await api.getThreadList(100, null, ['INBOX']); 
      const groupThreads = threads.filter(t => t.isGroup);

      if (!groupThreads.length) {
        return api.sendMessage(`${ICON} | البوت ليس عضواً في أي مجموعة حالياً.`, threadID, messageID);
      }

      let successCount = 0;
      let failedCount = 0;

      for (const thread of groupThreads) {
        try {
          // التنسيق الذي سيظهر في المجموعات الأخرى
          const msgToGroups = `${SEP}\n  ${styleText('BROADCAST')}\n${SEP}\n${broadcastMessage}\n\n${ICON} ${styleText('Message from Dev')}\n${SEP}`;
          await api.sendMessage(msgToGroups, thread.threadID);
          successCount++;
        } catch (err) {
          failedCount++;
        }
      }

      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

      // تقرير البث للمطور (سينكو)
      let response = `${SEP}\n  ${styleText('BROADCAST REPORT')}\n${SEP}\n`;
      response += `${ICON} ${styleText('Groups')} : ${styleNum(groupThreads.length)}\n`;
      response += `${ICON} ${styleText('Success')} : ${styleNum(successCount)}\n`;
      response += `${ICON} ${styleText('Failed')}  : ${styleNum(failedCount)}\n`;
      response += `${ICON} ${styleText('Time')}    : ${styleNum(durationSec)}s\n\n`;
      response += `${SEP}`;

      api.sendMessage(response, threadID, messageID);

    } catch (err) {
      log.error("خطأ في أمر البث: " + err);
      api.sendMessage(`${ICON} | حدث خطأ أثناء عملية البث.`, threadID, messageID);
    }
  }
};
