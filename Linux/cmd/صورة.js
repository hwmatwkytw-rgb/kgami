const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');

const MODELS = {
    '1': { id: 'flux',          name: 'Flux - عام' },
    '2': { id: 'flux-realism',  name: 'Flux Realism - واقعي' },
    '3': { id: 'flux-anime',    name: 'Flux Anime - أنمي' },
    '4': { id: 'flux-3d',       name: 'Flux 3D - ثلاثي الأبعاد' },
    '5': { id: 'any-dark',      name: 'Dark - مظلم' },
    '6': { id: 'turbo',         name: 'Turbo - سريع' },
};

const SIZES = {
    'مربع':    { w: 1024, h: 1024 },
    'عمودي':   { w: 768,  h: 1344 },
    'أفقي':   { w: 1344, h: 768  },
    'default': { w: 1024, h: 1024 },
};

if (!global.imgReplies) global.imgReplies = new Map();

module.exports = {
    name: 'صورة',
    otherName: ['image', 'img', 'sd', 'رسم', 'generate'],
    rank: 0,
    cooldown: 10,
    hide: false,
    prefix: true,
    category: 'ai',

    run: async (api, event, commands, args) => {
        const { threadID, messageID, senderID, messageReply } = event;

        // --- رد على اختيار موديل ---
        if (messageReply && global.imgReplies.has(messageReply.messageID)) {
            const data = global.imgReplies.get(messageReply.messageID);
            if (data.author !== senderID) return;

            const choice = (event.body || '').trim();
            const model = MODELS[choice];
            if (!model) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ اختر رقم من 1 لـ ${Object.keys(MODELS).length}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }

            global.imgReplies.delete(messageReply.messageID);
            return await generateImage(api, event, data.prompt, model.id, model.name, data.size);
        }

        const cmd = (args[0] || '').toLowerCase();

        // --- عرض الموديلات ---
        if (cmd === 'موديلات' || cmd === 'models') {
            let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⏣ ⟬ موديلات التوليد ⟭\n✾ ┇ ⸻⸻⸻⸻⸻\n`;
            for (const [num, m] of Object.entries(MODELS)) {
                msg += `✾ ┇ ◍ ${num}. ${m.name}\n`;
            }
            msg += `✾ ┇\n✾ ┇ مثال: صورة قطة جميلة\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // --- تحديد الحجم ---
        let size = SIZES['default'];
        let filteredArgs = [...args];

        for (const [key, val] of Object.entries(SIZES)) {
            if (key === 'default') continue;
            const idx = filteredArgs.indexOf(key);
            if (idx !== -1) {
                size = val;
                filteredArgs.splice(idx, 1);
                break;
            }
        }

        // --- تحديد الموديل بالرقم ---
        let selectedModel = null;
        for (const [num, m] of Object.entries(MODELS)) {
            const idx = filteredArgs.indexOf(num);
            if (idx !== -1) {
                selectedModel = m;
                filteredArgs.splice(idx, 1);
                break;
            }
        }

        const prompt = filteredArgs.join(' ').trim();

        if (!prompt) {
            let msg =
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ توليد الصور بالذكاء الاصطناعي 🎨 ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 📌 الاستخدام:\n` +
                `✾ ┇ صورة <الوصف>\n` +
                `✾ ┇ صورة <رقم_موديل> <الوصف>\n` +
                `✾ ┇ صورة <الوصف> <مربع|عمودي|أفقي>\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 🖼️ الموديلات:\n`;
            for (const [num, m] of Object.entries(MODELS)) {
                msg += `✾ ┇  ${num}. ${m.name}\n`;
            }
            msg +=
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ مثال: صورة 3 قطة تلعب في الثلج عمودي\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // لو ما اختار موديل، اسأله
        if (!selectedModel) {
            let msg =
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ اختر الموديل ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n`;
            for (const [num, m] of Object.entries(MODELS)) {
                msg += `✾ ┇ ◍ ${num}. ${m.name}\n`;
            }
            msg += `✾ ┇\n✾ ┇ 💬 رد برقم الموديل\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`;

            api.sendMessage(msg, threadID, (err, info) => {
                if (err || !info) return;
                global.imgReplies.set(info.messageID, { author: senderID, prompt, size });
                setTimeout(() => global.imgReplies.delete(info.messageID), 60000);
            }, messageID);
            return;
        }

        await generateImage(api, event, prompt, selectedModel.id, selectedModel.name, size);
    }
};

async function generateImage(api, event, prompt, modelId, modelName, size) {
    const { threadID, messageID } = event;

    const statusMsg = await new Promise(resolve => {
        api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
            `✾ ┇\n` +
            `✾ ┇ 🎨 جاري توليد الصورة...\n` +
            `✾ ┇ ◍ الموديل: ${modelName}\n` +
            `✾ ┇ ◍ الحجم: ${size.w}×${size.h}\n` +
            `✾ ┇ ⏳ انتظر 10-30 ثانية\n` +
            `✾ ┇\n` +
            `⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, (err, info) => resolve(info), messageID
        );
    });

    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 999999);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${modelId}&width=${size.w}&height=${size.h}&seed=${seed}&nologo=true&enhance=true`;

        const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });

        const cacheDir = path.join(__dirname, '..', 'cache');
        await fs.ensureDir(cacheDir);
        const filePath = path.join(cacheDir, `img_${Date.now()}.jpg`);
        await fs.writeFile(filePath, Buffer.from(imgRes.data));

        await api.sendMessage({
            body:
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ✅ تم توليد الصورة!\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 🖼️ الموديل: ${modelName}\n` +
                `✾ ┇ 📝 الوصف: ${prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt}\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            try { fs.unlinkSync(filePath); } catch (_) {}
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        log.error('صورة: ' + error);
        api.unsendMessage(statusMsg.messageID);
        api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ فشل التوليد، جرب مرة ثانية\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, messageID
        );
    }
}
