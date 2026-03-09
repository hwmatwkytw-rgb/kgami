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
      
      // هنا خلينا styleNum للأرقام فقط عشان الكلام العربي يظهر
      let dDisplay = days > 0 ? `${styleNum(days)}${days === 1 ? " يوم" : " أيام"}، ` : "";
      let hDisplay = hours > 0 ? `${styleNum(hours)}${hours === 1 ? " ساعة" : " ساعات"}، ` : "";
      let mDisplay = minutes > 0 ? `${styleNum(minutes)}${minutes === 1 ? " دقيقة" : " دقائق"}، ` : "";
      let sDisplay = secs > 0 ? `${styleNum(secs)}${secs === 1 ? " ثانية" : " ثواني"}` : "أقل من ثانية";
      
      let finalString = `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`.trim();
      if (finalString.endsWith('،')) {
        finalString = finalString.slice(0, -1);
      }
      return finalString;
    }
    
    const readableUptime = secondsToDhms(uptimeInSeconds);

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
