const { getUser, deleteUser } = require('../data/user');
module.exports = {
  name: 'حذف_حسابي',
  type: ['البوت'],
  rank: 0,
  cooldown: 5,
  run: async (api, event) => {
    try {
      const user = await getUser(event.senderID)
      if (!user) return api.sendMessage('م عندك حساب اصلا', event.threadID, event.messageID)
      
      
      await deleteUser(event.senderID);
      
      api.sendMessage(`يلا برا`, event.threadID, event.messageID);
      
    } catch (error) {
      console.error('خطأ أثناء حذف الحساب:', error);
      api.sendMessage('حدث خطأ.', event.threadID, event.messageID);
    }
  }
}
