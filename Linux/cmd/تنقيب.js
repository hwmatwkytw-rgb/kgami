const { getUser, updateUser } = require('../data/user');
const { styleNum } = require('../tools')
module.exports = {
  name: 'تنقيب',
  otherName: ['dig', 'بحث'],
  rank: 0,
  type: ['الاموال'],
  run: async (api, event) => {
    try {
      const user = await getUser(event.senderID);

      if (!user || !user.character) {
        return api.sendMessage(
          'ما عندك شخصية. استخدم "تسجيل" أولاً.',
          event.threadID,
          event.messageID
        );
      }

      /* ===============================
         تهيئة القيم
      =============================== */
      if (!user.status) user.status = {};
      if (typeof user.money !== 'number') user.money = 0;
      if (typeof user.diamond !== 'number') user.diamond = 0;
      if (typeof user.gold !== 'number') user.gold = 0;

      /* ===============================
         في حال وجود تنقيب جاري
      =============================== */
      if (user.status.isDigging && user.status.diggingUntil) {
        const remainingMs = user.status.diggingUntil - Date.now();

        if (remainingMs > 0) {
          const totalSeconds = Math.floor(remainingMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          let timeMsg = 'الوقت المتبقي:\n';
          if (hours > 0) timeMsg += `${styleNum(hours)} ساعة\n`;
          if (minutes > 0) timeMsg += `${styleNum(minutes)} دقيقة\n`;
          timeMsg += `${styleNum(seconds)} ثانية`;

          return api.sendMessage(
            timeMsg,
            event.threadID,
            event.messageID
          );
        }

        /* ===============================
           الحصاد
        =============================== */
        let profitMoney = user.status.digMoney || 0;
        let profitCrystal = user.status.digCrystal || 0;
        let bonusGold = 0;
        let bonusMsg = '';

        const bonusChance = 0.40;

        if (Math.random() < bonusChance) {
          const bonusRatio = 0.10 + Math.random() * 0.40;
          const bonusMoney = Math.floor(profitMoney * bonusRatio);
          const bonusCrystal = Math.floor(profitCrystal * bonusRatio);

          bonusGold = Math.floor(Math.random() * 10) + 10;

          profitMoney += bonusMoney;
          profitCrystal += bonusCrystal;

          //bonusMsg = '\nمكافأة إضافية حصلت عليها.';
        }

        user.money += profitMoney;
        user.diamond += profitCrystal;
        user.gold += bonusGold;

        user.status.isDigging = false;
        user.status.diggingUntil = null;
        user.status.digMoney = 0;
        user.status.digCrystal = 0;

        await updateUser(user.id, user);

        //let resultMsg = 'تم الانتهاء من التنقيب.\n';
        let resultMsg = '＿＿＿\nحصادك:\n';
        resultMsg += `+${styleNum(profitMoney)} جنيه\n`;
        resultMsg += `+${styleNum(profitCrystal)} جوهرة\n`;
        if (bonusGold > 0) resultMsg += `+${styleNum(bonusGold)} جرام ذهب\n`;
        resultMsg += bonusMsg;

        return api.sendMessage(
          resultMsg,
          event.threadID,
          event.messageID
        );
      }

      /* ===============================
         بدء تنقيب جديد
      =============================== */
      const durationMinutes = 10;

      const profitRanges = {
        money: [2000, 5000],
        crystal: [30, 150]
      };

      const expectedMoney =
        Math.floor(Math.random() * (profitRanges.money[1] - profitRanges.money[0] + 1)) +
        profitRanges.money[0];

      const expectedCrystal =
        Math.floor(Math.random() * (profitRanges.crystal[1] - profitRanges.crystal[0] + 1)) +
        profitRanges.crystal[0];

      const finishTime = Date.now() + durationMinutes * 60000;

      user.status.isDigging = true;
      user.status.diggingUntil = finishTime;
      user.status.digMoney = expectedMoney;
      user.status.digCrystal = expectedCrystal;

      await updateUser(user.id, user);

      const finishTimeStr = new Date(finishTime).toLocaleTimeString(
        'en-US',
        { hour: '2-digit', minute: '2-digit' }
      );

      let startMsg = '＿＿＿＿＿\nتم بدء التنقيب.\n';
      startMsg += `المدة: ${styleNum(durationMinutes)} دقائق\n`;
      startMsg += `موعد الانتهاء: ${styleNum(finishTimeStr)}`;

      return api.sendMessage(
        startMsg,
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error('Error in تنقيب command:', err);
      return api.sendMessage(
        'حدث خطأ أثناء تنفيذ أمر التنقيب.',
        event.threadID,
        event.messageID
      );
    }
  }
};
