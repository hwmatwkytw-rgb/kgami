// cmd/nickname.js
const config = require('../config.json');
const log = require('../logger');

const BERLIN_PREFIX = '';

// دالة مساعدة لإنشاء تأخير (700 ملي ثانية بين كل تغيير كنية)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// دالة تحويل الأسماء إلى العربية (أكثر دقة)
function toArabicName(name) {
  if (!name) return "";
  
  // توحيد النص للتعامل مع كل الحروف كحالة صغيرة
  let text = name.toLowerCase();
  
  // 1. قواعد خاصة للحروف المزدوجة (Digraphs) والظواهر الصوتية
  // يجب تطبيق هذه القواعد أولاً لأنها تتكون من أكثر من حرف
  const complexMap = {
    'th': 'ث', 
    'sh': 'ش',
    'ch': 'تْش', 
    'ph': 'ف',
    'gh': 'غ', 
    'oo': 'و',
    'ee': 'ي',
    'ay': 'ي',
    'ie': 'ي',
    'ue': 'و',
    'qu': 'كْو',
    // التعامل مع حرف 'C' قبل حروف العلة الخفيفة (e, i, y)
    'ce': 'س',
    'ci': 'س',
    'cy': 'س',
    // التعامل مع حرف 'G' قبل حروف العلة الخفيفة (e, i, y)
    'ge': 'ج',
    'gi': 'ج',
    'gy': 'ج',
  };
  
  // تطبيق التحويلات المعقدة
  for (const [key, value] of Object.entries(complexMap)) {
    // استخدام تعبير منتظم (Regular Expression) مع العلم بحالة الحروف (g)
    text = text.replace(new RegExp(key, 'g'), value);
  }

  // 2. قواعد التحويل لحرف واحد
  const simpleMap = {
    // حروف العلة (Vowels)
    'a': 'ا', 
    'e': 'ي', 
    'i': 'ي', 
    'o': 'و', 
    'u': 'و', 
    'y': 'ي', 
    
    // الحروف الساكنة (Consonants)
    'b': 'ب',
    'c': 'ك', 
    'd': 'د',
    'f': 'ف',
    'g': 'ج', 
    'h': 'هـ',
    'j': 'ج',
    'k': 'ك',
    'l': 'ل',
    'm': 'م',
    'n': 'ن',
    'p': 'ب',
    'q': 'ق',
    'r': 'ر',
    's': 'س',
    't': 'ت',
    'v': 'ف',
    'w': 'و',
    'x': 'كس',
    'z': 'ز',
    
    // للحفاظ على المسافات
    ' ': ' ',
    '-': '-',
  };
  
  // تطبيق التحويلات البسيطة
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
  otherName: ['كنيه', 'nickname'],
  rank: 1,
  cooldown: 5,
  type: ['المجموعة'],  
  run: async (api, event) => {
    const { threadID, messageID, body } = event;
    
    const args = body.trim().split(" ").slice(1);
    
    if (args.length === 0) {
      return api.sendMessage(
        `لصيغة:
كنية bot
كنية عام <القالب>`,
        threadID, messageID
      );
    }
    
    // ======================================
    // تغيير كنية البوت
    // ======================================
    if (args[0] === "bot") {
      const newNickname = config?.name;
      
      if (!newNickname) {
        return api.sendMessage(
          ` لا توجد قيمة name داخل config.json.`,
          threadID, messageID
        );
      }
      
      try {
        const botID = await api.getCurrentUserID();
        await api.nickname(newNickname, threadID, botID);
        
        return api.sendMessage(
          `${BERLIN_PREFIX} ✔ تم تعيين كنية البوت :
『${newNickname}』`,
          threadID, messageID
        );
        
      } catch (err) {
        log?.error("BOT Nickname Error:", err);
        return api.sendMessage(
          `فشل تغيير كنية البوت.\n${err.message}`,
          threadID, messageID
        );
      }
    }
    
    // ======================================
    // gc لتغيير كنيات أعضاء المجموعة
    // ======================================
    if (args[0] === "gc" || args[0] === "عام") {
      
      const template = args.slice(1).join(" ");
      
      if (!template || !template.includes("الاسم")) {
        return api.sendMessage(
          `يجب أن يحتوي القالب على كلمة (الاسم).`,
          threadID, messageID
        );
      }
      
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.userInfo || [];
        const botID = await api.getCurrentUserID();
        
        api.sendMessage(
          `⏳ جاري تطبيق الكنيات على ${members.length} عضو...`,
          threadID, messageID
        );
        
        for (const member of members) {
          const userID = member.id;
          if (userID === botID) continue; // منع تغيير اسم البوت
          
          const fullName = member.name || member.firstName || "User";
          const firstName = toArabicName(fullName.split(" ")[0]);
          
          const genderEmoji = getGenderEmoji(member.gender);
          
          // استبدال الاسم والجنس في أي مكان داخل القالب
          const finalNickname = template
            .replace(/الاسم/g, firstName)
            .replace(/الجنس/g, genderEmoji);
          
          try {
            await api.nickname(finalNickname, threadID, userID);
            // 🛑 إضافة التأخير المطلوب هنا
            await sleep(700); 
          } catch (e) {
            log?.error("Member Nickname Error:", e);
          }
        }
        
        return api.sendMessage(
          `${BERLIN_PREFIX} ✔ تم تطبيق الكنيات بنجاح!`,
          threadID
        );
        
      } catch (err) {
        log?.error("GC Nickname Error:", err);
        return api.sendMessage(
          `${BERLIN_PREFIX} ⚠️ فشل تعديل الكنيات.\n${err.message}`,
          threadID, messageID
        );
      }
    }
    
    // ======================================
    // خيار غير صحيح
    // ======================================
    return api.sendMessage(
      `خيار غير صحيح.
استخدم:
كنية bot
كنية عام <القالب>`,
      threadID, messageID
    );
  }
};

