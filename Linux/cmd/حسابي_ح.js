const { getUser, deleteUser } = require('../data/user');
const { styleText } = require('../tools');

module.exports = {
  name: 'حسابي_ح',
  otherName: ['حذف_حسابي', 'del_acc'],
  category: 'الألعاب', // إضافة القسم المطلوب
  rank: 0,
  cooldown: 5,
  run: async (api, event) => {
    try {
      const user = await getUser(event.senderID);
      
      if (!user) {
        return api.sendMessage('✾ ┇ ⚠ | يا زول إنت أصلاً ما عندك حساب عشان تحذفه!', event.threadID, event.messageID);
      }
      
      // تنفيذ عملية الحذف
      await deleteUser(event.senderID);
      
      const goodbyeMsg = `●────── ✾ ⌬ ✾ ──────●
✾ ┇
✾ ┇ ⏣ ⟬ ${styleText('ACCOUNT DELETED')} ⟭
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◤ تـم حـذف بـيـانـاتـك بـنـجـاح.
✾ ┇ ◤ يـلا بـرااا .. 
✾ ┇
●────── ✾ ⌬ ✾ ──────●`;

      api.sendMessage(goodbyeMsg, event.threadID, event.messageID);
      
    } catch (error) {
      console.error('خطأ أثناء حذف الحساب:', error);
      api.sendMessage('✾ ┇ حدث خطأ أثناء محاولة طردك من النظام.', event.threadID, event.messageID);
    }
  }
};
