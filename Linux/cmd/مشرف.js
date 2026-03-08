// cmd/مشرف.js

const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { getUser } = require('../data/user')
const configPath = path.join(__dirname, '..', 'config.json');

const LINUX_PREFIX = "🦋"; 
const DIVIDER = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";

module.exports = {
  name: "مشرف",
  otherName: ['admin'],
  hide: true,
  rank: 2,
  cooldown: 5,
  type: 'إدارة البوت',
  discretion: 'يقوم بإضافة وازالة وعرض المشرفين',

  run: async (api, event, commands, args) => {
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

    // لا يوجد إجراء
    if (!action) {
      return api.sendMessage(
        `${DIVIDER}\n${LINUX_PREFIX} | الخيارات المتاحة هي:\n⌬ [ اضف | حذف | قائمة ]\n${DIVIDER}`,
        threadID, messageID
      );
    }

    // ================================
    // 🔥 التعامل مع الأوامر
    // ================================
    switch (action) {

      // -----------------------------
      // 🟢 إضافة أو ترقية
      // -----------------------------
      case 'اضف':
      case 'إضافة':
      case 'add':

        if (!targetID) {
          return api.sendMessage(`${LINUX_PREFIX} | "أوه؟ عليكِ الإشارة إلى الشخص أولاً، لا أستطيع ضم الأشباح للفيلق."`, threadID, messageID);
        }

        const isAdmin = currentConfig.AdminsID.includes(targetID);
        const isDeveloper = currentConfig.editor.includes(targetID);

        try {

          // لو هو مشرف → ترقيته مطور
          if (isAdmin) {

            if (isDeveloper) {
              return api.sendMessage(`${LINUX_PREFIX} | هذا الشخص يشغل رتبة "هاشيرا" بالفعل.`, threadID, messageID);
            }

            // إزالة من المشرفين
            const index = currentConfig.AdminsID.indexOf(targetID);
            currentConfig.AdminsID.splice(index, 1);

            // إضافة كمطور
            currentConfig.editor.push(targetID);

            fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');

            return api.sendMessage(`${LINUX_PREFIX} | "مبارك.. تم ترقيته من مبيد إلى هاشيرا بقرار ملكي."`, threadID, messageID);
          }

          // لو هو مطور مسبقاً
          if (isDeveloper) {
            return api.sendMessage(`${LINUX_PREFIX} | هذا الشخص هو هاشيرا بالفعل.`, threadID, messageID);
          }

          // إضافة كمشرف جديد
          currentConfig.AdminsID.push(targetID);
          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');

          return api.sendMessage(`${LINUX_PREFIX} | تم تسجيل العضو كـ "مبيد شياطين" جديد بنجاح.`, threadID, messageID);

        } catch (e) {
          log.error("Error adding admin:" + e);
          return api.sendMessage(`${LINUX_PREFIX} | خطأ: ${e.message}`, threadID, messageID);
        }

      // -----------------------------
      // 🔴 حذف
      // -----------------------------
      case 'حذف':
      case 'remove':

        if (!targetID) {
          return api.sendMessage(`${LINUX_PREFIX} | حددي الشخص المراد طرده من الفيلق.`, threadID, messageID);
        }

        try {
          let removed = false;

          const adminIdx = currentConfig.AdminsID.indexOf(targetID);
          if (adminIdx !== -1) {
            currentConfig.AdminsID.splice(adminIdx, 1);
            removed = true;
          }

          const devIdx = currentConfig.editor.indexOf(targetID);
          if (devIdx !== -1) {
            currentConfig.editor.splice(devIdx, 1);
            removed = true;
          }

          if (!removed) {
            return api.sendMessage(`${LINUX_PREFIX} | "لا داعي للقلق.. هذا الشخص ليس لديه رتبة أصلاً."`, threadID, messageID);
          }

          fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
          return api.sendMessage(`${LINUX_PREFIX} | "تَمَّ سلب الرتبة.. عُد إلى صفوف العوام."`, threadID, messageID);

        } catch (e) {
          log.error("Error removing admin/dev:" + e);
          return api.sendMessage(`${LINUX_PREFIX} | ${e.message}`, threadID, messageID);
        }

      // -----------------------------
      // 📜 عرض القائمة
      // -----------------------------
      case 'قائمة':
      case 'list':

        const developers = [...new Set(currentConfig.editor)];
        const admins = [...new Set(currentConfig.AdminsID)];

        if (developers.length === 0 && admins.length === 0) {
          return api.sendMessage(`${LINUX_PREFIX} | السجلات فارغة، لا يوجد قادة هنا.`, threadID, messageID);
        }

        let msg = `${DIVIDER}\n   亗 سِـجِـل قـادة الـفـيـلـق 亗\n${DIVIDER}\n`;

        const ids = [...developers, ...admins];
        let info = {};

        try {
          info = await api.getUserInfo(ids);
        } catch (err) {
          log.error("User info error: " + err);
        }

        let fullList = [];

        developers.forEach(id => {
          fullList.push({ id, rank: "هاشيرا (مطور)", priority: 1 });
        });

        admins.forEach(id => {
          fullList.push({ id, rank: "مبيد (مشرف)", priority: 2 });
        });

        fullList.sort((a, b) => a.priority - b.priority);
        msg += fullList.map((user, i) => {
          const name = info?.[user.id]?.name || getUser(user.id)?.character.name || "عضو مجهول";
          return `${LINUX_PREFIX} ${i + 1}. ${name}\n⌬ الرتبة: ${user.rank}`;
        }).join("\n\n");

        return api.sendMessage(`${msg}\n${DIVIDER}`, threadID, messageID);

      // -----------------------------
      // ❓ خيار خاطئ
      // -----------------------------
      default:
        return api.sendMessage(
          `${LINUX_PREFIX} | الخيارات المتاحة هي: [ اضف | حذف | قائمة ].`,
          threadID,
          messageID
        );
    }
  }
};
