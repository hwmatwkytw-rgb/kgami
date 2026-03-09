const log = require('../logger');
const { styleText } = require('../tools');

const SEP = "⎔────────────⎔";
const ICON = "㊙︎";

module.exports = {
  name: "اقتباس",
  otherName: ["quote", "حكمة"],
  type: ['النصوص', 'اخري'],
  rank: 0,
  cooldown: 2,
  description: 'يجلب لك اقتباس عشوائي من السجلات الملكية',

  run: async (api, event) => {
    try {
      const quotes = [
        { q: "الأخطاء ليست عيباً، العيب هو عدم التعلم منها.", a: "شينوبو كوشو" },
        { q: "مهما بلغت قوة عدوك، ابحث دائماً عن نقطة ضعفه.", a: "إبلين" },
        { q: "الهدوء قبل العاصفة هو سلاح الحكماء.", a: "مجهول" },
        { q: "الجمال يكمن في القوة التي تحمي الآخرين.", a: "هاشيرا الفراشة" },
        { q: "لا يقاس النجاح بما حققته، بل بالصعاب التي تغلبت عليها.", a: "بوذا" },
        { q: "القوة الحقيقية هي أن تبتسم في وجه الألم.", a: "سينكو" },
        { q: "كل نهاية هي بداية لشيء أعظم، فقط آمن بذلك.", a: "حكمة قديمة" }
      ];

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      // التنسيق الهندسي الجديد (البداية والنهاية فقط)
      const msg = `${SEP}\n  ${styleText('ROYAL QUOTE')}\n\n"${randomQuote.q}"\n\n${ICON} القائل: ${randomQuote.a}\n\n${SEP}`;
      
      api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      api.sendMessage(`${ICON} | أعتذر، حدث خطأ في استخراج الحكمة.`, event.threadID, event.messageID);
      log.error(err);
    }
  }
};
