const { getUser, updateUser } = require('../data/user')
const {styleNum} = require('../tools')
module.exports = {
  name: 'فكة',
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
    const diamond = parseInt(args[0])

    if (!diamond || isNaN(diamond)) {
      return api.sendMessage(
        `حدد مبلغ يا دنقل`,
        event.threadID,
        event.messageID
      )
    }

    if (user.diamond <= 0) {
      return api.sendMessage(
        `م تفضحنا انت معندك جواهر`,
        event.threadID,
        event.messageID
      )
    }

    if (diamond > user.diamond) {
      return api.sendMessage(
        `قروشك ناقصة
       راجع حساباتك`,
        event.threadID,
        event.messageID
      )
    }

    if (diamond < 1) {
      return api.sendMessage(
        `اقل مبلغ ممكن تحويله هو 1 جوهرة.`,
        event.threadID,
        event.messageID
      )
    }

    // نظام التحويل: كل 1 جوهرة = 100 جنيه
    const moneyToAdd = diamond * 100

    user.diamond -= diamond
    user.money += moneyToAdd
    await updateUser(user.id, user)

    api.sendMessage(
      `نجاح ✅️
      معاك حاليا ${styleNum(user.money)} جنيه.
      ${styleNum(user.diamond)} جوهرة.`,
      event.threadID,
      event.messageID
    )
  }
}
