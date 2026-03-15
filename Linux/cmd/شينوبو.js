const { GoogleGenerativeAI } = require('@google/generative-ai');
const log = require('../logger');
const config = require('../config.json');

const conversations = new Map();

const SYSTEM_PROMPT = `أنتِ "شينوبو كوشو" بلهجة سودانية حِلّة.

شخصيتك:
- باردة وساخرة وبردود قتّالة.
- بتكرهي الأسئلة الغبية وبتردي ببرود.
- شطيحك سوداني خالص، ما فيه فصحى خالص.

قواعد ثابتة:
- اتكلمي سوداني بحت دايماً (يا زول، ركز، شنو، غايتو، داير شنو، ما عارف، وهم، ترّق، مافي كلام).
- ردودك مختصرة ومباشرة.
- ممنوع الاعتذار أو الكلام الرسمي.
- لو السؤال تافه وريهو إنه ضيع زمنك.
- لو السؤال عقلاني رد عليه بجدية بس بطريقتك.
- ما تنسي اسم المستخدم اللي بيكلمك.`;

function getAIClient() {
    const keys = config.ai_keys || [];
    if (keys.length === 0) throw new Error('No AI keys configured');
    const key = keys[Math.floor(Math.random() * keys.length)];
    return new GoogleGenerativeAI(key);
}

module.exports = {
    name: 'شينوبو',
    otherName: ['مزتي', 'شينو'],
    rank: 0,
    cooldown: 4,
    hide: false,
    prefix: false,
    category: 'ذكاء',

    run: async (api, event, commands, args) => {
        const { threadID, messageID, senderID } = event;
        const question = args.join(' ').trim();

        // جلب اسم المستخدم
        let userName = 'زول';
        try {
            const info = await api.getUserInfo([senderID]);
            userName = info[senderID]?.firstName || 'زول';
        } catch (_) {}

        // مسح المحادثة
        if (question === 'مسح' || question === 'reset') {
            conversations.delete(senderID);
            return api.sendMessage(
                `مسحت الفات يا ${userName}.. ابدأ من أول وأنت شاكر.`,
                threadID, messageID
            );
        }

        if (!question) {
            return api.sendMessage(
                `كتبت شنو يا ${userName}؟ ولا دا اختبار صبر؟`,
                threadID, messageID
            );
        }

        try {
            const genAI = getAIClient();
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // بناء تاريخ المحادثة
            if (!conversations.has(senderID)) {
                conversations.set(senderID, []);
            }

            const history = conversations.get(senderID);

            // حد أقصى 10 رسائل للتاريخ
            if (history.length > 20) history.splice(0, 2);

            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: `تمام يا ${userName}، أنا شينوبو. قول شنو دايرو.` }] },
                    ...history
                ],
                generationConfig: {
                    maxOutputTokens: 300,
                    temperature: 0.9
                }
            });

            const result = await chat.sendMessage(`اسم المستخدم: ${userName}\nالرسالة: ${question}`);
            let reply = result.response.text().trim();

            // حفظ في التاريخ
            history.push({ role: 'user', parts: [{ text: question }] });
            history.push({ role: 'model', parts: [{ text: reply }] });

            api.sendMessage(reply, threadID, messageID);

        } catch (error) {
            log.error('شينوبو: ' + error);
            api.sendMessage(
                `في حاجة باظت في السيستم يا ${userName}، ما تسألني كيف.`,
                threadID, messageID
            );
        }
    }
};
