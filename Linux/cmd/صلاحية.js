// cmd/صلاحية.js
module.exports = {
  name: 'صلاحية',
  otherName: ['setperm', 'تعيينصلاحية', 'rank', 'رانك'],
  usageCount: 0,
  hide: true,
  cooldown: 3,
  rank: 2, 
  run: async (api, event, commands) => {
    try {
       
      const parts = event.body.trim().split(/\s+/).slice(1); // بعد كلمة صلاحية
      const action = (parts[0] || '').toLowerCase();

      if (!action || !['set', 'show'].includes(action)) {
        return api.sendMessage(
          'الصيغة: صلاحية set <اسم_الأمر> <0|1|2>\nأو: صلاحية show <اسم_الأمر>',
          event.threadID,
          event.messageID
        );
      }

      const cmdName = parts[1];
      if (!cmdName) {
        return api.sendMessage(`ما تبقي نجاو حدد اسم الامر '-'`, event.threadID, event.messageID);
      }

      // البحث عن الأمر في المصفوفة (name أو otherName)
      const cmd = commands.find(c => {
        if (!c) return false;
        if (typeof c.name === 'string' && c.name.toLowerCase() === cmdName.toLowerCase()) return true;
        if (Array.isArray(c.otherName) && c.otherName.map(x => x.toLowerCase()).includes(cmdName.toLowerCase())) return true;
        return false;
      });

      if (!cmd) {
        return api.sendMessage(` لم أجد أمر باسم "${cmdName}". تأكد من الاسم.`, event.threadID, event.messageID);
      }

      if (action === 'show') {
        const current = (typeof cmd.rank !== 'undefined') ? cmd.rank : 'غير محدد';
        return api.sendMessage(`🔍 رتبة الأمر "${cmd.name}" حالياً: ${current}`, event.threadID, event.messageID);
      }

      // action === 'set'
      const newRankStr = parts[2];
      const newRank = parseInt(newRankStr, 10);
      if (isNaN(newRank) || ![0,1,2].includes(newRank)) {
        return api.sendMessage(' رتبة غير صحيحة. استخدم 0 أو 1 أو 2.', event.threadID, event.messageID);
      }

      const oldRank = (typeof cmd.rank !== 'undefined') ? cmd.rank : 'غير محدد';
      cmd.rank = newRank; // يتغير فقط في الذاكرة

      return api.sendMessage(
        `غيرت رتبة الامر"${cmd.name}" من (${oldRank}) إلى (${newRank}).`,
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ أثناء تنفيذ أمر صلاحية.', event.threadID, event.messageID);
    }
  }
};
