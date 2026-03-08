const config = require('../config.json')
module.exports = {
	name: "رياكت",
	rank: 1,
   	hide: true,
	cooldowns: 0,
  run: async (api, event) => {
    const value = !config.REACT
    config.REACT = value
	  if (value) {
	    api.sendMessage('تم تشغيل التفاعل مع الرسائل', event.threadID, event.messageID)
	  } else if (!value) {
	    api.sendMessage('تم ايقاف التفاعل مع الرسائل', event.threadID, event.messageID)
	  } 
  }
}
