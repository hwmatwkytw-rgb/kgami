const {styleNum} = require('../tools')

const SEP = "⎔────────────⎔";
const BUTTERFLY = "🦋";

module.exports = {
  name: "ابتايم",
  type: ['up', 'اخري'],
  hide: true,
  otherName: ['uptime'],
  description: 'يعرض مدة تشغيل البوت',
  rank: 0,
  run: async (api, event) => {
    const uptimeInSeconds = process.uptime();
    
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
      
      let finalString = `${styleNum(dDisplay)}${styleNum(hDisplay)}${styleNum(mDisplay)}${styleNum(sDisplay)}`.trim();
      if (finalString.endsWith('،')) {
        finalString = finalString.slice(0, -1);
      }
      return finalString || 'فترة قصيرة جداً';
    }
    
    const readableUptime = secondsToDhms(uptimeInSeconds);

    // الرسالة المزخرفة بأسلوب إبلين الملكي
    const message = `${SEP}\n${BUTTERFLY} | حـالـة الـنـظـام\n${SEP}\n` +
                    `⌬ تـم تـشـغـيـل الـبـوت مـنـذ:\n` +
                    `✨ ${readableUptime}\n` +
                    `${SEP}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
