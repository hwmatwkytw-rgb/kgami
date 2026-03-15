const FormData = require('form-data');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');

if (!global.artReplies) global.artReplies = new Map();

module.exports = {
    name: 'ارت',
    otherName: ['art', 'anime-art'],
    rank: 0,
    cooldown: 5,
    hide: false,
    prefix: true,
    category: 'الوسائط ',

    run: async (api, event, commands, args) => {
        const { threadID, messageID, senderID, messageReply } = event;

        // --- معالجة الرد (التنقل بين الصفحات) ---
        if (messageReply && global.artReplies.has(messageReply.messageID)) {
            const replyData = global.artReplies.get(messageReply.messageID);
            if (replyData.author !== senderID) return;

            const page = parseInt((event.body || '').trim());
            if (isNaN(page)) return;

            global.artReplies.delete(messageReply.messageID);
            return await showModels(replyData.models, page, api, threadID, senderID, replyData.title);
        }

        const cmd = (args[0] || '').toLowerCase();

        // --- عرض القائمة الرئيسية ---
        if (!cmd) {
            return api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ أوامـر الـتـحـويـل 🎨 ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 🖼️ ارت [رقم]  ← رد على صورة\n` +
                `✾ ┇ 📋 ارت موديلات  ← عرض الستايلات\n` +
                `✾ ┇ 🔍 ارت بحث [كلمة]  ← بحث عن ستايل\n` +
                `✾ ┇ 📊 ارت احصائيات  ← حالة النظام\n` +
                `✾ ┇\n` +
                `✾ ┇ مـثـال: ارت 29 (رد على صورة)\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );
        }

        // --- الإحصائيات ---
        if (cmd === 'احصائيات' || cmd === 'stats') {
            const models = await getModels();
            return api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ إحـصـائـيـات الـنـظـام ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 🎨 الـسـتـايـلات: ${models.length}\n` +
                `✾ ┇ ⭐ الـشـعـبـيـة: Anime Style\n` +
                `✾ ┇ ✅ الـحـالـة: مـتـصـل\n` +
                `✾ ┇\n` +
                `✾ ┇ اكـتب "ارت موديلات" للعرض\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );
        }

        // --- عرض الموديلات ---
        if (cmd === 'موديلات' || cmd === 'models' || cmd === 'list') {
            const page = parseInt(args[1]) || 1;
            const models = await getModels();
            return await showModels(models, page, api, threadID, senderID, '⏣ ⟬ قـائـمـة الـسـتـايـلات ⟭');
        }

        // --- البحث ---
        if (cmd === 'بحث' || cmd === 'search') {
            const searchQuery = args.slice(1).join(' ').trim();
            if (!searchQuery) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🔍 يرجى كتابة كلمة للبحث عنها!\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }
            const models = await getModels(searchQuery);
            if (models.length === 0) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 😢 لم يتم العثور على "${searchQuery}"\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }
            return await showModels(models, 1, api, threadID, senderID, '⏣ ⟬ نـتـائـج الـبـحـث ⟭');
        }

        // --- تحويل الصورة ---
        if (messageReply?.attachments?.[0]?.type === 'photo') {
            let styleNum = 29;
            if (args[0] && !isNaN(args[0])) styleNum = parseInt(args[0]);

            const models = await getModels();
            if (styleNum < 0 || styleNum >= models.length) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ رقم غير صالح!\n✾ ┇ اختر بين 0 و ${models.length - 1}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }

            const selectedStyle = models[styleNum];

            api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ جـاري الـتـحـويـل 🎨 ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 🖼️ الـسـتايل: ${selectedStyle.name}\n` +
                `✾ ┇ ⏳ الـحـالـة: يـتم الـمـعالـجـة...\n` +
                `✾ ┇ ⏱️ الـوقـت: 5-10 ثـوانـي\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );

            try {
                const imgResponse = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer', timeout: 30000 });
                const cacheDir = path.join(__dirname, '..', 'cache');
                if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

                const imgPath = path.join(cacheDir, `Art${Date.now()}.png`);
                fs.writeFileSync(imgPath, imgResponse.data);

                const result = await processImage(imgPath, selectedStyle.id);
                const resultStream = await axios.get(result, { responseType: 'stream' });

                await api.sendMessage({
                    body:
                        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                        `✾ ┇\n` +
                        `✾ ┇ ✅ تـم الـتـحـويـل بـنـجـاح!\n` +
                        `✾ ┇ 🎨 الـسـتـايـل: ${selectedStyle.name}\n` +
                        `✾ ┇\n` +
                        `⏣────── ✾ ⌬ ✾ ──────⏣`,
                    attachment: resultStream.data
                }, threadID, () => {
                    try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
                }, messageID);

            } catch (error) {
                log.error('ارت processImage: ' + error);
                api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ فشل النظام: ${error.message}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }
        } else {
            return api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 📸 يرجى الرد على صورة أولاً!\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );
        }
    }
};

