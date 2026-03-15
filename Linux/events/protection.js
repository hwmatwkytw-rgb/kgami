const fs = require('fs-extra');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');
const spamMap = new Map();

module.exports = async function({ api, event }) {
  const { threadID, logMessageType, logMessageData, author, type, senderID } = event;
  
  // قراءة الإعدادات
  let config;
  try { config = await fs.readJson(configPath); } catch { return; }
  if (!config.protection || !config.protection[threadID]) return;
  const p = config.protection[threadID];

  // 1. مـكافحة الـسبام (تـعمل على كـل رسـالة)
  if (type === "message" && p.antispam && author !== api.getCurrentUserID()) {
    const now = Date.now();
    const user = spamMap.get(senderID) || { count: 0, time: now };
    if (now - user.time < 3000) {
      user.count++;
      if (user.count > 5) {
        api.removeUserFromGroup(senderID, threadID);
        api.sendMessage("✾ ┇ تـم طـردك بـسبب الـسبام! الفيلق للنخبة فقط.", threadID);
        return spamMap.delete(senderID);
      }
    } else { user.count = 1; user.time = now; }
    spamMap.set(senderID, user);
  }

  // 2. حـماية الـكنيات
  if (logMessageType === "log:user-nickname" && p.antinick && author !== api.getCurrentUserID()) {
    api.nickname(logMessageData.oldNickname, threadID, logMessageData.participantID);
    api.sendMessage("✾ ┇ حـماية الـكنيات مـفعـلة!", threadID);
  }

  // 3. حـماية الاسم والـصورة
  if (p.antichange && (logMessageType === "log:thread-name" || logMessageType === "log:thread-icon") && author !== api.getCurrentUserID()) {
    if (logMessageType === "log:thread-name") api.setTitle(logMessageData.oldThreadName, threadID);
    api.sendMessage("✾ ┇ حـماية إعـدادات الـمجموعة مـفعـلة!", threadID);
  }

  // 4. مـكافحة الـخروج
  if (logMessageType === "log:unsubscribe" && p.antileave) {
    const leftID = logMessageData.leftParticipantFbId;
    if (author === leftID) {
      api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("✾ ┇ مـمنوع الـهروب! تـم إعـادتك بـالـقوة.", threadID);
      });
    }
  }
};
