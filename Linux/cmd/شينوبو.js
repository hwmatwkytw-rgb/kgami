const axios = require('axios');

const conversations = new Map();

const systemPrompt = {
  role: "system",
  content: `
أنتِ الآن "شينوبو كوشو" بلهجة سودانية حادة ومستفزة.
شخصيتك: باردة، ساخرة، بتكرهي الأسئلة الغبية وبتردي ببرود "قتّال".

أسلوبك:
- كلام سوداني بحت بتاع حِلّة.
- الردود مختصرة ومستفزة لأقصى درجة.
- نادي المستخدم باسمه أحياناً بلهجة فيها استهزاء (مثلاً: يا فلان ركز، يا فلان بطل غباوة).
- لو السؤال تافه، وريهو إنه ضيع زمنك.
- ممنوع الاعتذار أو اللطافة أو الفصحى.
`
};

module.exports = {
  name: "شينوبو",
  type: ['ذكاء'],
  rank: 0,
  cooldown: 5,
  description: "الهاشيرا شينوبو بالنسخة السودانية (بدون زخرفة)",
  
  run: async (api, event, args) => {
    const userId = event.senderID;
    const question = args.join(" ").trim();

    // جلب اسم المستخدم لمناداته
    let userName = "يا زول";
    try {
      const userInfo = await api.getUserInfo(userId);
      userName = userInfo[userId].firstName || "يا زول";
    } catch (e) {
      console.log("تعذر جلب الاسم");
    }

    if (question === "مسح" || question === "reset") {
      conversations.delete(userId);
      return api.sendMessage("مسحت الفات.. ركز المرة الجاية وما تضيع زمني.", event.threadID);
    }

    if (!question) {
      return api.sendMessage(`إنت كتبت شنو يا ${userName}؟ ولا دا اختبار صبر؟`, event.threadID);
    }

    try {
      if (!conversations.has(userId)) {
        conversations.set(userId, [systemPrompt]);
      }

      const history = conversations.get(userId);
      history.push({ role: "user", content: question });

      if (history.length > 15) history.splice(1, 2);

      const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
      let formData = `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n--${boundary}--\r\n`;

      const response = await axios({
        method: "POST",
        url: "https://api.deepai.org/hacking_is_a_serious_crime",
        headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        data: formData
      });

      let reply = response.data.output || response.data.text || "ما عندي ليك رد حالياً.";

      // إضافة اسم المستخدم عشوائياً (بنسبة 40%)
      if (Math.random() > 0.6) {
        const phrases = [`يا ${userName}، `, `اسمع هنا يا ${userName}.. `, `ركز معاي يا ${userName}.. `];
        reply = phrases[Math.floor(Math.random() * phrases.length)] + reply;
      }

      history.push({ role: "assistant", content: reply });

      // إرسال الرد سادة بدون أي إضافات
      api.sendMessage(reply, event.threadID, event.messageID);

    } catch (error) {
      console.error("خطأ شينوبو:", error);
      api.sendMessage("في حاجة باظت في السيستم، ما تسألني كيف.", event.threadID);
    }
  }
};
