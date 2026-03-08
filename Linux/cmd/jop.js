const { getUser, updateUser } = require('../data/user');
const { styleNum } = require('../tools')
// الثابت يمثل فترة الانتظار بالمللي ثانية (30 دقيقة)
const COOLDOWN_TIME = 30 * 60 * 1000; 

// --- كائن JOBS لم يتم تغييره لأنه ليس جزءاً من الثغرات ---
const JOBS = {
  // ... (الوظائف كما كانت في الكود السابق) ...
  'الطب': {
    ranges: [
      { max: 15, amountRange: [500, 1000], action: 'فشلت في العملية وخسرت', type: 'loss' },
      { max: 70, amountRange: [1500, 5500], action: 'نجحت في إتمام العملية وحصلت على', type: 'win' },
      { max: 100, amountRange: [2000, 30000], action: 'أنقذت حياة وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الطب'
  },
  'الطبخ': {
    ranges: [
      { max: 50, amountRange: [100, 500], action: 'طبخت طبخة سيئة وخسرت', type: 'loss' },
      { max: 100, amountRange: [2000, 5000], action: 'طبخت طبخة مميزة وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الطبخ'
  },
  'الرقص': {
    ranges: [
      { max: 50, amountRange: [100, 500], action: 'ولكن لم يعجبهم هزك فخسرت', type: 'loss' },
      { max: 100, amountRange: [5000, 10000], action: 'وجعلت لعاب الجميع يسيل تستحق لقب كينغ الرقص', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الرقص'
  },
  'التجارة': {
    ranges: [
      { max: 30, amountRange: [2000, 2500], action: 'تاجر في الفواكه وحصلت على', type: 'win' },
      { max: 70, amountRange: [3000, 4000], action: 'تاجر في الملابس وحصلت على', type: 'win' },
      { max: 100, amountRange: [4000, 5000], action: 'تاجر في المخدرات وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال التجارة'
  },
  'الدعارة': {
    ranges: [
      { max: 100, amountRange: [10000, 100000], action: 'نمت ليلة في الفراش وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الدعارة'
  },
  'البرمجة': {
    ranges: [
      { max: 30, amountRange: [1000, 2000], action: 'وتعرضت لاختراق وخسرت', type: 'loss' },
      { max: 70, amountRange: [1000, 2500], action: 'وحصلت على', type: 'win' },
      { max: 100, amountRange: [7000, 10000], action: 'وأنشأت موقعًا ناجحًا وربحت', type: 'win' }
    ],
    baseMessage: 'لقد عملت ك مبرمج'
  },
  'التدريس': {
    ranges: [
      { max: 30, amountRange: [500, 1000], action: 'ولكن الطلاب لم يعجبوهم عملك وخسرت', type: 'loss' },
      { max: 70, amountRange: [1000, 2000], action: 'وحصلت على', type: 'win' },
      { max: 100, amountRange: [1000, 4000], action: 'وأصبحت أفضل مدرس وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت ك مدرس'
  },
  'الشرطة': {
    ranges: [
      { max: 30, amountRange: [2000, 3000], action: 'وحاولت الإمساك بمجرم ولكن فشلت وخسرت', type: 'loss' },
      { max: 70, amountRange: [2000, 4000], action: 'وأمسكت بسيارة مخالفة وحصلت على', type: 'win' },
      { max: 100, amountRange: [10000, 40000], action: 'وأمسكت بمجرم كبير وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كشرطي'
  },
  'الطيران': {
    ranges: [
      { max: 30, amountRange: [5000, 7000], action: 'وسقطت الطائرة ولكن لحسن الحظ لم يمت أحد وخسرت', type: 'loss' },
      { max: 100, amountRange: [8000, 10000], action: 'ونجحت في مهمتك وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الطيران'
  },
  'التنظيف': {
    ranges: [
      { max: 50, amountRange: [500, 1000], action: 'وتعرضت لكثير من المتاعب وخسرت', type: 'loss' },
      { max: 100, amountRange: [1000, 2000], action: 'وقمت بعملك بنجاح وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال التنظيف'
  },
  'الزراعة': {
    ranges: [
      { max: 30, amountRange: [1000, 1500], action: 'وكان الموسم سيئًا وخسرت', type: 'loss' },
      { max: 70, amountRange: [1500, 2500], action: 'وكان الموسم جيدًا وحصلت على', type: 'win' },
      { max: 100, amountRange: [2500, 3500], action: 'وكان الموسم ممتازًا وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال الزراعة'
  },
  'الصيد': {
    ranges: [
      { max: 40, amountRange: [800, 1800], action: 'عدت بصيد قليل وخسرت', type: 'loss' },
      { max: 80, amountRange: [2000, 4000], action: 'اصطدت أسماكًا وفيرة وحصلت على', type: 'win' },
      { max: 100, amountRange: [5000, 7500], action: 'اصطدت حوتاً نادراً وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت ك صياد'
  },
  'البناء': {
    ranges: [
      { max: 30, amountRange: [1000, 2000], action: 'سقط عليك سقف وخسرت', type: 'loss' },
      { max: 70, amountRange: [2500, 4500], action: 'ساعدت في بناء طابق جديد وحصلت على', type: 'win' },
      { max: 100, amountRange: [5000, 9000], action: 'أنهيت بناء برج كبير وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال البناء'
  },
  'التحري': {
    ranges: [
      { max: 20, amountRange: [500, 1500], action: 'تبعت العميل الخطأ وخسرت', type: 'loss' },
      { max: 80, amountRange: [1500, 3500], action: 'جمعت معلومات مفيدة وحصلت على', type: 'win' },
      { max: 100, amountRange: [4000, 6000], action: 'كشفت مؤامرة كبرى وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كمحقق خاص'
  },
  'القضاء': {
    ranges: [
      { max: 20, amountRange: [1000, 2500], action: 'واتخذت قرارًا خاطئًا وخسرت', type: 'loss' },
      { max: 100, amountRange: [5000, 15000], action: 'أصدرت حكمًا عادلاً وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كقاضي'
  },
  'المحاماة': {
    ranges: [
      { max: 40, amountRange: [1000, 3000], action: 'وخسرت القضية وخسرت', type: 'loss' },
      { max: 100, amountRange: [6000, 20000], action: 'كسبت قضية كبيرة وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كمحامي'
  },
  'الصحافة': {
    ranges: [
      { max: 30, amountRange: [500, 1000], action: 'ونشرت خبرًا كاذبًا وخسرت', type: 'loss' },
      { max: 70, amountRange: [1500, 3000], action: 'كتبت مقالًا جيدًا وحصلت على', type: 'win' },
      { max: 100, amountRange: [4000, 8000], action: 'كشفت فضيحة كبرى وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كصحفي'
  },
  'الحراسة': {
    ranges: [
      { max: 40, amountRange: [1000, 2000], action: 'واخترق اللصوص دفاعك وخسرت', type: 'loss' },
      { max: 100, amountRange: [3000, 6000], action: 'نجحت في حماية المنشأة وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كحارس أمن'
  },
  'التعدين': {
    ranges: [
      { max: 20, amountRange: [1000, 3000], action: 'وسقط عليك منجم وخسرت', type: 'loss' },
      { max: 70, amountRange: [3000, 7000], action: 'استخرجت معادن عادية وحصلت على', type: 'win' },
      { max: 100, amountRange: [8000, 15000], action: 'اكتشفت منجم ذهب وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت في مجال التعدين'
  },
  'الرياضة': {
    ranges: [
      { max: 30, amountRange: [500, 2000], action: 'وخسرت المباراة وخسرت', type: 'loss' },
      { max: 70, amountRange: [3000, 6000], action: 'فزت بمباراة عادية وحصلت على', type: 'win' },
      { max: 100, amountRange: [7000, 20000], action: 'فزت بالبطولة الكبرى وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كرياضي'
  },
  'التوصيل': {
    ranges: [
      { max: 40, amountRange: [100, 500], action: 'وأضعت الطلب وخسرت', type: 'loss' },
      { max: 100, amountRange: [1000, 2500], action: 'سلمت جميع الطلبات وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كعامل توصيل'
  },
  'الموسيقى': {
    ranges: [
      { max: 30, amountRange: [500, 1000], action: 'ولكن الجمهور لم يعجب بعزفك وخسرت', type: 'loss' },
      { max: 70, amountRange: [1000, 3000], action: 'قدمت عرضاً جيداً وحصلت على', type: 'win' },
      { max: 100, amountRange: [4000, 12000], action: 'قدمت حفلاً ناجحاً وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كفنان موسيقي'
  },
  'التمثيل': {
    ranges: [
      { max: 40, amountRange: [1000, 3000], action: 'وأديت دوراً سيئاً وخسرت', type: 'loss' },
      { max: 100, amountRange: [5000, 15000], action: 'أديت دوراً رئيسياً ناجحاً وحصلت على', type: 'win' }
    ],
    baseMessage: 'لقد عملت كممثل'
  }
};

const getRandomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomJobResult = (job) => {
  const ratio = Math.floor(Math.random() * 101);
  const range = job.ranges.find(r => ratio <= r.max);
  if (!range) return { amount: 0, action: 'لم تتوفر فرص عمل اليوم', type: 'neutral' };
  
  return {
    amount: getRandomAmount(range.amountRange[0], range.amountRange[1]),
    action: range.action,
    type: range.type
  };
};

// 1. تم تصحيح منطق التحقق من فترة الانتظار وتحديث الرصيد
const handleJobCommand = async (api, event, user) => {
  const { threadID, messageID } = event;
  const currentTime = Date.now();
  
  // التأكد من أن lastJobTime موجود وقيمته رقمية
  user.lastJobTime = Number(user.lastJobTime) || 0; 

  // 2. التحقق من فترة السماح (30 دقيقة)
  const timeElapsed = currentTime - user.lastJobTime;
  if (timeElapsed < COOLDOWN_TIME) {
    const timeRemaining = COOLDOWN_TIME - timeElapsed;
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    let timeMsg = '';
    if (minutes > 0) timeMsg += `${minutes} دقيقة`;
    if (seconds > 0) timeMsg += `${minutes > 0 ? ' و ' : ''}${seconds} ثانية`;

    return api.sendMessage(`⊳عليك الانتظار ${timeMsg} قبل العمل مرة أخرى.`, threadID, messageID);
  }

  // 3. اختيار وظيفة عشوائية
  const jobKeys = Object.keys(JOBS);
  const randomJobKey = jobKeys[Math.floor(Math.random() * jobKeys.length)];
  const job = JOBS[randomJobKey];
  
  // 4. الحصول على النتيجة
  const { amount, action, type } = getRandomJobResult(job);

  // تحديث وقت العمل الآن، حتى في حالة الحياد، لمنع إساءة الاستخدام
  user.lastJobTime = currentTime; 

  if (type === 'neutral') {
    await updateUser(user.id, { lastJobTime: user.lastJobTime });
    return api.sendMessage(`لم تتوفر فرص عمل في مجال ${randomJobKey} اليوم.`, threadID, messageID);
  }

  // 5. تحديث بيانات المستخدم ومنطق الخسارة
  user.money = Number(user.money) || 0;
  
  let finalAmount = amount;
  let finalMessage;
  
  if (type === 'loss') {
    if (user.money < amount) {
      // إذا كانت الخسارة أكبر من الرصيد، يتم تعيين الرصيد إلى صفر
      finalAmount = user.money; // الخسارة تساوي كل ما يملك
      user.money = 0;
      
      finalMessage = 
        `${job.baseMessage}\n` +
        `⊳ ${action} -${styleNum(finalAmount.toLocaleString())} جنيه.\n` +
        `⊳ رصيدك الحالي: ${styleNum(user.money)} جنيه.`;

      // حفظ التغييرات والخروج مباشرة
      await updateUser(user.id, { money: user.money, lastJobTime: user.lastJobTime });
      return api.sendMessage(finalMessage, threadID, messageID);
    } else {
      // خسارة عادية
      finalAmount = -amount;
      user.money += finalAmount;
    }
  } else {
    // ربح
    user.money += finalAmount;
  }
  
  // 6. حفظ الوقت والبيانات (في حالة الربح أو الخسارة العادية)
  await updateUser(user.id, { money: user.money, lastJobTime: user.lastJobTime });

  // 7. بناء رسالة الإخراج النهائية
  const sign = finalAmount >= 0 ? '+' : '-';
  const formattedAmount = Math.abs(finalAmount).toLocaleString();
  const balance = user.money.toLocaleString();

  finalMessage = 
    `＿＿＿＿＿＿＿＿\n${job.baseMessage}\n` +
    `⊳ ${action} ${sign}${styleNum(formattedAmount)} جنيه.\n` +
    `⊳ رصيدك الحالي: ${styleNum(balance)} جنيه.`;

  api.sendMessage(finalMessage, threadID, messageID);
};

module.exports = {
  name: 'عمل',
  otherName: ['شغل', 'job'],
  type: ['الاموال', 'الالعاب'],
  rank: 0,
  run: async (api, event) => {
    const user = await getUser(event.senderID);
    
    // 2. تنظيف رسالة عدم وجود حساب
    if (!user) {
      return api.sendMessage(`لا تملك حساباً. استخدم "تسجيل" أولاً.`, event.threadID, event.messageID);
    }

    await handleJobCommand(api, event, user);
  }
};

