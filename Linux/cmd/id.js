module.exports = {
  name: 'ايدي',
  otherName: ['id'],
  type: ['معلومات'],
  hide: true,
  rank: 0,
  cooldown: 0,
  run: (api, event) => {
    
    if (event.messageReply) {
      const repliedUserId = event.messageReply.senderID;
      return api.sendMessage(`${repliedUserId}`, event.threadID, event.messageID);
    } else {
      
      const senderId = event.senderID;
      api.sendMessage(senderId, event.threadID, event.messageID);
    }
  }
};
