const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = async function autoDownloader(api, event) {
  // الفحص الأساسي
  if (event.type !== "message" && event.type !== "message_reply") return;
  const body = event.body;
  if (!body) return;

  // فحص الرابط (Regex)
  const isURL = /https?:\/\/(www\.)?(facebook|fb|instagram|tiktok|youtube|youtu|reels)\.(com|watch|be|net|plus)/gi.test(body);
  if (!isURL) return;

  const SEP = "●───── ✾ ⌬ ✾ ─────●";
  const FLOWER = "✾";

  try {
    let downloadUrl = "";
    
    // التفاعل لبدء المعالجة
    api.setMessageReaction("🧭", event.messageID, (err) => {}, true);

    // ---------------------------------------------------------
    // واستخدام API بديل سريع ومجاني (SnapSave/AIO) 🎯
    // ---------------------------------------------------------
    // ملاحظة: الـ APIs المجانية بتضرب أحياناً، يفضل دائماً تجربة رابط hridoy لو لسه شغال
    
    let apiUrl = `https://api.samir.xyz/download/aio?url=${encodeURIComponent(body)}`;
    const res = await axios.get(apiUrl);
    
    // استخراج الرابط (المنطق ده بيعتمد على Samir API كمثال مستقر)
    if (res.data && res.data.result) {
      downloadUrl = res.data.result.url || res.data.result.video;
    }

    if (!downloadUrl) {
       // محاولة ثانية بـ API الاحتياطي بتاعك لو الأول فشل
       const res2 = await axios.get(`https://hridoy-apis.vercel.app/downloader/facebook2?url=${encodeURIComponent(body)}&apikey=hridoyXQC`);
       downloadUrl = res2.data.video_HD?.url || res2.data.video_SD?.url || res2.data.downloadUrl;
    }

    if (!downloadUrl) return;

    // تجهيز الملف
    const cacheDir = path.join(process.cwd(), 'cache');
    await fs.ensureDir(cacheDir);
    const filePath = path.join(cacheDir, `eblin_${Date.now()}.mp4`);

    const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    
    // فحص الحجم (لو أكبر من 25MB فيسبوك ما حيسمح بإرساله)
    if (videoRes.data.length > 26214400) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(`✾ ┇ الـفيديو حـجمه كـبير جـداً لـلإرسـال!`, event.threadID, event.messageID);
    }

    await fs.writeFile(filePath, Buffer.from(videoRes.data));

    // الإرسال بستايل إبلين
    await api.sendMessage({
      body: `${SEP}\n   ✾ ┇ ⦿ ⟬ تـم الـتـحـمـيـل ✅ ⟭\n${SEP}\n✨ مـشـاهـدة مـمـتـعـة مـع إبلـيـن ✨`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      api.setMessageReaction("✅", event.messageID, (err) => {}, true);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, event.messageID);

  } catch (err) {
    console.error("AutoDownloader Error: ", err.message);
  }
};
