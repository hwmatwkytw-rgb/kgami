
const { getUser, updateUser, deleteUser, saveUser, getAllUsers } = require('../data/user');

module.exports = {
    name: 'فرمطة',
    otherName: ["delete_all"],
    rank: 2,
    hide: true,
    cooldown: 5,
    run: async (api, event, commands, args) => {
        try {
    if (!args[0]) return api.sendMessage('I need to args [0] to continos', event.threadID, event.messageID)
    const users = await getAllUsers();

    for (const user of users) {
      await deleteUser(user.id);
    }

    api.sendMessage(`⏤͟͟͞͞
   تم حذف ${users.length} مستخدم بنجاح`, event.threadID, event.messageID);

  } catch (error) {
    console.error('خطأ أثناء حذف المستخدمين:', error);
    api.sendMessage('حدث خطأ أثناء حذف المستخدمين.', event.threadID, event.messageID);
  }
    }
}