// --- دالة عرض الموديلات مع الصفحات ---
async function showModels(models, page, api, threadID, author, title) {
    const pageSize = 20;
    const totalPages = Math.ceil(models.length / pageSize);

    if (page < 1 || page > totalPages) {
        return api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 📄 الصفحة غير موجودة!\n✾ ┇ اختر بين 1 و ${totalPages}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID
        );
    }

    const start = (page - 1) * pageSize;
    const modelsPage = models.slice(start, start + pageSize);

    let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ${title}\n✾ ┇ 📄 الـصـفـحـة: ${page} مـن ${totalPages}\n✾ ┇ ⸻⸻⸻⸻⸻\n`;
    modelsPage.forEach(m => { msg += `✾ ┇ ◍ ${m.originalIndex} - ${m.name}\n`; });
    msg += `✾ ┇\n✾ ┇ 💬 رد بـرقم الـصـفـحـة لـلـتـنـقـل\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`;

    api.sendMessage(msg, threadID, (err, info) => {
        if (err || !info) return;
        global.artReplies.set(info.messageID, { author, models, title });
        setTimeout(() => { global.artReplies.delete(info.messageID); }, 120000);
    });
}

// --- جلب الموديلات من API ---
async function getModels(searchQuery = '') {
    const idgen = genUID();
    try {
        const res = await axios.get(`https://be.aimirror.fun/filter_search?uid=${idgen}`, {
            headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen }
        });

        let models = res.data.search_info
            .filter(i => !i.key_words.includes('video'))
            .map((i, index) => ({ id: i.model_id, name: i.model, key_words: i.key_words, originalIndex: index }));

        models = [...new Map(models.map(i => [i.id, i])).values()];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.key_words.some(k => k.toLowerCase().includes(q))
            );
        }

        return models.map((m, i) => ({ ...m, originalIndex: i }));
    } catch (e) {
        log.error('ارت getModels: ' + e);
        return [];
    }
}

// --- معالجة الصورة ---
async function processImage(imagePath, modelId) {
    const idgen = genUID();

    const tokenRes = await axios.get(
        `https://be.aimirror.fun/app_token/v2?cropped_image_hash=${crypto.randomBytes(20).toString('hex')}.jpeg&uid=${idgen}`,
        { headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen } }
    );
    const token = tokenRes.data;

    const form = new FormData();
    Object.keys(token).forEach(key => form.append(key, token[key]));
    form.append('file', fs.createReadStream(imagePath));
    await axios.post('https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.com', form, { headers: form.getHeaders() });

    const { width, height } = imageSize(fs.readFileSync(imagePath));

    const taskRes = await axios.post(`https://be.aimirror.fun/draw?uid=${idgen}`, {
        model_id: parseInt(modelId),
        cropped_image_key: token.key,
        cropped_height: height,
        cropped_width: width,
        package_name: 'com.ai.polyverse.mirror',
        version: '6.2.4',
        force_default_pose: true,
        is_free_trial: true,
        free_size: true
    }, { headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen } });

    const task = taskRes.data;

    while (true) {
        await new Promise(r => setTimeout(r, 2000));
        const result = (await axios.get(
            `https://be.aimirror.fun/draw/process?draw_request_id=${task.draw_request_id}&uid=${idgen}`,
            { headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen } }
        )).data;

        if (result.draw_status === 'SUCCEED') return result.generated_image_addresses[0];
        if (result.draw_status === 'FAILED') throw new Error('فشل المعالجة');
    }
}

// --- توليد ID عشوائي ---
function genUID() {
    const prefix = 'fe20871';
    let random = '';
    for (let i = 0; i < 9; i++) random += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    return prefix + random;
}
