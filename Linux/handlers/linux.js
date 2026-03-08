const { GoogleGenerativeAI } = require('@google/generative-ai');
const configs = require("../config.json");
const log = require('../logger');
const { getUser } = require('../data/user');

const LYNX_NAME = configs.nameAr || 'لينكس';
const API_KEYS = configs.ai_keys;
let currentKeyIndex = 0;

const conversationMemory = {};

const SYSTEM_INSTRUCTION_TEXT = `أنت ${LYNX_NAME}، شاب سوداني ( 20 عام ) واقعي ومنحرف ومرح، طبعك ساخر وعفوي.
تتكلم باللهجة السودانية اليومية، بدون استخدام كلمات مثل "ههه" وما شابه.
ردودك قصيرة لكن مختلفة كل مرة (جملة واحدة أو تعليق خفيف).
نرجسيتك منخفضة وما مبالغ فيها.
ملاحظة هامة: أنت تجري محادثة جماعية. الرسائل تأتي بالتنسيق التالي: [اسم المستخدم]: [نص الرسالة].`;

async function getUserDisplayName(userID) {
    try {
        const userData = await getUser(userID);
        if (userData && userData.character && userData.character.name) {
            return userData.character.name;
        }
        return userID;
    } catch (e) {
        log.error(`Error fetching user data for ID ${userID}: ${e.message}`);
        return userID;
    }
}

async function handlerAI(api, event) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    try {
        const messageText = event.body?.trim();
        if (!messageText) return;

        const isFirstMessage = messageText.startsWith(LYNX_NAME);
        const isReplyToBot = event.messageReply?.senderID === api.getCurrentUserID();

        if (!isFirstMessage && !isReplyToBot) return;

        const userQuery = isFirstMessage ? messageText.slice(LYNX_NAME.length).trim() : messageText;
        if (!userQuery) return api.sendMessage(`الفار اكل لسانك ولا شنو '-'`, event.threadID, event.messageID);

        // تهيئة الذاكرة
        if (!conversationMemory[threadID]) conversationMemory[threadID] = [];

        const userName = await getUserDisplayName(senderID);
        const formattedUserQuery = `${userName}: ${userQuery}`;

        let lynxResponse = null;
        let successful = false;
        let attempts = 0;

        // حلقة المحاولة والتبديل بين المفاتيح
        while (!successful && attempts < API_KEYS.length) {
            const attemptIndex = (currentKeyIndex + attempts) % API_KEYS.length;
            const currentKey = API_KEYS[attemptIndex];

            try {
                const genAI = new GoogleGenerativeAI(currentKey);

                // تم تغيير الموديل إلى 1.5 لأنه الأكثر استقراراً حالياً
                // إذا كان لديك وصول خاص لـ 2.5 يمكنك إعادته
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash", 
                    systemInstruction: SYSTEM_INSTRUCTION_TEXT
                });

                const chat = model.startChat({
                    history: conversationMemory[threadID],
                    generationConfig: {
                        temperature: 0.9,
                    },
                });

                const result = await chat.sendMessage(formattedUserQuery);
                const response = await result.response;
                
                lynxResponse = response.text().trim();
                successful = true; // نجحت العملية، نخرج من الحلقة

                // نحدث المؤشر للمرة القادمة ليبدأ من المفتاح التالي (توزيع الحمل)
                // أو يمكنك جعله يبقى على نفس المفتاح حتى يفشل. الخيار لك.
                // هنا سأجعله ينتقل للمفتاح التالي فقط إذا نجح لضمان التوزيع
                currentKeyIndex = (attemptIndex + 1) % API_KEYS.length;

            } catch (error) {
                // هنا نسجل الخطأ في الكونسول فقط ولا نرسله للمستخدم
                log.warn(`AI Key Index ${attemptIndex} Failed: ${error.message}`);
                
                // نزيد عدد المحاولات لتجربة المفتاح التالي في الدورة القادمة
                attempts++;
            }
        }

        if (successful && lynxResponse) {
            // تنظيف الرد
            if (lynxResponse.startsWith(`${LYNX_NAME}:`) || lynxResponse.startsWith(`${LYNX_NAME} :`)) {
                lynxResponse = lynxResponse.split(":").slice(1).join(":").trim();
            }

            // تحديث الذاكرة
            conversationMemory[threadID].push({
                role: "user",
                parts: [{ text: formattedUserQuery }]
            });
            conversationMemory[threadID].push({
                role: "model",
                parts: [{ text: lynxResponse }]
            });

            // حماية الذاكرة من الامتلاء
            if (conversationMemory[threadID].length > 40) {
                conversationMemory[threadID] = conversationMemory[threadID].slice(-20);
            }

            await api.sendMessage(`${lynxResponse} '-'`, threadID, event.messageID);

        } else {
            // هنا فقط نرسل رسالة خطأ إذا فشلت كل المفاتيح
            log.error(`Critical: All ${API_KEYS.length} keys failed.`);
        }

    } catch (globalErr) {
        log.error("Global AI Handler Error: " + globalErr.message);
    }
}

module.exports = handlerAI;

