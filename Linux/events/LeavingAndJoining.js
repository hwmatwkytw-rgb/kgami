const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const Jimp = require('jimp'); // تأكد من مطابقة الإسم للموجود في ملفاتك
const { saveGroup, getGroup, deleteGroup } = require('../data/thread');
const log = require('../logger');
const config = require('../config.json');
const { styleText, styleNum } = require('../tools');

const img = path.join(__dirname, 'cache', 'join.jpg');
const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";

module.exports = async function LeavingAndJoining(api, event) {
  const botID = api.getCurrentUserID();
  const threadID = event.threadID;

  let group = await getGroup(threadID);

  switch (event.logMessageType) {
    
    case "log:unsubscribe": {
      const leftId = event.logMessageData.leftParticipantFbId;

      if (leftId === botID) {
        if (group) {
          log.warn(`⚠️ Bot removed → deleting DB group (${threadID})`);
          await deleteGroup(threadID);
        }
        return;
      }

      let profileName = "Unknown";
      try {
        const profileData = await api.getUserInfo(leftId);
        profileName = profileData[leftId]?.name || "Unknown";
      } catch (err) {
        log.error("Error fetching user info: " + err);
      }

      const type = event.author === leftId ? `وزع بي وشك يا عب 🦆` : `الادمن جغمو`;
      const farewellMessage = `${profileName} ${type} '-'`;

      const profilePicturePath = await safeGetProfilePicture(leftId);
      await sendMessage(api, threadID, farewellMessage, profilePicturePath);
      break;
    }

    case "log:subscribe": {
      const { addedParticipants } = event.logMessageData;
      if (!addedParticipants?.length) return;

      const botAdded = addedParticipants.some(p => p.userFbId === botID);

      if (botAdded) {
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (err) {
          log.error("Error fetching thread info: " + err);
          return;
        }

        const ownerFbIds = [...config.editor, ...(Array.isArray(config.AdminsID) ? config.AdminsID : [])].filter(Boolean);
        if (!ownerFbIds.includes(event.author)) {
          await api.sendMessage("⚠️ | إضافة غير قانونية.", threadID);
          await api.removeUserFromGroup(botID, threadID);
          return;
        }

        const groupData = {
          id: threadID,
          name: threadInfo.threadName || "",
          emoji: threadInfo.emoji || "",
          img: threadInfo.imageSrc || "",
          members: threadInfo.participantIDs || [],
          admins: threadInfo.adminIDs || [],
        };
        await saveGroup(groupData);

        const membersCount = threadInfo.participantIDs.length;
        await api.sendMessage({
          body: `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText(threadInfo.threadName || 'الـمـجـمـوعـة')} ⟭\n${SEP}\n✾ ┇ تم تفعيل النظام بنجاح.\n✾ ┇ عدد الأعضاء: ${styleNum(membersCount)}\n${SEP}`,
          attachment: fs.createReadStream(img)
        }, threadID);
        return;
      }

      // --- ترحيب الأعضاء الجدد (تجميع الكل في رسالة واحدة) ---
      let threadName = "Unknown";
      let totalMembers = "Unknown";
      try {
        const info = await api.getThreadInfo(threadID);
        threadName = info.threadName || "Unknown";
        totalMembers = info.participantIDs.length;
      } catch {}

      let welcomeNames = "";
      for (let i = 0; i < addedParticipants.length; i++) {
        const uid = addedParticipants[i].userFbId;
        let profileName = "Unknown";
        try {
          const profileData = await api.getUserInfo(uid);
          profileName = profileData[uid]?.name || "Unknown";
        } catch {}
        welcomeNames += `\n${styleNum(i + 1)} ┇ ${styleText(profileName)}`;
      }

      const welcomeMsg = 
        `${SEP}\n` +
        `   ✾ ┇ ⦿ ⟬ ${styleText('WELCOME TO THE SQUAD')} ⟭\n` +
        `${SEP}\n` +
        `✾ ┇ أهلاً بك في: ${styleText(threadName)}\n` +
        `${welcomeNames}\n\n` +
        `${SEP}\n` +
        `✾ ┇ ​كُـن كَـعَـابِـرِ سَـبِـيـلٍ..
وَاتْـرُكْ خَـلْـفَـكَ كُـلَّ أَثَـرٍ جَـمِـيـلٍ..
فَـمَـا نَـحْـنُ فِي الـدُّنْـيَـا إِلَّا ضُـيُـوفٌ..
وَمَـا عَـلَى الضَّـيْـفِ إِلَّا الـرَّحِـيـلُ.\n` +
        `✾ ┇ انت الآن ضمن ${styleNum(totalMembers)} محارب\n` +
        `${SEP}`;

      await api.sendMessage(welcomeMsg, threadID);
      break;
    }
  }
};

async function sendMessage(api, threadID, message, attachmentPath) {
  try {
    if (!attachmentPath || !fs.existsSync(attachmentPath)) {
      return await api.sendMessage(message, threadID);
    }
    await api.sendMessage({ body: message, attachment: fs.createReadStream(attachmentPath) }, threadID);
  } catch (err) { log.error("Error sending message: " + err); }
}

async function safeGetProfilePicture(userID) {
  try {
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imgUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const img = await Jimp.read(imgUrl);
    const filePath = path.join(cacheDir, `profile_${userID}.png`);
    await img.writeAsync(filePath);
    return filePath;
  } catch (e) { log.error("Error fetching profile picture: " + e); return null; }
}
