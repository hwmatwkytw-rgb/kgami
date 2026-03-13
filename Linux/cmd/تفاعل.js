const config = require('../config.json')
module.exports = {
	name: "تفاعل",
	rank: 1,
   	hide: true,
	cooldowns: 0,
  run: async (api, event) => {
    const value = !config.REACT
    config.REACT = value
	  if (value) {
	    api.sendMessage('𝒅𝒏', event.threadID, event.messageID)
	  } else if (!value) {
	    api.sendMessage('𝒅𝒏 ', event.threadID, event.messageID)
	  } 
  }
}
