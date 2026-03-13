const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = async function autoDownloader(api, event) {
  // نحن دايرين "الرسائل" بس، ما دايرين أحداث الخروج والدخول
  if (event.type !== "message" && event.type !== "message_reply") return;

  const body = event.body;
  if (!body) return;

  // فحص هل النص عبارة عن رابط لمواقع الفيديو المدعومة
  const isURL = /https?:\/\/(www\.)?(facebook|fb|instagram|tiktok|youtube|youtu)\.(com|watch|be|net)/gi.test(body);
  
  if (!isURL) return;

  const SEP = "●───── ✾ ⌬ ✾ ─────●";
  const FLOWER = "✾";

  try {
    let apiUrl = "";
    
    // تحديد الـ API المناسب بناءً على الرابط
    if (body.includes('tiktok.com')) {
      apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(body)}`;
    } else if (body.includes('facebook.com') || body.includes('fb.watch')) {
      apiUrl = `https://hridoy-apis.vercel.app/downloader/facebook2?url=${encodeURIComponent(body)}&apikey=hridoyXQC`;
    } else if (body.includes('instagram.com')) {
      apiUrl = `https://hridoy-apis.vercel.app/downloader/instagram?url=${encodeURIComponent(body)}&apikey=hridoyXQC`;
    } else if (body.includes('youtu.be') || body.includes('youtube.com')) {
      apiUrl = `https://hridoy-apis.vercel.app/downloader/ytmp4?url=${encodeURIComponent(body)}&format=720&apikey=hridoyXQC`;
    }

    if (!apiUrl) return;

    // تفاعل الساعة لبدء المعالجة
    api.setMessageReaction("🧭", event.messageID, () => {}, true);

    const res = await axios.get(apiUrl);
    let downloadUrl;

    // استخراج الرابط المباشر حسب نوع الموقع
    if (body.includes('tiktok.com')) {
      downloadUrl = res.data.video?.noWatermark || res.data.video?.watermark;
    } else if (body.includes('instagram.com')) {
      downloadUrl = res.data.downloadUrl;
    } else if (body.includes('facebook.com')) {
      downloadUrl = res.data.video_HD?.url || res.data.video_SD?.url;
    } else if (body.includes('youtube.com') || body.includes('youtu.be')) {
      downloadUrl = res.data.result?.download;
    }

    if (!downloadUrl) return;

    // مسار حفظ الفيديو المؤقت
    const cacheDir = path.join(process.cwd(), 'cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

    // تحميل ملف الفيديو
    const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(filePath, Buffer.from(videoRes.data));

    // إرسال الفيديو بزقرة إبلين
    await api.sendMessage({
      body: `${SEP}\n   ✾ ┇ ⦿ ⟬ تـم الـتـحـمـيـل ✅ ⟭\n${SEP}\n✨ "مشاهدة ممتعة مع " ✨`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, event.messageID);

  } catch (err) {
    // لا نرسل رسالة خطأ في التحميل التلقائي عشان ما نزعج الناس لو الرابط غلط
    console.error("AutoDownloader Error: ", err.message);
  }
};
