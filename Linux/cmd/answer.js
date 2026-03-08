const axios = require('axios');
const log = require('../logger')
module.exports = {
  name: "اجب",
  otherName: ['سؤال'],
  usageCount: 0,
  description: "يجيب على أسئلتك بنعم أو لا",
  usage: 'اجب السؤال',
  run: async (api, event, commands, args) => {
    try {
      
      const response = await axios.get('https://yesno.wtf/api');
      
      
      const answer = response.data.answer;
      const imageUrl = response.data.image;
      
      
      api.sendMessage({
        body: `${answer.toUpperCase()}`,
        attachment: await axios.get(imageUrl, { responseType: 'stream' }).then(res => res.data)
      }, event.threadID, event.messageID);
      
    } catch (error) {
      log.error('Error fetching from YesNo API:' + error);
      api.sendMessage('⚠️', event.threadID, event.messageID);
    }
  }
};
