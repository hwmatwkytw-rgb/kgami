const { getUser } = require('../data/user');
const { styleText, styleNum } = require('../tools.js');
const axios = require('axios');

module.exports = {
  name: 'شخصيتي',
  otherName: ['me', 'مي'],
  rank: 0,
  type: ['الالعاب'],
  cooldown: 3,
  usageCount: 0,
  prefix: true,
  description: 'اعرف تفاصيل شخصيتك',
  run: async (api, event) => {
    try {
      const senderId = event.senderID;
      const threadID = event.threadID;
      const messageID = event.messageID;

      // ثابت لقيمة غير متوفرة
      const n = styleText('nan');

      /**
       * تنسيق رسالة حالة الشخصية
       */
      const buildStatusMessage = (char) => {
        const c = char || {};
        const LINE = '';
        const cuma = '〣';

        let message = `
${LINE}
${styleText('name')}: ${c.name || n}
${styleText('lvl')}: ${styleNum(c.level) || n}
${styleText('type')}: ${c.type || n}
${styleText('rating')}: ${styleNum(c.rating) || 0} 
${LINE}
${styleText('hp')}:    ${styleNum(c.HP) || 0} ${cuma} ${styleNum(c.XHP) || n}
${styleText('atk')}:   ${styleNum(c.ATK) || 0} ${cuma} ${styleNum(c.XATK) || n}
${styleText('def')}:   ${styleNum(c.DEF) || 0} ${cuma} ${styleNum(c.XDEF) || n}
${styleText('spd')}:   ${styleNum(c.SPD) || 0} ${cuma} ${styleNum(c.XSPD) || n}
${styleText('iq')}:    ${styleNum(c.IQ) || 0} ${cuma} ${styleNum(c.XIQ) || n}
${LINE}
`;

        const bars = Array.isArray(c.bar) ? c.bar : [];
        if (bars.length > 0) {
          message += `${styleText('bar')}:    ${bars.join(' | ')}\n`;
          message += LINE;
        } else {
          message += LINE;
        }

        return message;
      };

      /**
       * إرسال الرسالة مع صورة إذا كانت موجودة
       */
      const sendWithImage = async (char, text) => {
        if (char?.img) {
          try {
            const res = await axios.get(char.img, {
              responseType: "stream",
              timeout: 15000,
              headers: { "User-Agent": "Mozilla/5.0" }
            });

            const type = res.headers["content-type"];
            if (type && type.includes("image")) {
              return api.sendMessage(
                {
                  body: text,
                  attachment: res.data
                },
                threadID,
                messageID
              );
            }
          } catch (e) {}
        }

        return api.sendMessage(text, threadID, messageID);
      };

      // ---------------------- الرد على مستخدم آخر ----------------------
      if (event.messageReply && event.messageReply.senderID) {
        const targetId = event.messageReply.senderID;
        const target = await getUser(targetId);

        if (!target) {
          return api.sendMessage(
            'هذا المستخدم ليس لديه حساب مسجل.',
            threadID,
            messageID
          );
        }

        const messageT = buildStatusMessage(target.character);
        return sendWithImage(target.character, messageT);
      }

      // ---------------------- بيانات صاحب الأمر ----------------------
      const user = await getUser(senderId);

      if (!user) {
        return api.sendMessage(
          'أنت لا تمتلك حساباً ! استخدم الأمر تسجيل لإنشاء حساب.',
          threadID,
          messageID
        );
      }

      const message = buildStatusMessage(user.character);
      return sendWithImage(user.character, message);

    } catch (error) {
      console.error('Error in شخصيتي command:', error);
      api.sendMessage(
        '⚠️ حدث خطأ غير متوقع.',
        event.threadID,
        event.messageID
      );
    }
  }
};
