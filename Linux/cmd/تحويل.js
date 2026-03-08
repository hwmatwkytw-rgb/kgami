const { getUser, updateUser } = require('../data/user');
const log = require('../logger'); 
const { styleText, styleNum } = require('../tools.js');
module.exports = {
  name: 'تحويل',
  otherName: ['بنكك', 'حول'],
  type: ['الاموال'],
  rank: 0,
  run: async (api, event, commands, args) => {
    try {
      const senderId = event.senderID;
      
      const money = parseInt(args[0]);

      const user = await getUser(senderId);
      if (!user) {
        return api.sendMessage(
           'اعمل حساب.',
          event.threadID,
          event.messageID
        );
      }

      // 1. فحص الرد وتحديد الهدف
      if (!event.messageReply || !event.messageReply.senderID) {
        return api.sendMessage(`رد علي زول يا باطل.`, event.threadID, event.messageID);
      }
      
      const personId = event.messageReply.senderID;
      
      // 2. منع التحويل الذاتي
      if (personId === senderId) {
          return api.sendMessage(`داير تحول لي نفسك ليه؟.`, event.threadID, event.messageID);
      }
      
      const person = await getUser(personId);
      if (!person) {
        return api.sendMessage(
          'دا كائن ساي، ما عندو حساب ',
          event.threadID,
          event.messageID
        );
      }
      
      // 3. فحص المبلغ ومنع التحويل السلبي/الصفر/غير الرقمي
      if (!money || isNaN(money) || money <= 0) {
        return api.sendMessage(
          'صيغة المبلغ غلط. لازم يكون رقم موجب اكبر من صفر.',
          event.threadID,
          event.messageID
        );
      }
      
      // 4. فحص الرصيد
      if (user.money < money) {
        return api.sendMessage(
          `قروشك كلها ${styleNum(user.money)}.`,
          event.threadID,
          event.messageID
        );
      }
      
      // 5. تنفيذ التحويل
      user.money -= money;
      person.money = (Number(person.money) || 0) + money; 

      // 6. ضمان تحديث قاعدة البيانات
      await updateUser(user.id, user);
      await updateUser(person.id, person);
      
      // 7. إرسال رسالة النجاح للمُرسِل فقط
      api.sendMessage(
        `⊳تم تحويل ${styleNum(money)} جنيه الي ${person.character.name}
        باقي ليك ${styleNum(user.money)} جنيه`,
        event.threadID,
        event.messageID
      );

      // تم إزالة رسالة التنبيه للطرف الآخر (personId)
      

    } catch (err) {
        // log.error('Error in بنكك command: ' + err); 
        api.sendMessage('حدث خطأ أثناء تنفيذ عملية التحويل.', event.threadID, event.messageID);
    }
  }
};

