// Command: bmi (مؤشر كتلة الجسم)
module.exports = {
  name: "كتلة",
  otherName: ["bim"],
  rank: 0,
  cooldown: 2,
  usage: 'كتلة [الوزن بالكيلوجرام] [الطول بالمتر]\nمثال: كتلة 70 1.75',
  run: async (api, event, commands, args) => {
    // مثال: bmi 70 1.75
    if (args.length !== 2) return api.sendMessage("طريقة الاستخدام \nمثال: كتلة 70 1.75", event.threadID, event.messageID);

    const weight = parseFloat(args[0]); // الوزن (كجم)
    const height = parseFloat(args[1]);  // الطول (م)

    if (isNaN(weight) || isNaN(height) || height <= 0) return api.sendMessage("أدخل أرقامًا صحيحة للوزن والطول.", event.threadID, event.messageID);

    const bmi = weight / (height * height);
    let category = "";

    if (bmi < 18.5) {
      category = "نقص في الوزن";
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = "وزن صحي";
    } else if (bmi >= 25 && bmi <= 29.9) {
      category = "وزن زائد (ما قبل السمنة)";
    } else {
      category = "سمنة";
    }

    const msg = `مؤشر كتلة الجسم (BMI):\n` +
                `القيمة: ${bmi.toFixed(2)}\n` +
                `التصنيف: ${category}`;
    api.sendMessage(msg, event.threadID, event.messageID);
  }
};

