// commands/register.js
// نفترض أن دالة getAllUsers موجودة في هذا الملف
const { getUser, saveUser, getAllUsers } = require('../data/user'); 
const log = require('../logger');
const config = require('../config.json');

// ثابت يحدد الحد الأقصى لطول الاسم
const MAX_NAME_LENGTH = 10;
// ثابت يحدد الحد الأدنى لطول الاسم
const MIN_NAME_LENGTH = 3;

function getInitialStatsByType(type) {
  const stats = {
    'معزز':   { HP: 350, ATK: 220, DEF: 180, SPD: 120, IQ: 130 },
    'محول':   { HP: 320, ATK: 260, DEF: 150, SPD: 130, IQ: 140 },
    'باعث':   { HP: 300, ATK: 200, DEF: 140, SPD: 200, IQ: 160 },
    'مجسد':   { HP: 280, ATK: 210, DEF: 170, SPD: 170, IQ: 170 },
    'متلاعب': { HP: 260, ATK: 160, DEF: 140, SPD: 230, IQ: 210 },
    'متخصص': { HP: 300, ATK: 180, DEF: 150, SPD: 150, IQ: 220 }
  };

  return stats[type] || stats['معزز'];
}

function getRandomNenType() {
  const nenTypes = ['معزز', 'معزز','محول','محول','باعث','باعث','مجسد','مجسد','متلاعب', 'متخصص'];;
  const randomIndex = Math.floor(Math.random() * nenTypes.length);
  return nenTypes[randomIndex];
}

/**
 * دالة لتنقية الاسم وتصفيته:
 * 1. إزالة المسافات الزائدة.
 * 2. السماح فقط بالأحرف العربية والإنجليزية والأرقام.
 * @param {string} rawName 
 * @returns {string | null} الاسم المنقى أو null إذا كان غير صالح
 */
function sanitizeName(rawName) {
    if (!rawName) return null;
    
    // إزالة المسافات الزائدة في البداية والنهاية
    let cleanedName = rawName.trim();
    
    // التحقق من أن الاسم يحتوي فقط على أحرف عربية (بما في ذلك الألف والتاء المربوطة) وأحرف إنجليزية وأرقام.
    // يتم السماح بالمسافات الداخلية هنا مؤقتاً لتسهيل التحقق من الكلمة الأولى لاحقاً، لكن سيتم أخذ الكلمة الأولى فقط.
    // التعبير النمطي: يطابق أي حرف غير الأحرف المذكورة (العربية، الإنجليزية، الأرقام).
    const invalidCharRegex = /[^أ-ي0-9\s]/g;
    
    // إذا كان يحتوي على رموز غير مسموح بها، نعتبره غير صالح
    if (invalidCharRegex.test(cleanedName)) {
        return null; 
    }
    
    return cleanedName;
}

