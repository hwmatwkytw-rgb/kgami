const { getUser } = require('../data/user');

// دالة تنسيق النص (تم تحديثها لتعطي مظهراً فخماً)
const styleText = (text) => {
    const map = {
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
        'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
        'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯',
        '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
    };
    return text.split('').map(char => map[char] || char).join('');
};

const LINE = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";

module.exports = {
  name: 'خبرتي',
  otherName: ['خبرات', 'skills'],
  rank: 0,
  cooldown: 3,
  run: async (api, event) => {
    const senderId = event.senderID;
    const commandParts = event.body.trim().split(/\s+/);
    let pageNumber = 1;

    if (commandParts.length > 1) {
        const potentialPage = parseInt(commandParts[1]);
        if (!isNaN(potentialPage) && potentialPage > 0) pageNumber = potentialPage;
    }
    
    const user = await getUser(senderId);
    
    if (!user || !user.character) {
      return api.sendMessage(
        `🦋 | أوه؟ يبدو أنكِ لستِ مسجلة في سجلات الفيلق بعد.`,
        event.threadID, event.messageID
      );
    }
    
    const skills = user.character?.skills || [];
    
    if (skills.length === 0) {
      return api.sendMessage(
        `🦋 | نصلكِ فارغ حالياً.. لا توجد فنون تنفس مكتسبة.`,
        event.threadID, event.messageID
      );
    }
    
    const skillsPerPage = 4;
    const totalPages = Math.ceil(skills.length / skillsPerPage);

    if (pageNumber > totalPages) {
        return api.sendMessage(
            `🦋 | لا توجد صفحات خلف هذا الحد، أقصى صفحة هي ${styleText(totalPages.toString())}.`,
            event.threadID, event.messageID
        );
    }

    const startIndex = (pageNumber - 1) * skillsPerPage;
    const skillsToShow = skills.slice(startIndex, startIndex + skillsPerPage);
    
    let skillMsg = `${LINE}\n   亗 كـتـاب الـمـهـارات الـمـلـكـي 亗\n${LINE}\n`;
    
    skillsToShow.forEach((sk, index) => {
      const globalIndex = startIndex + index + 1;
      const dmgMin = sk.dmg?.min ?? 0;
      const dmgMax = sk.dmg?.max ?? 0;
      const desc = sk.description || sk.discretion || 'لا يوجد وصف للفن';
      
      let limitDisplay;
      if (sk.limitUse === undefined || sk.limitUse === 0) {
        limitDisplay = '𝖨𝗇𝖿𝗂𝗇𝗂𝗍𝖾 (لانهائي)';
      } else {
        limitDisplay = styleText(sk.limitUse.toString());
      }

      skillMsg += `🦋 ⊱ ${styleText(globalIndex.toString())}. [ ${styleText(sk.name)} ]\n`;
      skillMsg += ` ⊳ القوة: ${styleText(dmgMin.toString())} ⚡︎ ${styleText(dmgMax.toString())}\n`;
      skillMsg += ` ⊳ الجرعات المتبقية: ${limitDisplay}\n`;
      skillMsg += ` ⊳ الأثر: ${desc}\n`;
      skillMsg += `──────────────\n`;
    }); 
    
    const footer = `✿ الصفحة [ ${styleText(pageNumber.toString())} ] من [ ${styleText(totalPages.toString())} ] ✿`;

    api.sendMessage(
      `${skillMsg}\n${footer}\n${LINE}`,
      event.threadID,
      event.messageID
    );
  }
};
