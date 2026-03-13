const os = require('os');
const { styleNum } = require('../tools');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const ICON = "✾";

module.exports = {
  name: "ابتايم",
  type: ['up', 'اخري'],
  category: "النظام",
  otherName: ['uptime'],
  description: 'يعرض مدة تشغيل البوت وحالة النظام',
  rank: 0,
  run: async (api, event) => {
    const uptimeInSeconds = process.uptime();
    
    // الحفاظ على دالتك الأصلية لتحويل الوقت
    const secondsToDhms = (seconds) => {
      seconds = Number(seconds);
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      let dDisplay = days > 0 ? days + (days === 1 ? " يوم، " : " أيام، ") : "";
      let hDisplay = hours > 0 ? hours + (hours === 1 ? " ساعة، " : " ساعات، ") : "";
      let mDisplay = minutes > 0 ? minutes + (minutes === 1 ? " دقيقة، " : " دقيقة، ") : "";
      let sDisplay = secs > 0 ? secs + (secs === 1 ? " ثانية" : " ثانية") : "أقل من ثانية";
      
      return `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`.trim();
    }
    
    const readableUptime = secondsToDhms(uptimeInSeconds);

    // حساب البيانات الإضافية (رام، مجموعات، سرعة)
    const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedRam = (totalRam - freeRam).toFixed(2);
    
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    const groupsCount = threadList.filter(thread => thread.isGroup).length;
    
    const ping = Date.now() - event.timestamp; 

    // بناء الرسالة بنفس ستايلك مع الزقرة الجديدة
    const message = 
      `${SEP}\n` +
      `${ICON} ┇ حـالـة الـنـظـام 💡\n` +
      `${SEP}\n` +
      `✾ ┇ مـنـذ: ${styleNum(readableUptime)}\n` +
      `✾ ┇ الـرام: ${styleNum(usedRam)}GB / ${styleNum(totalRam)}GB\n` +
      `✾ ┇ الـمجموعات: ${styleNum(groupsCount)}\n` +
      `✾ ┇ الـسرعة: ${styleNum(Math.abs(ping))}ms\n` +
      `✾ ┇ الـنظام: ${os.platform()}\n` +
      `${SEP}\n` +
      ` " `;
    
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
