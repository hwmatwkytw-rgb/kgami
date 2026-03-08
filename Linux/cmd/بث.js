const { styleText, styleNum } = require('../tools');
const log = require('../logger');
module.exports = {
  name: "بث",
  otherName: ['sendall'],
  rank: 2,
  hide: true,
  cooldown: 15,
  description: 'يقوم بارسالة بث الي جميع المجموعات التي انضم اليها البوت',
  run: async (api, event, commands, args) => {
    const startTime = Date.now();
    const { threadID, messageID } = event;
    const broadcastMessage = args.join(' ');

    if (!broadcastMessage) {
      return api.sendMessage(styleText('⊳ write message'), threadID, messageID);
    }
    try {

      const threads = await api.getThreadList(100, null, ['INBOX']); 

      const groupThreads = threads.filter(t => t.isGroup);

      if (!groupThreads.length) {
        return api.sendMessage('⊳ البوت ليس عضوًا في أي مجموعة حالياً.', threadID, messageID);
      }

      // 2️⃣ إرسال الرسالة لكل مجموعة
      let successCount = 0;
      let failedThreads = [];

      for (const thread of groupThreads) {
        try {
          await api.sendMessage(`⊳${styleText('message from editor')}\n＿＿＿＿＿＿＿＿＿\n${broadcastMessage}`, thread.threadID);
          successCount++;
        } catch (err) {
          failedThreads.push(thread.threadName || thread.threadID);
        }
      }

      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
      let response = `＿＿＿＿＿＿＿＿＿\n`;
      //response += `⊳تقرير البث:\n`;
      response += `⊳${styleText('group count')}: ${styleNum(groupThreads.length)}\n`;
      response += `⊳${styleText('success send')}: ${styleNum(successCount)}\n`;
      response += `⊳${styleText('failed send')}: ${styleNum(failedThreads.length)}\n`;
      response += `⊳${styleText('time')}: ${styleNum(durationSec)}${styleText('s')}\n`;
      //response += `＿＿＿＿＿＿＿＿＿`;

      api.sendMessage(response, threadID, messageID);

    } catch (err) {
      log.error("خطأ في أمر البث: " + err);
      api.sendMessage('error', threadID, messageID);
    }
  }
};



