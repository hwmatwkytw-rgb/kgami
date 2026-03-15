const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const log = require('../logger');

const SUPPORTED_DOMAINS = [
    'facebook.com', 'fb.watch',
    'instagram.com',
    'tiktok.com',
    'youtu.be', 'youtube.com'
];

async function downloadVideo(api, event, url) {
    const { threadID, messageID } = event;

    if (!url || !url.startsWith('https://')) {
        return api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ يرجى إدخال رابط صحيح\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, messageID
        );
    }

    const isSupported = SUPPORTED_DOMAINS.some(d => url.includes(d));
    if (!isSupported) {
        return api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ الرابط غير مدعوم!\n✾ ┇ ⸻⸻⸻⸻⸻\n✾ ┇ ✅ المدعومة:\n✾ ┇ ◍ Facebook & TikTok\n✾ ┇ ◍ Instagram & YouTube\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, messageID
        );
    }

    api.setMessageReaction("⌚", messageID, () => {}, true);

    const statusMsg = await new Promise(resolve => {
        api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ 🔎 جاري معالجة الرابط...\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, (err, info) => resolve(info), messageID
        );
    });

    try {
        let apiUrl, downloadKey;

        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            apiUrl = `https://hridoy-apis.vercel.app/downloader/facebook2?url=${encodeURIComponent(url)}&apikey=hridoyXQC`;
            downloadKey = 'video_HD.url';
        } else if (url.includes('instagram.com')) {
            apiUrl = `https://hridoy-apis.vercel.app/downloader/instagram?url=${encodeURIComponent(url)}&apikey=hridoyXQC`;
            downloadKey = 'downloadUrl';
        } else if (url.includes('tiktok.com')) {
            apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        } else if (url.includes('youtu.be') || url.includes('youtube.com')) {
            apiUrl = `https://hridoy-apis.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}&format=1080&apikey=hridoyXQC`;
            downloadKey = 'result.download';
        }

        const response = await axios.get(apiUrl);

        let downloadUrl;
        if (url.includes('tiktok.com')) {
            downloadUrl = response.data.video?.noWatermark || response.data.video?.watermark;
        } else {
            downloadUrl = downloadKey.split('.').reduce((obj, key) => obj && obj[key], response.data);
        }

        if (!downloadUrl) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.editMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ فشل العثور على ملف الفيديو\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                statusMsg.messageID
            );
        }

        const cacheDir = path.join(__dirname, '..', 'cache');
        await fs.ensureDir(cacheDir);
        const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);

        const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 100000 });
        await fs.writeFile(filePath, Buffer.from(videoRes.data));

        const title = response.data.result?.title || response.data.data?.title || response.data.title || 'فيديو ميديا';

        await api.sendMessage({
            body:
                `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
                `✾ ┇\n` +
                `✾ ┇ ⏣ ⟬ تـم الـتـحـمـيـل ✅ ⟭\n` +
                `✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `✾ ┇ 𓋰 العنوان: ${title}\n` +
                `✾ ┇\n` +
                `⏣────── ✾ ⌬ ✾ ──────⏣`,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            api.setMessageReaction("✅", messageID, () => {}, true);
            try { fs.unlinkSync(filePath); } catch (_) {}
            api.unsendMessage(statusMsg.messageID);
        }, messageID);

    } catch (error) {
        log.error('تحميل: ' + error);
        api.setMessageReaction("❌", messageID, () => {}, true);
        if (statusMsg) api.unsendMessage(statusMsg.messageID);
        api.sendMessage(
            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ حدث خطأ أثناء التحميل\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID, messageID
        );
    }
}

module.exports = {
    name: 'تحميل',
    otherName: ['dl', 'download', 'حمل'],
    rank: 0,
    cooldown: 5,
    hide: false,
    prefix: true,
    category: 'media',
    downloadVideo,

    run: async (api, event, commands, args) => {
        const url = args.join(' ').trim();
        await downloadVideo(api, event, url);
    }
};
