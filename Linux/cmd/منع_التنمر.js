const config = require('../config.json')
module.exports = {
  name: "منع_التنمر",
  rank: 1,
  description: 'يقوم بتشغيل وضع منع التنمر اي لا يستطيع الاقوياء مهاجمة الضعفاء',
  cooldowns: 0,
  run: async (api, event, commands, args) => {
    const value = config.ATTACKD
    if (!args[0]) return api.sendMessage(`palace choice [ on | off ] '-'`, event.threadID, event.messageID)
    switch (args[0]) {
      case 'on':
      case 'تشغيل':
        config.ATTACKD = true
        api.sendMessage(`وضع منع التنمر يعمل '-'`, event.threadID, event.messageID)
        break;
      case 'off':
      case 'ايقاف':
        config.ATTACKD = false
        api.sendMessage(`وضع منع التنمر مغلق '-'`, event.threadID, event.messageID)
        break;
        
      default:
        api.sendMessage(`palace choice [ on | off ] '-'`, event.threadID, event.messageID)
    }
  }
}
