const { getUser, updateUser } = require('../data/user')
const { styleText, styleNum } = require('../tools.js');
module.exports = {
  name: 'بدل',
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
    const money = parseInt(args[0])
    
    if (!money || isNaN(money)) {
      return api.sendMessage(
        `حدد مبلغ يا دنقل`,
        event.threadID,
        event.messageID
      )
    }
    
    if (user.money <= 0) {
      return api.sendMessage(
        `م تفضحنا انت قروش معندك `,
       event.threadID,
        event.messageID
      )
    }
    
    if (money > user.money) {
      return api.sendMessage(
        `قروشك ناقصة
       راجع حساباتك`,
        event.threadID,
        event.messageID
      )
    }
    
    if (money < 150) {
      return api.sendMessage(
        `اقل مبلغ ممكن تحويله هو ${styleNum(150)} جنيه.`,
        event.threadID,
        event.messageID
      )
    }
    
    // نظام التحويل: كل 100 جنيه = 1 كرستالة
    const crystalsToAdd = Math.floor(money / 150)
    const usedMoney = crystalsToAdd * 150
    
    if (crystalsToAdd <= 0) {
      return api.sendMessage(
        `مافي جواهر تتحول بي المبلغ دا️.`,
        event.threadID,
        event.messageID
      )
    }
    
    user.money -= usedMoney
    user.diamond += crystalsToAdd
    await updateUser(user.id, user)
    
    api.sendMessage(
      `نجاح 
      معاك حاليا ${styleNum(user.money)} جنيه.
      ${styleNum(user.diamond)} جوهرة.`,
      event.threadID,
      event.messageID
    )
  }
}
