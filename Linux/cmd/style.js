const PREFIX = "⊳";
const DIVIDER = "───────";
const {
  setNumStyle,
  setTextStyle,
  NUM_STYLES,
  TEXT_STYLES
} = require('../tools');

module.exports = {
  name: 'style',
  rank: 2,
  hide: true,
  run: async (api, event, commands, args) => {
    
    const type = args[0]; // 'txt' أو 'num'
    const index = parseInt(args[1]);

    if (type === 'txt' && !isNaN(index)) {
      if (TEXT_STYLES[index]) {
        setTextStyle(index);
        return api.sendMessage(` تم اختيار استايل\n ${TEXT_STYLES[index].sample}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage(`رقم الاستايل غير موجود`, event.threadID, event.messageID);
      }
    }

    // 2. منطق اختيار استايل الأرقام
    if (type === 'num' && !isNaN(index)) {
      if (NUM_STYLES[index]) {
        setNumStyle(index);
        return api.sendMessage(`تم اختيار استايل الأرقام:\n ${NUM_STYLES[index].sample}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage(`رقم الاستايل غير موجود`, event.threadID, event.messageID);
      }
    }

    // 3. عرض قائمة استايلات النصوص (في حال لم يتم إدخال رقم)
    if (type === 'txt') {
      let msg = '⊳ Text Styles:\n\n';
      TEXT_STYLES.forEach((s, i) => {
        msg += `[${i}] ${s.sample}\n\n`;
      });
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    // 4. عرض قائمة استايلات الأرقام
    if (type === 'num') {
      let msg = '⊳ Number Styles:\n\n';
      NUM_STYLES.forEach((s, i) => {
        msg += `[${i}] ${s.sample}\n\n`;
      });
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    // 5. رسالة التعليمات في حال خطأ في الأمر
    api.sendMessage(
      `⊳ الاستخدام:\n` +
      `• عرض القائمة: style txt أو style num\n` +
      `• اختيار استايل: style txt [رقم] أو style num [رقم]`,
      event.threadID, event.messageID 
    );
  }
};

