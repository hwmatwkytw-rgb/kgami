const config = require('../config.json')
module.exports = {
	name: "dev",
	otherName: ['وضع_المطور'],
	rank: 1,
	hide: true,
        description: 'يقوم بتشغيل وضع التطوير اي لا يستطلع الاعضاء العاديين استعمال الأوامر',
	cooldowns: 0,
        run: async (api, event, commands, args) => {
         const value = config.developmentMode 
         if (!args[0]) return api.sendMessage(`palace choice [ on | off ] '-'`, event.threadID, event.messageID)
         switch (args[0]) {
    	   case 'on':
    	   case 'تشغيل':
    		config.developmentMode = true
    		api.sendMessage(`Development Mode Is On '-'`, event.threadID, event.messageID)
    		break;
    	  case 'off':
    	  case 'ايقاف':
				config.developmentMode = false
				api.sendMessage(`Development Mode Is Off '-'`, event.threadID, event.messageID)
    		break;
    	
    	  default:
			api.sendMessage(`palace choice [ on | off ] '-'`, event.threadID, event.messageID)
    }
  }
}
