const mongoose = require("mongoose");
const log = require("../logger");

const replySchema = new mongoose.Schema({
  trigger: { type: String, unique: true },  // نص الرسالة المسببة للرد
  response: { type: String }                // الرد المرسل
});

const Reply = mongoose.model("Reply", replySchema);

async function addReply(trigger, response) {
  try {
    const reply = new Reply({ trigger, response });
    await reply.save();
    log.info(`add reply: "${trigger}"`);
    return reply;
  } catch (error) {
    log.error(`❌ خطأ عند حفظ الرد: ${error}`);
    throw error;
  }
}

async function removeReply(trigger) {
  try {
    const deleted = await Reply.findOneAndDelete({ trigger });
    if (!deleted) throw new Error("❌ الرد غير موجود");
    log.info(`delte "${trigger}"`);
    return deleted;
  } catch (error) {
    log.error(error);
    throw error;
  }
}

async function getReply(trigger) {
  try {
    return await Reply.findOne({ trigger });
  } catch (error) {
    log.error(error);
    return null;
  }
}

async function getAllReplies() {
  try {
    return await Reply.find();
  } catch (error) {
    log.error(error);
    return [];
  }
}

module.exports = { addReply, removeReply, getReply, getAllReplies };
