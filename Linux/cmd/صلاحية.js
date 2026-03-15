// cmd/صلاحية.js
const { styleText, styleNum } = require('../tools');

module.exports = {
  name: 'صلاحية',
  otherName: ['setperm', 'تعيين_صلاحية', 'rank', 'رانك'],
  category: "المطور", // تمت الإضافة لفئة المطور
  hide: true,
  cooldown: 3,
  rank: 2, 
  run: async (api, event, commands) => {
    try {
      const { threadID, messageID } = event;
      const parts = event.body.trim().split(/\s+/).slice(1);
      const action = (parts[0] || '').toLowerCase();

      if (!action || !['set', 'show'].includes(action)) {
        return api.sendMessage(
          `✾ ┇ الـصـيغـة:\n✾ ┇ 1- صلاحية set [الأمر] [0|1|2]\n✾ ┇ 2- صلاحية show [الأمر]`,
          threadID, messageID
        );
      }

      const cmdName = parts[1];
      if (!cmdName) {
        return api.sendMessage(`✾ ┇ مـا تـبقى نـجاو.. حـدد اسـم الأمـر '-'`, threadID, messageID);
      }

      const cmd = commands.find(c => {
        if (!c) return false;
        if (typeof c.name === 'string' && c.name.toLowerCase() === cmdName.toLowerCase()) return true;
        if (Array.isArray(c.otherName) && c.otherName.map(x => x.toLowerCase()).includes(cmdName.toLowerCase())) return true;
        return false;
      });

      if (!cmd) {
        return api.sendMessage(`✾ ┇ لـم أجـد أمـر بـاسم "${cmdName}". تـأكد مـن الاسـم.`, threadID, messageID);
      }

      if (action === 'show') {
        const current = (typeof cmd.rank !== 'undefined') ? cmd.rank : 'غير محدد';
        return api.sendMessage(`✾ ┇ 🔍 رتـبة الأمـر "${cmd.name}" حـالـياً هـي: ${styleNum(current)}`, threadID, messageID);
      }

      // عمل تغيير الرتبة (set)
      const newRankStr = parts[2];
      const newRank = parseInt(newRankStr, 10);
      if (isNaN(newRank) || ![0, 1, 2].includes(newRank)) {
        return api.sendMessage('✾ ┇ رتـبة غـير صـحيحة. اسـتخدم 0 أو 1 أو 2.', threadID, messageID);
      }

      const oldRank = (typeof cmd.rank !== 'undefined') ? cmd.rank : 'غير محدد';
      cmd.rank = newRank; // التغيير يتم في الذاكرة (Runtime)

      const response = `●────── ✾ ⌬ ✾ ──────●\n✾ ┇ ⦿ ⟬ تـحـديـث الـصلاحـيـات ⟭\n✾ ┇\n✾ ┇ ◤ الأمـر: ${cmd.name}\n✾ ┇ ◤ مـن: (${styleNum(oldRank)})\n✾ ┇ ◤ إلـى: (${styleNum(newRank)})\n✾ ┇\n●────── ✾ ⌬ ✾ ──────●`;

      return api.sendMessage(response, threadID, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('✾ ┇ ❌ حـدث خطأ أثـناء تـنفيذ أمـر صـلاحـية.', event.threadID, event.messageID);
    }
  }
};
