const { getUser, updateUser } = require('../data/user');

module.exports = {
  name: "change",
  rank: 2,
  cooldowns: 0,
  hide: true,
  run: async (api, event, commands, args) => {
    try {

      if (!event.messageReply)
        return api.sendMessage(
          `رد علي زول يا باطل '-'`,
          event.threadID,
          event.messageID
        );

      const field = args[0]; // بدون تحويل
      const valueArr = args.slice(1);

      if (!field || !valueArr.length)
        return api.sendMessage(
          `طريقة الاستخدام: تغيير [الخاصية] [القيمة]. مثال: تغيير MONEY 1000`,
          event.threadID,
          event.messageID
        );

      const targetID = event.messageReply.senderID;
      const user = await getUser(targetID);

      if (!user)
        return api.sendMessage(
          `دا زول ساي، ما عندو حساب.`,
          event.threadID,
          event.messageID
        );

      // =========================
      // الخصائص المسموح بها (كبيرة فقط)
      // =========================
      const rootNumerical = ["money", "diamond", "gold"];
      const characterNumerical = [
        "level", "ATK", "DEF", "SPD", "IQ", "HP",
        "XATK", "XDEF", "XSPD", "XIQ", "XHP"
      ];
      const characterString = ["name", "img", "type", "location"];

      const allowed = [
        ...rootNumerical,
        ...characterNumerical,
        ...characterString
      ];

      if (!allowed.includes(field))
        return api.sendMessage(
          `الخصائص المسموح بتعديلها هي: ${allowed.join(' | ')}`,
          event.threadID,
          event.messageID
        );

      // =========================
      // تجهيز القيمة
      // =========================
      let finalValue;
      let pastValue;

      const isNumerical = [...rootNumerical, ...characterNumerical].includes(field);
      const isCharacterField = [...characterNumerical, ...characterString].includes(field);

      if (isNumerical) {
        finalValue = Number(valueArr[0]);
        if (isNaN(finalValue))
          return api.sendMessage(
            `دا ما رقم يا باطل '-'`,
            event.threadID,
            event.messageID
          );
      } else {
        finalValue = valueArr.join(' ');
      }

      // =========================
      // التأكد من وجود الشخصية
      // =========================
      if (!user.character) user.character = {};

      // =========================
      // بناء التحديث بدون طغيان
      // =========================
      let updatePayload = {};

      if (isCharacterField) {
        pastValue = user.character[field] ?? 0;

        updatePayload.character = {
          ...user.character,
          [field]: finalValue
        };
      } else {
        pastValue = user[field] ?? 0;
        updatePayload[field] = finalValue;
      }

      // =========================
      // تنفيذ التعديل
      // =========================
      await updateUser(targetID, updatePayload);

      return api.sendMessage(
        `تم تعديل بنجاح:\n${pastValue} ⭢ ${finalValue}`,
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error('Error in change command:', err);
      return api.sendMessage(
        `حصل خطأ اثناء التعديل.`,
        event.threadID,
        event.messageID
      );
    }
  }
};
