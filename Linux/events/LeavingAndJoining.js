// events/LeavingAndJoining.js
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const jimp = require('jimp').default;
const { saveGroup, getGroup, deleteGroup } = require('../data/thread');
const log = require('../logger');
const config = require('../config.json');
const img = path.join(__dirname, 'cache', 'join.jpg')
module.exports = async function LeavingAndJoining(api, event) {
  const botID = api.getCurrentUserID();
  const threadID = event.threadID;

  // جلب بيانات المجموعة إن وجدت
  let group = await getGroup(threadID);

  switch (event.logMessageType) {
    
    // -------------------- خروج عضو أو البوت --------------------
    case "log:unsubscribe": {
      const leftId = event.logMessageData.leftParticipantFbId;

      // لو البوت خرج → حذف بيانات المجموعة إن كانت موجودة
      if (leftId === botID) {
        if (group) {
          log.warn(`⚠️ Bot removed → deleting DB group (${threadID})`);
          await deleteGroup(threadID);
        }
        return;
      }

      // عضو عادي خرج
      let profileName = "Unknown";
      try {
        const profileData = await api.getUserInfo(leftId);
        profileName = profileData?.name || "Unknown";
      } catch (err) {
        log.error("Error fetching user info: " + err);
      }

      const type =
        event.author === leftId ?
        `العب اتحسس غادر براهو '-'` :
        `الادمن جغمو '-'`;

      let membersCount = "Unknown";
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        membersCount = threadInfo.participantIDs.length;
      } catch (err) {
        log.error("Error getting member count: " + err);
      }

      const farewellMessage =
        `${profileName} ${type} '-'`;

      const profilePicturePath = await safeGetProfilePicture(leftId);
      await sendMessage(api, threadID, farewellMessage, profilePicturePath);

      break;
    }

    // -------------------- دخول عضو جديد أو البوت --------------------
    case "log:subscribe": {
      const { addedParticipants } = event.logMessageData;
      if (!addedParticipants?.length) return;

      const botAdded = addedParticipants.some(p => p.userFbId === botID);

      if (botAdded) {
        // جلب معلومات المجموعة
        let threadInfo;
        try {
          threadInfo = await api.getThreadInfo(threadID);
        } catch (err) {
          log.error("Error fetching thread info: " + err);
          return;
        }

        const ownerFbIds = [
          ...config.editor ,...(Array.isArray(config.AdminsID) ? config.AdminsID : [])
        ].filter(Boolean);

        const addedBy = event.author;

        // إضافة غير قانونية
        if (!ownerFbIds.includes(addedBy)) {
          await api.sendMessage("⚠️ | إضافة غير قانونية.", threadID);
          await api.gcmember("remove", botID, threadID);
          return;
        }

        // إضافة قانونية → حفظ المجموعة في DB
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
          body: `${threadInfo.threadName}  [${membersCount}]`,
              attachment: fs.createReadStream(img)
        },
          threadID
        );

        return;
      }

      // إضافة أعضاء آخرين
      for (const participant of addedParticipants) {
        const uid = participant.userFbId;

        let profileName = "Unknown";
        try {
          const profileData = await api.getUserInfo(uid);
          profileName = profileData?.name || "Unknown";
        } catch {}

        let membersCount = "Unknown";
        try {
          const info = await api.getThreadInfo(threadID);
          membersCount = info.participantIDs.length;
        } catch {}

        let threadName = "Unknown";
        try {
          const info = await api.getThreadInfo(threadID);
          threadName = info.threadName || "Unknown";
        } catch {}

        const currentTime = moment().tz("Africa/Casablanca").format("hh:mm A")
          .replace("AM", "صباحًا")
          .replace("PM", "مساءً");

        const msg =
          `⊳${profileName} انت الان في \n${threadName}
لا تتعجب اذا رايت متحولين او خرفان او شواذ\nرقمك ${membersCount}`;

        await api.sendMessage(msg, threadID);
      }

      break;
    }
  }
};

// -------------------- إرسال الرسالة والصورة --------------------
async function sendMessage(api, threadID, message, attachmentPath) {
  try {
    if (!attachmentPath || !fs.existsSync(attachmentPath)) {
      return await api.sendMessage(message, threadID);
    }

    await api.sendMessage(
      {
        body: message,
        attachment: fs.createReadStream(attachmentPath)
      },
      threadID
    );
  } catch (err) {
    log.error("Error sending message: " + err);
  }
}

// -------------------- تحميل الصورة بدون انهيار البوت --------------------
async function safeGetProfilePicture(userID) {
  try {
    const cacheDir = path.join(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const img = await Jimp.read(imgUrl);

    const filePath = path.join(cacheDir, `profile_${userID}.png`);
    await img.writeAsync(filePath);

    return filePath;

  } catch (e) {
    log.error("Error fetching profile picture: " + e);
    return null;
  }
}
