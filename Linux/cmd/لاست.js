const log = require('../logger');

const DEVELOPER_ID = "61588108307572";

if (!global.lastReplies) global.lastReplies = new Map();

module.exports = {
    name: 'لاست',
    otherName: ['last', 'ls', 'مجموعات'],
    rank: 2,
    cooldown: 15,
    hide: false,
    prefix: true,
    category: 'المطور',

    run: async (api, event, commands, args) => {
        const { threadID, messageID, senderID, messageReply } = event;

        // --- معالجة الرد ---
        if (messageReply && global.lastReplies.has(messageReply.messageID)) {
            const replyData = global.lastReplies.get(messageReply.messageID);

            if (replyData.author !== senderID) return;
            if (senderID !== DEVELOPER_ID) {
                return api.setMessageReaction("🚯", messageID, () => {}, true);
            }

            const parts = (event.body || '').trim().split(/\s+/);
            const action = parts[0];
            const index = parseInt(parts[1]) - 1;

            if (isNaN(index) || index < 0 || index >= replyData.groupIds.length) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ رقم المجموعة غير صحيح!\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }

            const targetID = replyData.groupIds[index];

            if (action === "خروج" || action === "غادر") {
                api.removeUserFromGroup(api.getCurrentUserID(), targetID, (err) => {
                    if (err) {
                        return api.sendMessage(
                            `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ فشل الخروج من المجموعة:\n✾ ┇ 🆔 ${targetID}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                            threadID, messageID
                        );
                    }
                    api.sendMessage(
                        `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ✅ تم الخروج من المجموعة بنجاح!\n✾ ┇ 🆔 ${targetID}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                        threadID, messageID
                    );
                });
            } else if (action === "حظر") {
                api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ✅ تم تسجيل حظر المجموعة:\n✾ ┇ 🆔 ${targetID}\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            } else {
                api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ أمر غير معروف!\n✾ ┇ استخدم: خروج [رقم] أو حظر [رقم]\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }
            return;
        }

        // --- عرض قائمة المجموعات ---
        if (senderID !== DEVELOPER_ID) {
            return api.setMessageReaction("🚯", messageID, () => {}, true);
        }

        try {
            const inbox = await api.getThreadList(100, null, ["INBOX"]);
            const groups = inbox.filter(g => g.isGroup && g.isSubscribed);

            if (groups.length === 0) {
                return api.sendMessage(
                    `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⚠️ البوت ليس عضواً في أي مجموعة حالياً.\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                    threadID, messageID
                );
            }

            let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ⏣ ⟬ قـائمة المجمـوعات (${groups.length}) ⟭\n✾ ┇ ⸻⸻⸻⸻⸻\n`;

            const groupIds = [];

            groups.forEach((g, i) => {
                const gName = g.name || "بدون اسم";
                msg += `✾ ┇  الرقم: ${i + 1}\n`;
                msg += `✾ ┇  الاسم: ${gName}\n`;
                msg += `✾ ┇  ID: ${g.threadID}\n`;
                if (i < groups.length - 1) msg += `✾ ┇ ⸻⸻⸻⸻⸻\n`;
                groupIds.push(g.threadID);
            });

            msg += `✾ ┇\n✾ ┇ ⏳ رد بـ (خروج [رقم]) أو (حظر [رقم])\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`;

            api.sendMessage({ body: msg }, threadID, (err, info) => {
                if (err) return log.error('لاست sendMessage: ' + err);
                global.lastReplies.set(info.messageID, {
                    author: senderID,
                    groupIds
                });
                setTimeout(() => {
                    global.lastReplies.delete(info.messageID);
                }, 120000);
            }, messageID);

        } catch (err) {
            log.error('لاست: ' + err);
            api.sendMessage(
                `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇\n✾ ┇ ❌ حدث خطأ أثناء جلب القائمة.\n✾ ┇\n⏣────── ✾ ⌬ ✾ ──────⏣`,
                threadID, messageID
            );
        }
    }
};
