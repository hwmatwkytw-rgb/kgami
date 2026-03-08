// cmd/رهان.js
const { getUser, updateUser } = require('../data/user');
const log = require('../logger');
const { styleNum } = require('../tools')
// توحيد الاستايل
const LINE = "＿＿＿＿＿＿＿＿";
const DECORATION = `\n${LINE}\n ⊳`;

// ==========================================
// 1. CONSTANTS and Core Logic
// ==========================================

const MIN_BET = 10;
// 49% فرصة للفوز (لصالح البوت قليلاً)
const BASE_WIN_CHANCE = 0.49; 

// 🎯 الخوارزمية الجديدة للمضاعفات الديناميكية (تم التعديل)
const MULTIPLIER_RANGES = {
    // تم توزيع الأوزان للسماح بمضاعفات تصل لـ 10x
    LOW_LUCK: { min: 1.2, max: 1.6, weight: 0.65 },    // فوز عادي (65% احتمال)
    MID_LUCK: { min: 1.6, max: 2.5, weight: 0.25 },    // فوز جيد (25% احتمال)
    HIGH_LUCK: { min: 2.5, max: 5.0, weight: 0.08 },   // فوز نادر (8% احتمال)
    VERY_HIGH_LUCK: { min: 6.0, max: 15.0, weight: 0.05 }, // فوز أسطوري (2% احتمال)
};

/**
 * يختار مضاعفاً عشوائياً بناءً على الاحتمالات الموزونة.
 */
function getWeightedMultiplier() {
    const roll = Math.random();
    let cumulativeWeight = 0;

    for (const key in MULTIPLIER_RANGES) {
        const range = MULTIPLIER_RANGES[key];
        cumulativeWeight += range.weight;

        if (roll <= cumulativeWeight) {
            // اختيار قيمة عشوائية داخل نطاق هذا المضاعف
            return (Math.random() * (range.max - range.min) + range.min);
        }
    }
    // Fallback في حال حدوث خطأ حسابي
    return MULTIPLIER_RANGES.LOW_LUCK.min; 
}


// ==========================================
// 2. Command Implementation
// ==========================================

module.exports = {
  name: 'رهان',
  otherName: ['bet'],
  info: 'راهن بمبلغ',
  usage: 'رهان [المبلغ]',
  usageCount: 0,
  rank: 0,
  run: async (api, event) => {
    try {
      const args = event.body.trim().split(/\s+/).slice(1);
      const betStr = args[0];
      
      if (!betStr) {
        return api.sendMessage(`اكتب معاهو رقم يا باطل 🦧. مثال: رهان 1000`, event.threadID, event.messageID);
      }
      
      const bet = Math.floor(Number(betStr));
      if (!bet || bet <= 0) {
        return api.sendMessage(`دا رقم جديد ولا شنو 🦧.`, event.threadID, event.messageID);
      }
      
      if (bet < MIN_BET) {
        return api.sendMessage(`اقل مبلغ ${MIN_BET} جنيه.`, event.threadID, event.messageID);
      }
      
      const user = await getUser(event.senderID);
      if (!user) {
        return api.sendMessage('⚠️ ما عندك حساب. استخدم "سجلني" أولاً.', event.threadID, event.messageID);
      }
      
      const balance = Number(user.money) || 0;
      if (balance < bet) {
        return api.sendMessage(`راجع قروشك يا باطل 🦧. رصيدك الحالي: ${balance} جنيه.`, event.threadID, event.messageID);
      }
      
      // 🎲 تنفيذ الخوارزمية الجديدة
      const winRoll = Math.random();
      const win = winRoll < BASE_WIN_CHANCE;
      
      let newBalance;
      let profit = 0;
      let message;
      
      if (win) {
        const multiplier = getWeightedMultiplier(); // مضاعف موزون ديناميكي
        const payout = Math.floor(bet * multiplier);
        profit = payout - bet;
        newBalance = balance + profit;
        
        // رسالة الفوز (تم التعديل للتعامل مع المضاعف العالي)
        const multDisplay = multiplier.toFixed(2);
        
        if (multiplier >= MULTIPLIER_RANGES.VERY_HIGH_LUCK.min) {
            // رسالة خاصة للفوز الأسطوري (5x فما فوق)
            message = `المضاعف ×${styleNum(multDisplay)}! مستحيل`;
        } else if (multiplier >= MULTIPLIER_RANGES.HIGH_LUCK.min) {
            // رسالة خاصة للفوز النادر (2.5x إلى 5x)
            message = `المضاعف ×${styleNum(multDisplay)}`;
        } else if (multiplier >= MULTIPLIER_RANGES.MID_LUCK.min) {
            // رسالة للفوز الجيد (1.6x إلى 2.5x)
            message = ` المضاعف ×${styleNum(multDisplay)}`;
        } else {
            // رسالة للفوز العادي (1.2x إلى 1.6x)
            message = ` المضاعف ×${styleNum(multDisplay)}`;
        }

      } else {
        // رسالة الخسارة (أسلوبك الخاص)
        newBalance = balance - bet;
        message = ` راحت عليك!`;
      }
      
      if (newBalance < 0) newBalance = 0; // لضمان عدم وجود رصيد سالب
      
      // 💾 حفظ التحديث
      await updateUser(user.id, { money: newBalance });
      
      // 📝 بناء الرسالة النهائية المبسطة
      let lines = [];
      lines.push(`${DECORATION} ${message}`);
      
      if (win) {
        lines.push(`⊳ ربحك +${styleNum(profit)} جنيه`);
      } else {
        lines.push(`⊳ خسارتك: -${styleNum(bet)} جنيه`);
      }
      lines.push(`⊳ رصيدك ${styleNum(newBalance)} جنيه`);
      //lines.push(LINE);
      
      api.sendMessage(lines.join('\n'), event.threadID, event.messageID);
      
    } catch (err) {
      log.error('Error in رهان command: ' + err);
      api.sendMessage('⚠️ حدث خطأ أثناء تنفيذ أمر الرهان.', event.threadID, event.messageID);
    }
  }
};

