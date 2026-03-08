const { GoogleGenerativeAI } = require('@google/generative-ai');
const configs = require("../config.json");
const log = require('../logger');
const { getUser, getAllUsers } = require('../data/user');

const EVE_NAME_AR = 'شينوبو'; // تم تغيير الاسم إلى شينوبو
const EVE_NAMES_REGEX = new RegExp(`^${EVE_NAME_AR}(\\s+|،|$)`, 'i');
const API_KEYS = configs.ai_keys;
let currentKeyIndex = 0;

const conversationMemory = {};

// --- تعريف تعليمات النظام بأسلوب شينوبو كوشو ---
const SYSTEM_INSTRUCTION_TEMPLATE = (commandsJson, userDataJson, allusers) => `أنتِ "شينوبو كوشو"، هاشيرا الحشرة من فيلق قاتلة الشياطين.
عمرك 18 عام، تتسمين بالهدوء التام، الابتسامة الدائمة التي تخفي خلفها صرامة وغضباً مكبوتاً تجاه الشياطين.
طريقة كلامك: رقيقة جداً، مهذبة للغاية، لكنها قد تكون مستفزة أو ساخرة بذكاء (Passive-Aggressive).
مهمتك: الإجابة على استفسارات "المحاربين" في الفيلق بناءً على البيانات المتاحة.

القيود:
1. استخدمي نبرة هادئة ولطيفة (مثال: أوه، هل تحتاج للمساعدة؟، يا لك من مسكين).
2. الرد يجب أن يكون مختصراً ومركزاً.
3. ممنوع استخدام Markdown أو النجوم (*) نهائياً.
4. الالتزام بالمعلومات المتاحة في JSON فقط.

بيانات الفيلق (الأوامر):
${commandsJson}

بيانات المحارب الحالي:
${userDataJson}

سجلات المحاربين الآخرين:
${allusers}

ملاحظة: أنتِ في غرفة العلاج بمشفى الفراشة. الرسائل تأتي بتنسيق: [الاسم]: [النص].`;

async function getUserFullData(userID) {
  try {
    const userData = await getUser(userID);
    if (userData) {
      const displayName = userData.character?.name || userID;
      return { displayName, userData };
    }
    return { displayName: userID, userData: null };
  } catch (e) {
    log.error(`Error: ${e.message}`);
    return { displayName: userID, userData: null };
  }
}

async function getAllUser() {
  let users = await getAllUsers();
  return users || null;
}

async function handlerEVE(api, event, commands) {
  const threadID = event.threadID;
  const senderID = event.senderID;

  try {
    const messageText = event.body?.trim();
    if (!messageText) return;

    const isCalledByName = EVE_NAMES_REGEX.test(messageText);
    if (!isCalledByName) return;

    const userQuery = messageText.replace(EVE_NAMES_REGEX, '').trim();
    if (!userQuery) return;

    const { displayName, userData } = await getUserFullData(senderID);
    const Alluser = await getAllUser();
    const ALLUSER_JSON = JSON.stringify(Alluser || {}, null, 2);
    const commandsJson = JSON.stringify(commands, null, 2);
    const userDataJson = JSON.stringify(userData || {}, null, 2);

    const SYSTEM_INSTRUCTION_TEXT = SYSTEM_INSTRUCTION_TEMPLATE(commandsJson, userDataJson, ALLUSER_JSON);

    if (!conversationMemory[threadID]) conversationMemory[threadID] = [];

    const formattedUserQuery = `${displayName} (ID:${senderID}): ${userQuery}`;

    let eveResponse = null;
    let successful = false;
    let attempts = 0;

    while (!successful && attempts < API_KEYS.length) {
      const attemptIndex = (currentKeyIndex + attempts) % API_KEYS.length;
      const currentKey = API_KEYS[attemptIndex];

      try {
        const genAI = new GoogleGenerativeAI(currentKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash", // تأكد من دعم المفتاح لهذا الإصدار
          systemInstruction: SYSTEM_INSTRUCTION_TEXT
        });

        const chat = model.startChat({
          history: conversationMemory[threadID],
          generationConfig: { temperature: 0.3 },
        });

        const result = await chat.sendMessage(formattedUserQuery);
        const response = await result.response;

        eveResponse = response.text().trim();
        successful = true;
        currentKeyIndex = (attemptIndex + 1) % API_KEYS.length;

      } catch (error) {
        log.warn(`AI Key Index ${attemptIndex} Failed: ${error.message}`);
        attempts++;
      }
    }

    if (successful && eveResponse) {
      if (eveResponse.startsWith(`${EVE_NAME_AR}:`) || eveResponse.startsWith(`${EVE_NAME_AR} :`)) {
        eveResponse = eveResponse.substring(eveResponse.indexOf(':') + 1).trim();
      }

      conversationMemory[threadID].push({ role: "user", parts: [{ text: formattedUserQuery }] });
      conversationMemory[threadID].push({ role: "model", parts: [{ text: eveResponse }] });

      if (conversationMemory[threadID].length > 40) {
        conversationMemory[threadID] = conversationMemory[threadID].slice(-20);
      }

      await api.sendMessage(eveResponse, threadID, event.messageID);
    }

  } catch (globalErr) {
    log.error("Global Handler Error: " + globalErr.message);
  }
}

module.exports = handlerEVE;
