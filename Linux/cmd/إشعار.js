const { styleText, styleNum } = require('../tools');
const log = require('../logger');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = {
  name: "إشعار",
  otherName: ['شين', 'قولي'],
  rank: 2, // للمطور فقط
  hide: true, // مخفي من قائمة المساعده العامة
  category: "المطور", // تصنيفه للمطور في الـ Help الخاص بك
  cooldown: 15,
  description: 'يقوم بإرسال رسالة لجميع المجموعات المشترك بها البوت',
  run: async (api, event, commands, args) => {
    const startTime = Date.now();
    const { threadID, messageID } = event;
    const broadcastMessage = args.join(' ');

    if (!broadcastMessage) {
      return api.sendMessage(`${FLOWER} ┇ الرجاء كتابة الرسالة المراد بثها.`, threadID, messageID);
    }

    try {
      const threads = await api.getThreadList(100, null, ['INBOX']); 
      const groupThreads = threads.filter(t => t.isGroup);

      if (!groupThreads.length) {
        return api.sendMessage(`${FLOWER} ┇ البوت ليس عضواً في أي مجموعة حالياً.`, threadID, messageID);
      }

      let successCount = 0;
      let failedCount = 0;

      for (const thread of groupThreads) {
        try {
          // التنسيق الذي سيظهر في المجموعات الأخرى (بزقرة إبلين)
          const msgToGroups = 
            `${SEP}\n` +
            `   ✾ ┇ ⦿ ⟬ ${styleText('BROADCAST')} ⟭\n` +
            `${SEP}\n` +
            `${broadcastMessage}\n\n` +
            `✾ ┇ ${styleText('Message from Dev')}\n` +
            `${SEP}`;
          
          await api.sendMessage(msgToGroups, thread.threadID);
          successCount++;
        } catch (err) {
          failedCount++;
        }
      }

      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

      // تقرير البث للمطور (أبو عبيدة)
      let response = 
        `${SEP}\n` +
        `   ✾ ┇ ⦿ ⟬ ${styleText('BROADCAST REPORT')} ⟭\n` +
        `${SEP}\n` +
        `✾ ┇ ${styleText('Groups')} : ${styleNum(groupThreads.length)}\n` +
        `✾ ┇ ${styleText('Success')} : ${styleNum(successCount)}\n` +
        `✾ ┇ ${styleText('Failed')}  : ${styleNum(failedCount)}\n` +
        `✾ ┇ ${styleText('Time')}    : ${styleNum(durationSec)}s\n` +
        `${SEP}`;

      api.sendMessage(response, threadID, messageID);

    } catch (err) {
      log.error("خطأ في أمر البث: " + err);
      api.sendMessage(`${FLOWER} ┇ حدث خطأ أثناء عملية البث.`, threadID, messageID);
    }
  }
};