module.exports = {
  name: 'تسجيل',
  otherName: ['سجلني', 'انشاء'],
  rank: 0,
  type: 'النظام',
  discretion: 'واحد من الاوامر الاساسية يقوم بانشاء حساب بعد انشاء الحساب يمكنك التنتع بمعظم اوامر وخصائص البوت، طريقة الاستخظام : تسجيل الاسم', 
  cooldown: 3,
  run: async (api, event) => {
    try {
      const senderId = event.senderID;
      const threadID = event.threadID;
      const messageID = event.messageID;

      // 1. هل لديه حساب؟
      const exist = await getUser(senderId);
      if (exist) {
        api.setMessageReaction('🦧', messageID, threadID);
        return api.sendMessage(
          `عندك حساب بالفعل يا ${exist.character.name}.`,
          threadID,
          messageID
        );
      }

      // 2. معالجة وتصفية الاسم
      const rawArgs = event.body.trim().split(/\s+/).slice(1);
      
      // نأخذ الاسم المدخل بالكامل لتصفيته أولاً
      const fullInput = rawArgs.join(" ");
      const sanitizedFullInput = sanitizeName(fullInput);

      if (!sanitizedFullInput) {
        api.setMessageReaction('❌', messageID);
        return api.sendMessage(
            `اكتب اسمك مثال\n    تسجيل لينكس`,
            threadID,
            messageID
        );
      }
      
      // إعادة تقسيم الاسم المنقى لأخذ الكلمات
      const sanitizedArgs = sanitizedFullInput.split(/\s+/).filter(Boolean);
      
      let name = '';
      const firstWord = sanitizedArgs[0];
      const secondWord = sanitizedArgs.length > 1 ? sanitizedArgs[1] : null;

      if (!firstWord) {
        // إذا لم يتم إرسال أي كلمة بعد التصفية
        api.setMessageReaction('⚠️', messageID);
        return api.sendMessage(
          `اكتب اسم الشخصية بعد الأمر. يجب أن لا يتجاوز الاسم ${MAX_NAME_LENGTH} حروف.`,
          threadID,
          messageID
        );
      }
      
      // منطق اختيار الاسم (كما تم تحسينه سابقاً)
      if (firstWord.length >= MIN_NAME_LENGTH) {
        // الحالة الأولى: الاسم الأول صالح (>= 2 حروف). يتم اعتماده فقط.
        name = firstWord;
      } else if (firstWord.length < MIN_NAME_LENGTH) {
        if (secondWord) {
          // الحالة الثانية: الاسم الأول قصير، والثاني متوفر. نأخذ الثاني.
          name = secondWord;
        } else {
          // الحالة الثالثة: الاسم الأول قصير، والثاني غير متوفر. رسالة خطأ.
          api.setMessageReaction('⚠️', messageID);
          return api.sendMessage(
            `اسم الشخصية قصير جداً (${MIN_NAME_LENGTH} حروف على الأقل).`,
            threadID,
            messageID
          );
        }
      }

      // 3. التحقق من طول الاسم النهائي (الحد الأقصى)
      if (name.length > MAX_NAME_LENGTH) {
        api.setMessageReaction('❌', messageID);
        return api.sendMessage(
          `الاسم ${name} طويل جداً. الحد الأقصى لطول الاسم هو ${MAX_NAME_LENGTH} حروف.`,
          threadID,
          messageID
        );
      }
      
      // 4. التحقق من تكرار الاسم (الميزة الجديدة)
      const allUsers = await getAllUsers();
      // لتحسين كفاءة البحث وتوحيد المقارنة
      const nameToCheck = name.toLowerCase(); 
      
      const isDuplicate = allUsers.some(user => user.character.name.toLowerCase() === nameToCheck);
      
      if (isDuplicate) {
          api.setMessageReaction('📛', messageID);
          return api.sendMessage(
              `الاسم ${name} موجود شوف ليك اسم تاني.`,
              threadID,
              messageID
          );
      }


      // 5. اختيار فئة عشوائية
      const randomType = getRandomNenType();

      // 6. الإحصائيات حسب الفئة وبناء الحساب الجديد
      const stats = getInitialStatsByType(randomType);

      const newUser = {
        id: senderId,
	gold: 1,
        diamond: 50,
        money: 1000,
        character: {
          name, 
          type: randomType,
          level: 1,
          rating: 0,
          bar: ['⓿', ''],
          // ... (بقية الإحصائيات)
          HP: stats.HP, XHP: stats.HP,
          ATK: stats.ATK, XATK: stats.ATK,
          DEF: stats.DEF, XDEF: stats.DEF,
          SPD: stats.SPD, XSPD: stats.SPD,
          IQ: stats.IQ, XIQ: stats.IQ
        }
      };

      await saveUser(newUser);

      // 7. رسالة النجاح
      api.setMessageReaction('✅', messageID);

      return api.sendMessage(
        `────────
⊳ تم إنشاء حسابك بنجاح.
   الاسم: ${name}
⊳ الفئة: ${randomType}
────────`,
        threadID,
        messageID
      );

    } catch (error) {
      log.error('Error in تسجيل command:' + error);
      api.sendMessage(`${error.message}`, threadID, messageID);
    }
  }
};

