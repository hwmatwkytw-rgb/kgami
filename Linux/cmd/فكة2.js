const { getUser, updateUser } = require('../data/user')
const { styleNum } = require('../tools')
module.exports = {
  name: 'صمة',
    type: ['الاموال'],
  rank: 0,
  run: async (api, event) => {
    const user = await getUser(event.senderID)
    if (!user) {
      return api.sendMessage(
        `ليس لديك حساب`,
        event.threadID,
        event.messageID
      )
    }
    
    const args = event.body.split(' ').slice(1);
    const gold = parseInt(args[0])
    
    if (!gold || isNaN(gold)) {
      return api.sendMessage(
        `حدد مبلغ يا دنقل`,
        event.threadID,
        event.messageID
      )
    }
    
    if (user.gold <= 0) {
      return api.sendMessage(
        `م تفضحنا انت معندك شي`,
        event.threadID,
        event.messageID
      )
    }
    
    if (gold > user.gold) {
      return api.sendMessage(
        `انت فاكرني دنقل ولا شنو\n دهبك ${styleNum(user.gold)} جرام`,
        event.threadID,
        event.messageID
      )
    }
    
    if (gold < 1) {
      return api.sendMessage(
        `اقل مبلغ ممكن تحويله هو 1 جرام`,
        event.threadID,
        event.messageID
      )
    }
    
    // نظام التحويل: كل 1 جوهرة = 100 جنيه
    const moneyToAdd = gold * 300
    
    user.gold -= gold
    user.money += moneyToAdd
    await updateUser(user.id, user)
    
    api.sendMessage(
      `نجاح ✅️
      معاك حاليا ${styleNum(user.money)} جنيه.
      ${styleNum(user.gold)} جرام.`,
      event.threadID,
      event.messageID
    )
  }
}
