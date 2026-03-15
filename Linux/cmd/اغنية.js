const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'اغنية',
  otherName: ['song', 'سمعني', 'أغنية'],
  category: 'الوسائط ',
  rank: 0, 
  cooldown: 10,
  description: 'تحميل الأغاني من يوتيوب بستايل إبلين',

  handleReply: async ({ api, event, handleReply }) => {
    const { threadID, messageID, body, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";

    if (handleReply.author != senderID) return;

    try {
      const choice = parseInt(body);
      if (isNaN(choice) || choice > handleReply.result.length || choice <= 0) {
        return api.sendMessage(`${FLOWER} ┇ ركـز يا هـم.. قـلـت لـيك رقـم مـن الـقائمة 🙄`, threadID, messageID);
      }

      api.unsendMessage(handleReply.messageID);
      const loading = await api.sendMessage(`${FLOWER} ┇ جـاري تـجهيز الأغـنـية.. أصـبـر شـوية 📥🥱`, threadID);

      const selected = handleReply.result[choice - 1];
      const downloadRes = await axios.get(`${handleReply.baseUrl}/ytDl3?link=${selected.id}&format=mp3`);
      
      const filePath = path.join(process.cwd(), 'cache', `music_${Date.now()}.mp3`);
      await fs.ensureDir(path.dirname(filePath));

      const response = await axios({
        method: 'get',
        url: downloadRes.data.downloadLink,
        responseType: 'arraybuffer'
      });

      await fs.writeFile(filePath, Buffer.from(response.data));

      const msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ تـم الـتـحـمـيـل ✅ ⟭\n${FLOWER} ┇\n${FLOWER} ┇ الـعـنـوان: ${selected.title}\n${FLOWER} ┇ سـجـمـك مـا تـسـمـعها عـالـي! 💅😒\n${SEP}`;

      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

      api.unsendMessage(loading.messageID);

    } catch (e) {
      api.sendMessage(`${FLOWER} ┇ الـمـلـف كـبـيـر شـديـد عـلـى وشـك ده.. مـا قـدرت أحـمـلـه 😒`, threadID, messageID);
    }
  },

  run: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const SEP = "●───── ✾ ⌬ ✾ ─────●";
    const FLOWER = "✾";
    const query = args.join(' ').trim();

    if (!query) return api.sendMessage(`${FLOWER} ┇ أكـتـب اسـم الأغـنـية يـا وهـم 🙄`, threadID, messageID);

    const infoMsg = await api.sendMessage(`${FLOWER} ┇ لـحـظـه مـن وقـتـك.. جـاري الـبـحث 🥱`, threadID, messageID);

    try {
      const getApi = await axios.get(`https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json`);
      const baseUrl = getApi.data.api;

      const searchRes = await axios.get(`${baseUrl}/ytFullSearch?songName=${encodeURIComponent(query)}`);
      const results = searchRes.data.slice(0, 6);

      if (results.length === 0) return api.editMessage(`${FLOWER} ┇ مـا لـقـيت شـي.. ذوقـك ده نـاشـف 😒`, infoMsg.messageID);

      let msg = `${SEP}\n${FLOWER} ┇ ⦿ ⟬ نـتـائج الـبـحث 🎶 ⟭\n${FLOWER} ┇\n`;
      results.forEach((res, i) => {
        msg += `${FLOWER} ┇ ⟬ ${i + 1} ⟭ ${res.title}\n${FLOWER} ┇ ⏱️ الـزمن: ${res.time}\n`;
        if (i < results.length - 1) msg += `${FLOWER} ┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
      });
      msg += `${FLOWER} ┇\n${SEP}\n${FLOWER} ┇ رد بـرقـم الأغـنـية لـلـتـحـمـيـل.. 🥱`;

      api.editMessage(msg, infoMsg.messageID);

      global.client.handleReply.push({
        name: 'اغنية',
        messageID: infoMsg.messageID,
        author: senderID,
        result: results,
        baseUrl: baseUrl
      });

    } catch (error) {
      api.editMessage(`${FLOWER} ┇ الـسيرفر ضرب.. جرب تاني 😒`, infoMsg.messageID);
    }
  }
};
