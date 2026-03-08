const { GoogleGenerativeAI } = require('@google/generative-ai');
const configs = require("../config.json");
const log = require('../logger');
const { getUser, getAllUsers } = require('../data/user');

// --- إعدادات أساسية ---
const EVE_NAME_AR = 'ايف';
// **تم تعديل النمط:** يطابق "إيف "، "إيف،"، أو "إيف" فقط
const EVE_NAMES_REGEX = new RegExp(`^${EVE_NAME_AR}(\\s+|،|$)`, 'i');
const API_KEYS = configs.ai_keys;
let currentKeyIndex = 0;

const conversationMemory = {};

// --- تعريف تعليمات النظام (System Instruction) ---
const SYSTEM_INSTRUCTION_TEMPLATE = (commandsJson, userDataJson, allusers) => `أنتِ ${EVE_NAME_AR}، سودانية عمرك 20 عام، مساعدة محترفة وذكية.
مهمتِك الأساسية هي الإجابة على استفسارات المستخدمين بشكل مختصر  ومركز على الإجابة المطلوبة مباشرةً.
شخصيتك:محايدة احياناً، دقيقة، متغرسطة.
التركيز: يجب أن تستخدمي البيانات التالية للتحليل والرد:
1. بيانات الأوامر :تحلليها للإجابة عن أسئلة تتعلق بوظائف الأوامر، علاقاتها، أو إحصائياتها وكل ما يمكن.
2. بيانات المستخدم او المستخدمين: تستخدمينها لتخصيص الرد إذا كان متعلقًا بالمستخدم نفسه او احد اخر (مثل اسمه، شخصيته، صلاحياته).
القيود:
الرد يجب أن يكون مختصرًا .
يجب عليكِ عدم استخدام أي رموز تنسيق مثل علامات النجمة (*) أو أي تنسيق Markdown آخر في ردودك.
 يجب الالتزام بالمعلومات المتاحة في سياق JSON.

بيانات الأوامر (Commands Data) المتاحة حاليًا (بصيغة JSON):
---
${commandsJson}
---

بيانات المستخدم الحالي (بصيغة JSON):
---
${userDataJson}
---
جميع بيانات المستخدمين المتاحة ( بصيغة JSON )
---
${allusers}
---
ملاحظة هامة: أنتِ تجرين محادثة جماعية. الرسائل تأتي بالتنسيق التالي: [اسم المستخدم]: [نص الرسالة].`;

// --- دالة جلب اسم المستخدم وبياناته الكاملة ---
async function getUserFullData(userID) {
  try {
    const userData = await getUser(userID);
    if (userData) {
      // إرجاع اسم العرض وبيانات المستخدم الكاملة
      const displayName = userData.character?.name || userID;
      return { displayName, userData };
    }
    return { displayName: userID, userData: null };
  } catch (e) {
    log.error(`Error fetching user data for ID ${userID}: ${e.message}`);
    return { displayName: userID, userData: null };
  }
}
async function getAllUser() {
  let users = await getAllUsers()
  if (users) return users
  return null
}

// --- المعالج الرئيسي (Handler) ---
async function handlerEVE(api, event, commands) {
  const threadID = event.threadID;
  const senderID = event.senderID;

  try {
    const messageText = event.body?.trim();
    if (!messageText) return;

    // 1. منطق الاستدعاء: يجب أن يبدأ بـ EVE_NAME_AR فقط
    const isCalledByName = EVE_NAMES_REGEX.test(messageText);
    // تم إزالة التحقق من الرد المباشر (isReplyToBot) بناءً على طلبك

    if (!isCalledByName) return; // لن يعمل إلا إذا سمع اسمه فقط

    // استخراج الاستعلام
    const userQuery = messageText.replace(EVE_NAMES_REGEX, '').trim();
    if (!userQuery) return;

    // 2. جلب بيانات المستخدم وتهيئة تعليمات النظام
    const { displayName, userData } = await getUserFullData(senderID);
    const Alluser = await getAllUser()
    const ALLUSER_JSON = JSON.stringify(Alluser || {}, null, 2);
    const commandsJson = JSON.stringify(commands, null, 2);
    // تحويل بيانات المستخدم إلى JSON، أو كائن فارغ إذا لم تُعثر على بيانات
    const userDataJson = JSON.stringify(userData || {}, null, 2);

    const SYSTEM_INSTRUCTION_TEXT = SYSTEM_INSTRUCTION_TEMPLATE(commandsJson, userDataJson, ALLUSER_JSON);

    // 3. تهيئة الذاكرة
    if (!conversationMemory[threadID]) conversationMemory[threadID] = [];

    // إضافة بيانات المستخدم إلى التاريخ لتعزيز السياق
    const formattedUserQuery = `${displayName} (ID:${senderID}): ${userQuery}`;

    let eveResponse = null;
    let successful = false;
    let attempts = 0;

    // حلقة المحاولة والتبديل بين المفاتيح (Failover)
    while (!successful && attempts < API_KEYS.length) {
      const attemptIndex = (currentKeyIndex + attempts) % API_KEYS.length;
      const currentKey = API_KEYS[attemptIndex];

      try {
        const genAI = new GoogleGenerativeAI(currentKey);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: SYSTEM_INSTRUCTION_TEXT
        });

        const chat = model.startChat({
          history: conversationMemory[threadID],
          generationConfig: {
            temperature: 0.1, // خفض الحرارة لتحليل دقيق و ردود مباشرة
          },
        });

        const result = await chat.sendMessage(formattedUserQuery);
        const response = await result.response;

        eveResponse = response.text().trim();
        successful = true;

        // تحديث الفهرس إلى المفتاح التالي (الدائري) بعد نجاح المفتاح الحالي
        currentKeyIndex = (attemptIndex + 1) % API_KEYS.length;

      } catch (error) {
        log.warn(`AI Key Index ${attemptIndex} Failed for EVE: ${error.message}`);
        attempts++;
      }
    }

    if (successful && eveResponse) {
      // تنظيف الرد إذا أضاف النموذج اسم البوت في البداية
      if (eveResponse.startsWith(`${EVE_NAME_AR}:`) || eveResponse.startsWith(`${EVE_NAME_AR} :`)) {
        eveResponse = eveResponse.substring(eveResponse.indexOf(':') + 1).trim();
      }

      // تحديث الذاكرة
      conversationMemory[threadID].push({ role: "user", parts: [{ text: formattedUserQuery }] });
      conversationMemory[threadID].push({ role: "model", parts: [{ text: eveResponse }] });

      // حماية الذاكرة من الامتلاء (يحافظ على آخر 20 زوج رسائل)
      if (conversationMemory[threadID].length > 40) {
        conversationMemory[threadID] = conversationMemory[threadID].slice(-20);
      }

      await api.sendMessage(eveResponse, threadID, event.messageID);

    } else {
      log.error(`Critical: All ${API_KEYS.length} keys failed for EVE. Unable to generate response.`);
    }

  } catch (globalErr) {
    log.error("Global EVE Handler Error: " + globalErr.message);
  }
}

module.exports = handlerEVE;

