const { getUser } = require('../data/user');
const { styleNum, styleText } = require('../tools');
const log = require('../logger');

module.exports = {
  name: "محفظة",
  otherName: ["رصيدي", "رصيد", "قروشي"],
  category: "الألعاب", // إضافة الفئة المطلوبة
  rank: 0,
  cooldown: 0,
  run: async (api, event) => {
    const userID = event.senderID;
    const user = await getUser(userID);

    if (!user) {
      return api.sendMessage(`✾ ┇ ⚠️ | سـجل أولاً يا بـطل.`, event.threadID, event.messageID);
    }

    if (user.money === 0 && user.diamond === 0) {
      api.setMessageReaction('0️⃣', event.messageID);
      return api.sendMessage(`✾ ┇ وهيهي انت فقر .. ما عندك ولا مليم!`, event.threadID, event.messageID);
    }

    const walletMsg = `⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇
✾ ┇ ⦿ ⟬ ${styleText('MY WALLET')} ⟭
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◤ 💰 الـكـاش : ${styleNum(user.money)} جـنيه.
✾ ┇ ◤ 💎 الـجـواهر : ${styleNum(user.diamond)} جـوهرة.
✾ ┇ ◤ 🪨 الـذهـب : ${styleNum(user.gold) || 0} جـرام.
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣`;

    api.sendMessage(walletMsg, event.threadID, event.messageID);
  }
};
