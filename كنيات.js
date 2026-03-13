// cmd/nickname.js
const config = require('../config.json');
const log = require('../logger');

const BERLIN_PREFIX = '';

// دالة مساعدة لإنشاء تأخير (700 ملي ثانية بين كل تغيير كنية)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// دالة تحويل الأسماء إلى العربية (أكثر دقة)
function toArabicName(name) {
  if (!name) return "";
  let text = name.toLowerCase();
  const complexMap = {
    'th': 'ث', 'sh': 'ش', 'ch': 'تْش', 'ph': 'ف', 'gh': 'غ', 
    'oo': 'و', 'ee': 'ي', 'ay': 'ي', 'ie': 'ي', 'ue': 'و', 'qu': 'كْو',
    'ce': 'س', 'ci': 'س', 'cy': 'س', 'ge': 'ج', 'gi': 'ج', 'gy': 'ج',
  };
  for (const [key, value] of Object.entries(complexMap)) {
    text = text.replace(new RegExp(key, 'g'), value);
  }
  const simpleMap = {
    'a': 'ا', 'e': 'ي', 'i': 'ي', 'o': 'و', 'u': 'و', 'y': 'ي', 
    'b': 'ب', 'c': 'ك', 'd': 'د', 'f': 'ف', 'g': 'ج', 'h': 'هـ',
    'j': 'ج', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'p': 'ب',
    'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت', 'v': 'ف', 'w': 'و',
    'x': 'كس', 'z': 'ز', ' ': ' ', '-': '-',
  };
  return text.split("").map(c => simpleMap[c] || c).join("");
}

// دالة لإضافة رمز الجنس حسب البيانات
function getGenderEmoji(gender) {
  if (!gender) return "";
  const g = gender.toLowerCase();
  if (g === "male") return "🚹";
  if (g === "female") return "🚺";
  if (g === "no specific gender" || g === "other") return "🚻";
  return "";
}

module.exports = {
  name: 'كنيات',
  otherName: ['جكوار', 'واندا'],
  rank: 2, // للمطور فقط
  cooldown: 5,
  hide: true, // مخفي من القائمة
  type: ['المجموعة'],  
  run: async (api, event) => {
    const { threadID, messageID, body } = event;
    const args = body.trim().split(" ").slice(1);
    
    if (args.length === 0) {
      return api.sendMessage(
        `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ الـصـيـغـة:\n✾ ┇ كنية bot\n✾ ┇ كنية عام <القالب>\n●───── ✾ ⌬ ✾ ─────●`,
        threadID, messageID
      );
    }
    
    // ======================================
    // تغيير كنية البوت
    // ======================================
    if (args[0] === "bot") {
      const newNickname = config?.name;
      if (!newNickname) return api.sendMessage(`✾ ┇ لا توجد قيمة name داخل config.json.`, threadID, messageID);
      
      try {
        const botID = await api.getCurrentUserID();
        await api.nickname(newNickname, threadID, botID);
        // التفاعل بدل الرسالة
        return api.setMessageReaction("✨", messageID, () => {}, true);
      } catch (err) {
        log?.error("BOT Nickname Error:", err);
        return api.sendMessage(`✾ ┇ فشل تغيير كنية البوت.`, threadID, messageID);
      }
    }
    
    // ======================================
    // gc لتغيير كنيات أعضاء المجموعة
    // ======================================
    if (args[0] === "gc" || args[0] === "عام") {
      const template = args.slice(1).join(" ");
      if (!template || !template.includes("الاسم")) {
        return api.sendMessage(`✾ ┇ يجب أن يحتوي القالب على كلمة (الاسم).`, threadID, messageID);
      }
      
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.userInfo || [];
        const botID = await api.getCurrentUserID();
        
        // التفاعل بدل الرسالة البدائية
        api.setMessageReaction("🧭", messageID, () => {}, true);
        
        for (const member of members) {
          const userID = member.id;
          if (userID === botID) continue; 
          
          const fullName = member.name || member.firstName || "User";
          const firstName = toArabicName(fullName.split(" ")[0]);
          const genderEmoji = getGenderEmoji(member.gender);
          
          const finalNickname = template
            .replace(/الاسم/g, firstName)
            .replace(/الجنس/g, genderEmoji);
          
          try {
            await api.nickname(finalNickname, threadID, userID);
            await sleep(700); 
          } catch (e) { log?.error("Member Nickname Error:", e); }
        }
        
        return api.sendMessage(
          `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ تـم تـطـبـيـق الـكـنـيـات بـنـجـاح ✅\n●───── ✾ ⌬ ✾ ─────●`,
          threadID
        );
        
      } catch (err) {
        log?.error("GC Nickname Error:", err);
        return api.sendMessage(`✾ ┇ فشل تعديل الكنيات.`, threadID, messageID);
      }
    }
    
    return api.sendMessage(`✾ ┇ خيار غير صحيح.`, threadID, messageID);
  }
};
