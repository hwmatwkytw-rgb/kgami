// cmd/مشرف.js

const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { getUser } = require('../data/user')
const { styleText, styleNum } = require('../tools');
const configPath = path.join(__dirname, '..', 'config.json');

const ICON = "㊙︎"; 
const SEP = "⎔────────────⎔";

module.exports = {
  name: "مشرف",
  otherName: ['admin'],
  hide: true,
  rank: 2,
  cooldown: 5,
  type: 'إدارة البوت',
  description: 'يقوم بإضافة وازالة وعرض المشرفين',

  run: async (api, event, args) => {
    const { senderID, threadID, messageID, mentions } = event;
    const action = args[0] ? args[0].toLowerCase() : null;

    // استخراج الشخص المستهدف
    let targetID = null;
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // قراءة الملف
    let currentConfig;
    try {
      currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!Array.isArray(currentConfig.AdminsID)) currentConfig.AdminsID = [];
      if (!Array.isArray(currentConfig.editor)) currentConfig.editor = [];
    } catch (e) {
      currentConfig = { AdminsID: [], editor: [] };
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
    }

    if (!action) {
      return api.sendMessage(
        `${SEP}\n  ${styleText('ADMIN OPTIONS')}\n${SEP}\n${ICON} [ اضف | حذف | قائمة ]\n\n${SEP}`,
        threadID, messageID
      );
    }

    switch (action) {
      case 'اضف':
      case 'إضافة':
      case 'add':
        if (!targetID) {
          return api.sendMessage(`${ICON} | عليك الإشارة إلى الشخص أولاً لتعديل رتبته.`, threadID, messageID);
        }

        const isAdmin = currentConfig.AdminsID.includes(targetID);
        const isDeveloper = currentConfig.editor.includes(targetID);

        try {
          if (isAdmin) {
            if (isDeveloper) return api.sendMessage(`${ICON} | هذا الشخص يشغل رتبة "مطور" بالفعل.`, threadID, messageID);
            const index = currentConfig.AdminsID.indexOf(targetID);
            currentConfig.AdminsID.splice(index, 1);
            currentConfig.editor.push(targetID);
            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
            return api.sendMessage(`${ICON} | تمت ترقية العضو من "مشرف" إلى "مطور" بنجاح.`, threadID, messageID);
          }

          if (isDeveloper) return api.sendMessage(`${ICON} | هذا الشخص هو مطور بالفعل.`, threadID, messageID);

          currentConfig.AdminsID.push(targetID);
          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
          return api.sendMessage(`${ICON} | تم تسجيل العضو كـ "مشرف" جديد في البوت.`, threadID, messageID);
        } catch (e) {
          log.error(e);
          return api.sendMessage(`${ICON} | خطأ: ${e.message}`, threadID, messageID);
        }

      case 'حذف':
      case 'remove':
        if (!targetID) return api.sendMessage(`${ICON} | حدد الشخص المراد سلب رتبته.`, threadID, messageID);
        try {
          let removed = false;
          const adminIdx = currentConfig.AdminsID.indexOf(targetID);
          if (adminIdx !== -1) { currentConfig.AdminsID.splice(adminIdx, 1); removed = true; }
          const devIdx = currentConfig.editor.indexOf(targetID);
          if (devIdx !== -1) { currentConfig.editor.splice(devIdx, 1); removed = true; }

          if (!removed) return api.sendMessage(`${ICON} | هذا الشخص ليس لديه رتبة أصلاً.`, threadID, messageID);

          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
          return api.sendMessage(`${ICON} | تم سلب الرتبة والعودة لصفوف العوام.`, threadID, messageID);
        } catch (e) {
          return api.sendMessage(`${ICON} | ${e.message}`, threadID, messageID);
        }

      case 'قائمة':
      case 'list':
        const developers = [...new Set(currentConfig.editor)];
        const admins = [...new Set(currentConfig.AdminsID)];

        if (developers.length === 0 && admins.length === 0) {
          return api.sendMessage(`${ICON} | السجلات فارغة، لا يوجد قادة هنا.`, threadID, messageID);
        }

        let msg = `${SEP}\n  ${styleText('ROYAL LEADERS')}\n${SEP}\n`;
        const ids = [...developers, ...admins];
        let info = {};
        try { info = await api.getUserInfo(ids); } catch (err) { log.error(err); }

        let fullList = [];
        developers.forEach(id => fullList.push({ id, rank: "مطور", priority: 1 }));
        admins.forEach(id => fullList.push({ id, rank: "مشرف", priority: 2 }));

        fullList.sort((a, b) => a.priority - b.priority);
        msg += fullList.map((user, i) => {
          const name = info?.[user.id]?.name || "عضو مجهول";
          return `${styleNum(i + 1)}. ${name}\n⌬ الرتبة: ${user.rank}`;
        }).join("\n\n");

        return api.sendMessage(`${msg}\n\n${SEP}`, threadID, messageID);

      default:
        return api.sendMessage(`${ICON} | الخيارات المتاحة: [ اضف | حذف | قائمة ].`, threadID, messageID);
    }
  }
};
