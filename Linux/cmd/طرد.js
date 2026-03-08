const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const log = require('../logger');

const img1 = path.join(__dirname, 'cache', 'bankai1.jpg');
const img2 = path.join(__dirname, 'cache', 'bankai2.jpg');

// الزخرفة الملكية للنصوص
const SEP = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";
const BUTTERFLY = "🦋";

const KICK_MESSAGE = 
  `亗 بـانـكـاي.. إلـى الـجـحـيـم 亗\n` +
  `${SEP}\n` +
  `Kiss or slap ?\n` +
  `كيس اور سلاب ؟\n` +
  `قبله او كف ؟\n` +
  `beso o bofetada ?\n` +
  `بيسو او بوفيتادا ?\n` +
  `${SEP}`;

module.exports = {
  name: 'بانكاي',
  otherName: ['طرد', 'kick'],
  rank: 0,
  cooldown: 3,

  run: async (api, event) => {
    const imgArray = [img1, img2];
    const randomImg = imgArray[Math.floor(Math.random() * imgArray.length)];

    const { threadID, messageID, senderID, messageReply } = event;
    const botID = api.getCurrentUserID();

    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs?.map(a => a.id) || [];

    const isBotAdmin = adminIDs.includes(botID);
    if (!isBotAdmin)
      return api.sendMessage(`${BUTTERFLY} | "أوه؟ عليكِ منحي رتبة الإدارة أولاً لتنفيذ الحُكم."`, threadID, messageID);

    const isExecutorAdmin = adminIDs.includes(senderID);
    const isExecutorDev = config.editor?.includes(senderID);

    if (!isExecutorAdmin && !isExecutorDev) {
      return api.sendMessage(`${BUTTERFLY} | "من أنتِ لتأمريني؟ لستِ من قادة الفيلق."`, threadID, messageID);
    }

    if (!messageReply) {
      return api.sendMessage(`${BUTTERFLY} | "عليكِ الرد على رسالة العضو المراد نفيه."`, threadID, messageID);
    }

    const targetID = messageReply.senderID;

    const isTargetBot = targetID === botID;
    const isTargetAdmin = adminIDs.includes(targetID);
    const isTargetDev = config.editor?.includes(targetID);

    if (!isExecutorDev) {
      if (isTargetDev) {
        return reverseKick(api, senderID, threadID, randomImg);
      }
    }

    if (isExecutorAdmin && !isExecutorDev) {
      if (isTargetAdmin) return reverseKick(api, senderID, threadID, randomImg);
      if (isTargetBot) return reverseKick(api, senderID, threadID, randomImg);
    }

    if (targetID === senderID) {
      return api.sendMessage(`${BUTTERFLY} | "هل تودين نفي نفسكِ؟ هذا ليس من شيم الهاشيرا."`, threadID, messageID);
    }

    const memberExists = threadInfo.userInfo?.some(m => m.id === targetID);
    if (!memberExists) return api.sendMessage(`${BUTTERFLY} | "هذا الشخص تم نفيه بالفعل."`, threadID, messageID);

    const targetInfo = threadInfo.userInfo.find(m => m.id === targetID);
    const targetName = targetInfo?.name || "العضو";
    const mention = [{ tag: targetName, id: targetID }];

    // 1. إرسال الرسالة والصورة أولاً
    await api.sendMessage(
      {
        body: `${KICK_MESSAGE}`,
        mentions: mention,
        attachment: fs.createReadStream(randomImg)
      },
      threadID
    );

    // 2. تنفيذ الطرد الفعلي بعد الإرسال
    setTimeout(async () => {
        try {
          await api.gcmember("remove", targetID, threadID);
        } catch (err) {
          log.error("Kick Error:" + err);
          return api.sendMessage(`${BUTTERFLY} | فشلت عملية النفي: ${err.message}`, threadID, messageID);
        }
    }, 1000); // تأخير بسيط لضمان وصول الصورة قبل الطرد
  }
};

async function reverseKick(api, executorID, threadID, randomImg) {
  const info = await api.getUserInfo(executorID);
  const name = info[executorID]?.name || "المشرف";
  const mention = [{ tag: name, id: executorID }];

  await api.sendMessage(
    {
      body: `${name}\n${BUTTERFLY} | "لقد تجرأتِ على قادتكِ.. تذوقي نصلكِ!"\n${KICK_MESSAGE}`,
      mentions: mention,
      attachment: fs.createReadStream(randomImg)
    },
    threadID
  );

  setTimeout(async () => {
      try {
        await api.gcmember("remove", executorID, threadID);
      } catch (e) {
        log.error(e);
      }
  }, 1000);
}
