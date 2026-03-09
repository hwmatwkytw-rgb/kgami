const { styleNum } = require('../tools');

const TOP = "⎓⎓⎓  🪻  𝚂𝙷𝙸𝙽𝙾𝙱𝚄  🪻  ⎓⎓⎓";
const SIDE = "  ⎎ ";
const BOTTOM = "⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓⎓";
const ICON = "㊙︎";

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

    // تطبيق نمط رحيق السم 2 مع الحفاظ على بنيتك
    const message = `${TOP}\n${SIDE}\n` +
                    `${SIDE} ${ICON} حـالـة الـنـظـام\n` +
                    `${SIDE}\n` +
                    `${SIDE} ⌬ تـم تـشـغـيـل الـبـوت مـنـذ:\n` +
                    `${SIDE} ✨ ${readableUptime}\n` +
                    `${SIDE}\n` +
                    `${BOTTOM}\n  𝜗𝜚 🦋`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
