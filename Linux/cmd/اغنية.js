const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');

if (!global.songReplies) global.songReplies = new Map();

module.exports = {
    name: 'اغنية',
    otherName: ['song', 'music', 'موسيقى'],
    rank: 0,
    cooldown: 5,
    hide: false,
    prefix: true,
    category: 'الوسائط ',

    run: async (api, event, commands, args) => {
        const { threadID, messageID, senderID, messageReply } = event;

        // --- معالجة الرد على قائمة الأغاني ---
        if (messageReply && global.songReplies.has(messageReply.messageID)) {
            const replyData = global.songReplies.get(messageReply.messageID);

            if (replyData.author !== senderID) return;

            const choice = parseInt((event.body || '').trim());
            if (isNaN(choice) || choice < 1 || choice > replyData.results.length) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ركز.. قلت ليك رقم من 1 لـ ${replyData.results.length} 🙄\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }

            global.songReplies.delete(messageReply.messageID);

            const loading = await api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 📥 جاري التحميل.. أصبر شوية ما تطير 🥱\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID
            );

            try {
                const selected = replyData.results[choice - 1];
                const downloadRes = await axios.get(`${replyData.baseUrl}/ytDl3?link=${selected.id}&format=mp3`);

                const cachePath = path.join(__dirname, '..', 'cache');
                if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

                const filePath = path.join(cachePath, `music_${senderID}.mp3`);

                const response = await axios({
                    method: 'get',
                    url: downloadRes.data.downloadLink,
                    responseType: 'arraybuffer'
                });

                fs.writeFileSync(filePath, Buffer.from(response.data));

                await api.sendMessage({
                    body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🎵 هاك أغنيتك:\n✾ ┇ 📌 ${selected.title}\n✾ ┇ ⏱️ ${selected.time}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    attachment: fs.createReadStream(filePath)
                }, threadID, () => {
                    try { fs.unlinkSync(filePath); } catch (_) {}
                }, messageID);

                api.unsendMessage(loading.messageID);
            } catch (e) {
                log.error('اغنية onReply: ' + e);
                api.unsendMessage(loading.messageID);
                api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ الملف كبير شديد.. ما قدرت أحمله 😒\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }
            return;
        }

        // --- البحث عن أغنية ---
        const query = args.join(' ').trim();

        if (!query) {
            return api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🎶 دايرة أغني ليك في إذنك؟\n✾ ┇ اكتب اسم الأغنية يا  🙄\n✾ ┇\n✾ ┇ مثال: اغنية طوز\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );
        }

        const infoMsg = await api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🔍 لحظه من وقتك... 🥱\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, messageID
        );

        try {
            const getApi = await axios.get('https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json');
            const baseUrl = getApi.data.api;

            const searchRes = await axios.get(`${baseUrl}/ytFullSearch?songName=${encodeURIComponent(query)}`);
            const results = searchRes.data.slice(0, 6);

            if (!results || results.length === 0) {
                return api.editMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 😒 ما لقيت شي..\n✾ ┇ غايتو ذوقك ده إلا في سوق الجمعة\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    infoMsg.messageID
                );
            }

            let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🎶 نتائج البحث:\n✾ ┇ ⸻⸻⸻⸻⸻\n`;

            for (let i = 0; i < results.length; i++) {
                msg += `✾ ┇ ${i + 1}. ${results[i].title}\n✾ ┇    ⏱️ ${results[i].time}\n`;
                if (i < results.length - 1) msg += `✾ ┇ ⸻⸻⸻⸻⸻\n`;
            }

            msg += `✾ ┇\n✾ ┇ 🔢 رد برقم الأغنية عشان أحملها ليك 🥱\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`;

            api.editMessage(msg, infoMsg.messageID);

            global.songReplies.set(infoMsg.messageID, {
                author: senderID,
                results,
                baseUrl
            });

            // حذف البيانات بعد دقيقتين تلقائياً
            setTimeout(() => {
                global.songReplies.delete(infoMsg.messageID);
            }, 120000);

        } catch (e) {
            log.error('اغنية onStart: ' + e);
            api.editMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 😒 السيرفر قرف من أغانيك وضرب..\n✾ ┇ جرب تاني يا وهم\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                infoMsg.messageID
            );
        }
    }
};
