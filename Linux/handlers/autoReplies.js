const { getReply } = require("../data/replice.js");
const config = require("../config.json");

async function handleAutoReplies(api, event) {
  const { threadID, messageID } = event;
  if (!event.body) return false;
  const react = event.body.toLowerCase();
  const body = event.body.trim();
  if (config.REACT) {
    if (
      react.includes("ضحك") ||
      react.includes("حش الضحك") ||
      react.includes("امك") ||
      react.includes("كيكة") ||
      react.includes("منفسك") || react.includes("😂") ||
      react.includes("😩") ||
      react.includes("😆") ||
      react.includes("وزع") ||
      react.includes("حشك") ||
      react.includes("shit") ||
      react.includes("لول") ||
      react.includes("شحدتك") ||
      react.includes("اسرة") ||
      react.includes("واي") ||
      react.includes("خروف") ||
      react.includes("الشتاء") ||
      react.includes("زوجة") ||
      react.includes("bts") ||
      react.includes("الوان") ||
      react.includes("الرجفة") ||
      react.includes("ركز") ||
      react.includes("بانكاي") ||
      react.includes("حشو") ||
      react.includes("زعل") ||
      react.includes("سواقة") ||
      react.includes("خالة") ||
      react.includes("🤐") ||
      react.includes("🫶") ||
      react.includes("🙂") ||
      react.includes("😹") ||
      react.includes("🤣") ||
      react.includes("مياو") ||
      react.includes("نفسي") ||
      react.includes("اديني") ||
      react.includes("شيت") ||
      react.includes("حشوك") ||
      react.includes("fuck") ||
      react.includes("fuck you") ||
      react.includes("sapak") ||
      react.includes("Sapak") ||
      react.includes("bold") ||
      react.includes("Bold") ||
      react.includes("am") ||
      react.includes("nan") ||
      react.includes("Am") ||
      react.includes("bisaya") ||
      react.includes("gagi") ||
      react.includes("الضحك") ||
      react.includes("🖕") ||
      react.includes("🤢") ||
      react.includes("😝") ||
      react.includes("صيص") ||
      react.includes("hayop") ||
      react.includes("nigga") ||
      react.includes("Nigga") ||
      react.includes("script kiddie") ||
      react.includes("trash") ||
      react.includes("Hayop") ||
      react.includes("Hayup") ||
      react.includes("kagagohan") ||
      react.includes("kagaguhan") ||
      react.includes("Nan") ||
      react.includes("kingina") ||
      react.includes("Kingina") ||
      react.includes("KINGINA") ||
      react.includes("hindot") ||
      react.includes("jesus") ||
      react.includes("Jesus") ||
      react.includes("jesos") ||
      react.includes("Jesos") ||
      react.includes("abno") ||
      react.includes("Abno") ||
      react.includes("Script kiddie") ||
      react.includes("lmao") ||
      react.includes("Lmao") ||
      react.includes("LMAO") ||
      react.includes("xd") ||
      react.includes("Xd") ||
      react.includes("XD") ||
      react.includes("biot") ||
      react.includes("Biot") ||
      react.includes("bayot") ||
      react.includes("هاها") ||
      react.includes("اضحكني") ||
      react.includes("كلكني") ||
      react.includes("bakla") ||
      react.includes("نكم") ||
      react.includes("نكمك") ||
      react.includes("اسود") ||
      react.includes("poor") ||
      react.includes("زرقو")
    ) {
      api.setMessageReaction("😆", event.messageID);
    }
    if (
      react.includes("بوسة") ||
      react.includes("اه") ||
      react.includes("ااه") ||
      react.includes("حبك") ||
      react.includes("احبك") ||
      react.includes("احشك") ||
      react.includes("😊") ||
      react.includes("💋") ||
      react.includes("🫶") ||
      react.includes("حشني") ||
      react.includes("الزبير") ||
      react.includes("شفتو ؟") ||
      react.includes("خمسين") ||
      react.includes("50") ||
      react.includes("جوكس") ||
      react.includes("kiss") ||
      react.includes("راسي") ||
      react.includes("امك") ||
      react.includes("اقعد") ||
      react.includes("😗") ||
      react.includes("😙") ||
      react.includes("😘") ||
      react.includes("😚") ||
      react.includes("ugh") ||
      react.includes("Ugh") ||
      react.includes("sige pa")
    ) {
      api.setMessageReaction("🙂", event.messageID);
    }
    if (
      react.includes("sakit") ||
      react.includes("مكسل") ||
      react.includes("طردوني") ||
      react.includes("امتحان") ||
      react.includes("مدرسة") ||
      react.includes("مريض") ||
      react.includes("عيان") ||
      react.includes("ما منشط") ||
      react.includes("انتهي") ||
      react.includes("مافي") ||
      react.includes("قطعت") ||
      react.includes("اتوفي") ||
      react.includes("اتوفت") ||
      react.includes("ماتت") ||
      react.includes("حزن") ||
      react.includes("sad") ||
      react.includes("زهجانة") ||
      react.includes("زهجان") ||
      react.includes("😿") ||
      react.includes(" 😥") ||
      react.includes("😰") ||
      react.includes("😨") ||
      react.includes("😢") ||
      react.includes(":(") ||
      react.includes("😔") ||
      react.includes("😞")) {
      api.setMessageReaction("😢", event.messageID);
    }
    if (
      react.includes("سينكو") ||
      react.includes("الصلاة") ||
      react.includes("صلو") ||
      react.includes("الدعاء") ||
      react.includes("وسكي") ||
      react.includes("السعودية") ||
      react.includes("evening") ||
      react.includes("eat") ||
      react.includes("Eat") ||
      react.includes("night") || react.includes("كيومي") ||
      react.includes("Night") ||
      react.includes("ويسكي")
    ) {
      api.setMessageReaction("🖤", event.messageID);
    }
  }
  // الردود التلقائية من الملف الخارجي
  const reply = await getReply(body);
  if (reply) {
    api.sendMessage(reply.response, event.threadID, event.messageID);
    return true
  } else {
    return false
  }
  
  
}

module.exports = handleAutoReplies;
