// commands/register_custom.js
const { getUser, saveUser } = require('../data/user');
const log = require('../logger');
const config = require('../config.json');

function getInitialStatsByType(type) {
  const stats = {
    'معزز':   { HP: 350, ATK: 220, DEF: 180, SPD: 120, IQ: 130 },
    'محول':   { HP: 320, ATK: 260, DEF: 150, SPD: 130, IQ: 140 },
    'باعث':   { HP: 300, ATK: 200, DEF: 140, SPD: 200, IQ: 160 },
    'مجسد':   { HP: 280, ATK: 210, DEF: 170, SPD: 170, IQ: 170 },
    'متلاعب': { HP: 260, ATK: 160, DEF: 140, SPD: 230, IQ: 210 },
    'متخصص': { HP: 300, ATK: 180, DEF: 150, SPD: 150, IQ: 220 }
  };

  return stats[type] || stats['معزز'];
}

module.exports = {
  name: 'سجلو',
  otherName: ['savehim'],
  rank: 2,          // ← رتبة 2 فقط
  cooldown: 3,
  description: 'امر يقوم بتسجيل المستخدمين نيابة عنهم في قاعدة البيانات',
  run: async (api, event, commands, args) => {
    try {
      const threadID = event.threadID;
      const messageID = event.messageID;

      // يجب الرد على مستخدم
      if (!event.messageReply) {
        return api.sendMessage(
          `رد علي زول يا باطل '-'`,
          threadID,
          messageID
        );
      }

      const targetID = event.messageReply.senderID;

      // هل لديه حساب؟
      const exist = await getUser(targetID);
      if (exist) {
        api.setMessageReaction('🦧', messageID, threadID);
        return api.sendMessage(
          `انت جنيت ؟ ما بتعرف  ${exist.character.name}؟ '-'`,
          threadID,
          messageID
        );
      }

      // استخراج الاسم من args
      const name = args.join(" ");
      if (!name) {
        return api.sendMessage(
          "اكتب اسم الشخصية بعد.\nمثال:\nسجل اسم_الشخصية",
          threadID,
          messageID
        );
      }

      // اختيار فئة عشوائية
      const nenTypes = ['معزز', 'معزز','محول','محول','باعث','باعث','مجسد','مجسد','متلاعب', 'متخصص'];
      const randomType = nenTypes[Math.floor(Math.random() * nenTypes.length)];

      // الإحصائيات
      const stats = getInitialStatsByType(randomType);

      // بناء الحساب الجديد
      const newUser = {
        id: targetID,
	gold: 1,
        diamond: 50,
        money: 1000,
        character: {
          name,
          type: randomType,
          level: 1,
          rating: 0,
          bar: ['⓿', ''],

          HP: stats.HP,
          XHP: stats.HP,

          ATK: stats.ATK,
          XATK: stats.ATK,

          DEF: stats.DEF,
          XDEF: stats.DEF,

          SPD: stats.SPD,
          XSPD: stats.SPD,

          IQ: stats.IQ,
          XIQ: stats.IQ
        }
      };

      await saveUser(newUser);

      api.setMessageReaction('✅', messageID);

      return api.sendMessage(
        `تم تسجيل ${name} بنجاح!  
الفئة: ${randomType}`,
        threadID,
        messageID
      );

    } catch (error) {
      log.error('Error in سجل command:' + error);
      api.sendMessage('⚠️ حدث خطأ غير متوقع.', event.threadID, event.messageID);
      api.sendMessage(`${error}`, config.editor, null, true);
    }
  }
};
