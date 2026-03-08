const {styleNum} = require('../tools')
const { getAllUsers } = require('../data/user');

// دالة لحساب مسافة Levenshtein بين سلسلتين
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // حذف
        matrix[i][j - 1] + 1,      // إدراج
        matrix[i - 1][j - 1] + cost // استبدال
      );
    }
  }
  return matrix[a.length][b.length];
}

module.exports = {
  name: "بحث",
  type: ['معلومات'],
  cooldown: 2,
  rank: 0,
  run: async (api, event, commands, args) => {
    const { threadID, messageID } = event;
    const { sendMessage } = api;

    const query = args.join(" ").toLowerCase();
    if (!query) return sendMessage('لازم تكتب اسم الشخص المطلوب', threadID, messageID);

    const allUsers = await getAllUsers();

    // البحث عن التطابق الكامل أولاً
    let user = allUsers.find(u => u.character.name.toLowerCase() === query);

    // إذا لم يعثر على تطابق كامل، البحث عن أقرب تطابق باستخدام Levenshtein
    let suggestions = [];
    if (!user) {
      const distances = allUsers.map(u => ({
        user: u,
        distance: levenshtein(query, u.character.name.toLowerCase())
      }));
      distances.sort((a, b) => a.distance - b.distance);
      user = distances[0].user; // أفضل تطابق
      // اقتراح أفضل 3 أسماء إذا كانت مختلفة عن التطابق الأول
      suggestions = distances.slice(1, 4).map(d => d.user.character.name);
    }


    // بناء الرسال
    let bol 
    let message = '＿＿＿＿＿＿＿\n';
    message += `⊳ الاسم : ${user.character.name}\n`;
    message += `⊳ الموقع : ${user.character.location}\n`
    message += `⊳ الثروة : ${styleNum(user.money.toLocaleString())} جنيه\n`;
    message += `⊳ المستوى : ${styleNum(user.character.level)}\n`;
    message += `⊳ الفئة : ${user.character.type}\n`
    message += `⊳ الصحة : ${styleNum(user.character.HP)}\n`;
    message += `⊳ الهجوم : ${styleNum(user.character.ATK)}\n`;
    message += `⊳ الدفاع : ${styleNum(user.character.DEF)}\n`;
    message += `⊳ السرعة : ${styleNum(user.character.SPD)}\n`;
    message += `⊳ الذكاء : ${styleNum(user.character.IQ)}\n`;
    //message += '───────';

    if (suggestions.length > 0) {
      message += `\n💡 هل كنت تقصد: ${suggestions.join(", ")}؟`;
    }

    return sendMessage(message, threadID, messageID);
  }
};
