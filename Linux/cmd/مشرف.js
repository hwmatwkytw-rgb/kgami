const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { getUser } = require('../data/user');
const configPath = path.join(__dirname, '..', 'config.json');

const FLOWER = "✾";
const SEP = "●───── ✾ ⌬ ✾ ─────●";

module.exports = {
  name: "مشرف",
  otherName: ['admin', 'الادمن'],
  category: "المطور", // تمت الإضافة لفئة المطور
  hide: true,
  rank: 2,
  cooldown: 5,
  description: 'إضافة وإزالة وعرض رتب المطورين والمشرفين في البوت',

  run: async (api, event, commands, args) => {
    const { senderID, threadID, messageID, mentions } = event;
    const action = args[0] ? args[0].toLowerCase() : null;

    let targetID = null;
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    let currentConfig;
    try {
      currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!Array.isArray(currentConfig.AdminsID)) currentConfig.AdminsID = [];
      if (!Array.isArray(currentConfig.editor)) currentConfig.editor = [];
    } catch (e) {
      currentConfig = { AdminsID: [], editor: [] };
    }

    if (!action) {
      return api.sendMessage(
        `${SEP}\n${FLOWER} ┇ الـخيارات الـمتاحة:\n${FLOWER} ┇ [ اضف | حذف | قائمة ]\n${SEP}`,
        threadID, messageID
      );
    }

    switch (action) {
      case 'اضف':
      case 'إضافة':
      case 'add':
        if (!targetID) {
          return api.sendMessage(`${FLOWER} ┇ عليكِ الإشارة إلى الشخص أولاً، لا أستطيع ضم الأشباح للفيلق.`, threadID, messageID);
        }

        const isAdmin = currentConfig.AdminsID.includes(targetID);
        const isDeveloper = currentConfig.editor.includes(targetID);

        if (isAdmin) {
          if (isDeveloper) return api.sendMessage(`${FLOWER} ┇ هذا الشخص يشغل رتبة "هاشيرا" بالفعل.`, threadID, messageID);
          
          currentConfig.AdminsID = currentConfig.AdminsID.filter(id => id !== targetID);
          currentConfig.editor.push(targetID);
          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
          return api.sendMessage(`${FLOWER} ┇ مبارك.. تم ترقيته من مبيد إلى هاشيرا بقرار ملكي. ✨`, threadID, messageID);
        }

        if (isDeveloper) return api.sendMessage(`${FLOWER} ┇ هذا الشخص هو هاشيرا بالفعل.`, threadID, messageID);

        currentConfig.AdminsID.push(targetID);
        fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
        return api.sendMessage(`${FLOWER} ┇ تم تسجيل العضو كـ "مبيد شياطين" جديد بنجاح. ✅`, threadID, messageID);

      case 'حذف':
      case 'remove':
        if (!targetID) return api.sendMessage(`${FLOWER} ┇ حددي الشخص المراد طرده من الفيلق.`, threadID, messageID);

        let removed = false;
        if (currentConfig.AdminsID.includes(targetID)) {
          currentConfig.AdminsID = currentConfig.AdminsID.filter(id => id !== targetID);
          removed = true;
        }
        if (currentConfig.editor.includes(targetID)) {
          currentConfig.editor = currentConfig.editor.filter(id => id !== targetID);
          removed = true;
        }

        if (!removed) return api.sendMessage(`${FLOWER} ┇ لا داعي للقلق.. هذا الشخص ليس لديه رتبة أصلاً.`, threadID, messageID);

        fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
        return api.sendMessage(`${FLOWER} ┇ تَمَّ سلب الرتبة.. عُد إلى صفوف العوام. ⚠️`, threadID, messageID);

      case 'قائمة':
      case 'list':
        const developers = [...new Set(currentConfig.editor)];
        const admins = [...new Set(currentConfig.AdminsID)];

        if (developers.length === 0 && admins.length === 0) {
          return api.sendMessage(`${FLOWER} ┇ السجلات فارغة، لا يوجد قادة هنا.`, threadID, messageID);
        }

        let msg = `${SEP}\n   亗 سِـجِـل قـادة الـفـيـلـق 亗\n${SEP}\n`;
        const ids = [...developers, ...admins];
        let info = {};
        try { info = await api.getUserInfo(ids); } catch (err) { log.error(err); }

        let fullList = [];
        developers.forEach(id => fullList.push({ id, rank: "هاشيرا (مطور)", p: 1 }));
        admins.forEach(id => fullList.push({ id, rank: "مبيد (مشرف)", p: 2 }));

        fullList.sort((a, b) => a.p - b.p);
        msg += fullList.map((u, i) => {
          const name = info?.[u.id]?.name || "عضو مجهول";
          return `${FLOWER} ${i + 1}. ${name}\n⌬ الرتبة: ${u.rank}`;
        }).join("\n\n");

        return api.sendMessage(`${msg}\n${SEP}`, threadID, messageID);

      default:
        return api.sendMessage(`${FLOWER} ┇ خيار خاطئ. استخدم: [ اضف | حذف | قائمة ]`, threadID, messageID);
    }
  }
};
