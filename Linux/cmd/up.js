const {styleNum} = require('../tools')
module.exports = {
  name: "ابتايم",
  type: ['النظام', 'اخري'],
  hide: true,
  otherName: ['uptime'],
  description: 'يعرض مدة تشغيل البوت',
  rank: 0,
  run: async (api, event) => {
    // الحصول على مدة التشغيل بالثواني من عملية Node.js الحالية
    const uptimeInSeconds = process.uptime();
    
    // دوال المساعدة للتحويل من الثواني إلى تنسيق سهل القراءة
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
      
      // إزالة الفاصلة الأخيرة إذا كانت موجودة
      let finalString = `${styleNum(dDisplay)}${styleNum(hDisplay)}${styleNum(mDisplay)}${styleNum(sDisplay)}`.trim();
      if (finalString.endsWith('،')) {
        finalString = finalString.slice(0, -1);
      }
      return finalString || 'فترة قصيرة جداً';
    }
    
    const readableUptime = secondsToDhms(uptimeInSeconds);
    // إرسال الرسالة
    const message = `⊳ ${readableUptime}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
