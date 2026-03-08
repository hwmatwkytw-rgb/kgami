const log = require('../logger');

const SEP = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";
const BUTTERFLY = "🦋";

module.exports = {
  name: "اقتباس",
  otherName: ["quote"],
  type: ['النصوص', 'اخري'],
  rank: 0,
  cooldown: 2,
  description: 'يجلب لك اقتباس عشوائي من السجلات الملكية',

  run: async (api, event) => {
    try {
      // مصفوفة الاقتباسات الداخلية (يمكنك إضافة ما تريد هنا)
      const quotes = [
        { q: "الأخطاء ليست عيباً، العيب هو عدم التعلم منها.", a: "شينوبو كوشو" },
        { q: "مهما بلغت قوة عدوك، ابحث دائماً عن نقطة ضعفه.", a: "إبلين" },
        { q: "الهدوء قبل العاصفة هو سلاح الحكماء.", a: "مجهول" },
        { q: "الجمال يكمن في القوة التي تحمي الآخرين.", a: "هاشيرا الفراشة" },
        { q: "لا يقاس النجاح بما حققته، بل بالصعاب التي تغلبت عليها.", a: "بوذا" },
        { q: "القوة الحقيقية هي أن تبتسم في وجه الألم.", a: "سينكو" },
        { q: "كل نهاية هي بداية لشيء أعظم، فقط آمن بذلك.", a: "حكمة قديمة" }
      ];

      // اختيار اقتباس عشوائي من القائمة
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      // تنسيق الرسالة بأسلوب إبلين
      const msg = `${SEP}\n${BUTTERFLY} | حـكـمـة الـيـوم\n\n" ${randomQuote.q} "\n\n⌬ القائل: ${randomQuote.a}\n${SEP}`;
      
      api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      api.sendMessage(`${BUTTERFLY} | أعتذر، حدث خطأ في استخراج الحكمة من السجلات.`, event.threadID, event.messageID);
      log.error(err);
    }
  }
};
