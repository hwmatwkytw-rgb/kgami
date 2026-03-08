const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const log = require('../logger');

const img1 = path.join(__dirname, 'cache', 'bankai1.jpg');
const img2 = path.join(__dirname, 'cache', 'bankai2.jpg');

const KICK_MESSAGE =
  `Kiss or slap ?
كيس اور سلاب ؟
قبله او كف ؟
beso o bofetada ?
بيسو او بوفيتادا ?`;

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

    // ⛔ نحتاج بيانات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs?.map(a => a.id) || [];

    // ✔ تحقق لو البوت مشرف
    const isBotAdmin = adminIDs.includes(botID);
    if (!isBotAdmin)
      return api.sendMessage(`جيب ادمن يا باطل '-'`, threadID, messageID);

    // ✔ المنفذ: مشرف قروب؟ أو مطور بوت؟
    const isExecutorAdmin = adminIDs.includes(senderID);   // مشرف مجموعة
    const isExecutorDev = config.editor?.includes(senderID); // مطور البوت

    if (!isExecutorAdmin && !isExecutorDev) {
      return api.sendMessage(`انت منو يا ولدنا ؟ '-'`, threadID, messageID);
    }

    // ✔ لازم يرد على رسالة
    if (!messageReply) {
      return api.sendMessage(`رد علي العب يا بطل '-'`, threadID, messageID);
    }

    const targetID = messageReply.senderID;

    // ✔ معلومات الهدف
    const isTargetBot = targetID === botID;
    const isTargetAdmin = adminIDs.includes(targetID);
    const isTargetDev = config.editor?.includes(targetID);

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // 🛑 حماية: مطور البوت أقوى من الجميع
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    if (!isExecutorDev) {
      // منفذ غير مطور
      if (isTargetDev) {
        return reverseKick(api, senderID, threadID, randomImg);
      }
    }

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // 🛑 حماية: مشرف المجموعة لا يطرد مشرف آخر
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    if (isExecutorAdmin && !isExecutorDev) {
      if (isTargetAdmin) return reverseKick(api, senderID, threadID, randomImg);
      if (isTargetBot) return reverseKick(api, senderID, threadID, randomImg);
    }

    // ⛔ منع طرد نفسك
    if (targetID === senderID) {
      return api.sendMessage(`تحش نفسك لشنو ؟ '-'`, threadID, messageID);
    }

    // التحقق من وجود الهدف بالقروب
    const memberExists = threadInfo.userInfo?.some(m => m.id === targetID);
    if (!memberExists) return api.sendMessage(`دا مجغوم '-'`, threadID, messageID);

    // Mentions
    const targetInfo = threadInfo.userInfo.find(m => m.id === targetID);
    const targetName = targetInfo?.name || "العضو";

    const mention = [{ tag: targetName, id: targetID }];

    // رسالة ما قبل الطرد
    await api.sendMessage(
      {
        body: `${KICK_MESSAGE}`,
        mentions: mention,
        attachment: fs.createReadStream(randomImg)
      },
      threadID
    );

    // تنفيذ الطرد الفعلي (حسب مكتبتك)
    try {
      await api.gcmember("remove", targetID, threadID);
    } catch (err) {
      log.error("Kick Error:" + err);
      return api.sendMessage(
        `فشلت عملية الطرد:\n${err.message}`,
        threadID,
        messageID
      );
    }
  }
};


// ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
// 🔥 دالة الطرد العكسي
// ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

async function reverseKick(api, executorID, threadID, randomImg) {

  const info = await api.getUserInfo(executorID);
  const name = info[executorID]?.name || "المشرف";

  const mentions = [{ tag: name, id: executorID }];

  await api.sendMessage(
    {
      body: `${name}\n${KICK_MESSAGE}`,
      mentions: mention,
      attachment: fs.createReadStream(randomImg)
    },
    threadID
  );

  try {
    await api.gcmember("remove", executorID, threadID);
  } catch (e) {
    log.error(e);
  }

  return;
}
