const { getUser } = require('../data/user');

// دالة مساعدة لتحويل النص العادي إلى خط مزخرف (للحفاظ على أسلوبك)
const styleText = (text) => {
    // تم تحديث الخريطة لضمان تغطية الحروف العربية بشكل سليم إذا لزم الأمر
    const map = {
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
        'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
        'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯',
        ' ': ' ', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0', ':': ':', '-': '-', ',': ',',
        '.': '.', '(': '(', ')': ')', '/': '/'
    };
    return text.split('').map(char => map[char] || char).join('');
};

module.exports = {
  name: 'مهاراتي',
  otherName: ['مهارات'],
  rank: 0,
  info: 'يعرض مهاراتك الخاصة مع نظام ترقيم الصفحات.',
  usage: 'مهاراتي [رقم الصفحة]', 
  usageCount: 0,
  cooldown: 3,
  run: async (api, event) => {
    const senderId = event.senderID;
    
    // تحليل الأمر لاستخراج رقم الصفحة
    const commandParts = event.body.trim().split(/\s+/);
    let pageNumber = 1;

    if (commandParts.length > 1) {
        const potentialPage = parseInt(commandParts[1]);
        if (!isNaN(potentialPage) && potentialPage > 0) {
            pageNumber = potentialPage;
        }
    }
    
    const user = await getUser(senderId);
    
    if (!user || !user.character) {
      return api.sendMessage(
        styleText(`𝙇𝙞𝙨𝙩 𝙉𝙤 𝘼𝙘𝙘𝙤𝙪𝙣𝙩. ليس لديك حساب.`),
        event.threadID,
        event.messageID
      );
    }
    
    // تأكد من تهيئة المهارات لتجنب الأخطاء
    const skills = user.character?.skills || [];
    
    if (skills.length === 0) {
      return api.sendMessage(
        styleText(`⊳ معندك مهارات حاليا، اكسب بعض المهارات!`),
        event.threadID,
        event.messageID
      );
    }
    
    const skillsPerPage = 4;
    const totalSkills = skills.length;
    const totalPages = Math.ceil(totalSkills / skillsPerPage);

    // التحقق من صلاحية رقم الصفحة
    if (pageNumber > totalPages) {
        return api.sendMessage(
            styleText(`⊳ أقصى عدد للصفحات هو ${totalPages}.`),
            event.threadID,
            event.messageID
        );
    }

    // حساب بداية ونهاية القائمة للصفحة المطلوبة
    const startIndex = (pageNumber - 1) * skillsPerPage;
    const endIndex = startIndex + skillsPerPage;
    const skillsToShow = skills.slice(startIndex, endIndex);
    
    let skillDetails = '';
    
    // عرض المهارات
    skillsToShow.forEach((sk, index) => {
      const globalIndex = startIndex + index + 1;
      const dmgMin = sk.dmg?.min ?? 0;
      const dmgMax = sk.dmg?.max ?? 0;
      const desc = sk.description || sk.discretion || '𝙉𝙤 𝘿𝙚𝙨𝙘𝙧𝙞𝙥𝙩𝙞𝙤𝙣';
      const eff = sk.effect || '𝙉𝙤 𝙀𝙛𝙛𝙚𝙘𝙩';
      const type = sk.type || '𝙀𝙛𝙛𝙚𝙘𝙩';

      // حساب عدد الاستخدامات المتبقية
      let limitDisplay;
      if (sk.limitUse === undefined || sk.limitUse === 0) {
        limitDisplay = '𝙄𝙣𝙛𝙞𝙣𝙞𝙩𝙚'
      } else {
        const usedCount = sk.usedCount || 0;
        const remaining = sk.limitUse - usedCount;
        limitDisplay = remaining > 0 ? remaining : '𝙀𝙭𝙝𝙖𝙪𝙨𝙩𝙚𝙙';
      }
      

      skillDetails += ` ⊳${globalIndex}. ${styleText(sk.name)}\n`;
      skillDetails += ` الضرر: ${dmgMin} ⚡︎ ${dmgMax}\n`;
      skillDetails += ` حد الاستخدام: ${limitDisplay}\n`;
      skillDetails += ` تفاصيل: ${styleText(desc)}\n`;
      skillDetails += `──────────\n`;
    }); 
    
    const footer = styleText(`الصفحة ${pageNumber} من ${totalPages}.`);

    api.sendMessage(
      styleText(`${skillDetails}\n${footer}`),
      event.threadID,
      event.messageID
    );
  }
};

