const { getUser } = require('../data/user');
const { styleNum } = require('../tools')
const log = require('../logger');

module.exports = {
  name: "محفظة",
  otherName: ["رصيدي", "رصيد", "قروشي"],
  rank: 0,
  cooldown: 0,
  run: async (api, event) => {
    const userID = event.senderID
    const user = await getUser(userID)
    if (!user) {
      api.sendMessage(` معندك حساب '-'`, event.threadID, event.messageID)
      return
    }
    if (user.money === 0) {
      api.setMessageReaction('0️⃣', event.messageID)
      api.sendMessage(`بنصحك بالسمبك، ما ممكن مفلس في الواقع والمواقع '-'`, event.threadID, event.messageID)
      return
    }
    api.sendMessage(`＿＿＿＿＿＿\n⊳رصيدك ${styleNum(user.money)} جنيه\n   ${styleNum(user.diamond)} جوهرة.    \n   ${styleNum(user.gold) || 0} جرام.`, event.threadID, event.messageID);
    
  }
};
