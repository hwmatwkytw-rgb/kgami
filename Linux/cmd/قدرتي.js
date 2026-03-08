const { getUser, updateUser } = require('../data/user');
const log = require('../logger');
const { styleNum, styleText } = require('../tools')
// تحديد فترة التهدئة بالمللي ثانية (دقيقتان = 2 * 60 * 1000)
const COOLDOWN_TIME_MS = 180 * 1000; 

const POWERS_MAP = {
    // ... (نفس قائمة القدرات دون تغيير) ...
    'معزز': {
        name: "تعزيز القوة",
        description: "زيادة هجوم وصحة المعزز اعتماداً على المستوى.",
        requirements: { level: 10 },
        effects: [
            { stat: "ATK", base: 21, scaling: 2.2 },
            { stat: "HP", base: 60, scaling: 13 }
        ]
    },
    'باعث': {
        name: "درع الطاقة",
        description: "زيادة الدفاع والصحة.",
        requirements: { level: 2 },
        effects: [
            { stat: "DEF", base: 10, scaling: 1.5 },
            { stat: "HP", base: 30, scaling: 10 }
        ]
    },
    'محول': {
        name: "تحويل النين",
        description: "زيادة كبيرة في السرعة والهجوم.",
        requirements: { level: 8 },
        effects: [
            { stat: "SPD", base: 20, scaling: 2.1 },
            { stat: "ATK", base: 10, scaling: 1.8 }
        ]
    },
    'مجسد': {
        name: "تجسيد الروح",
        description: "زيادة الدفاع والذكاء.",
        requirements: { level: 3 },
        effects: [
            { stat: "DEF", base: 30, scaling: 2.5 },
            { stat: "IQ", base: 16, scaling: 1.3 }
        ]
    },
    'متلاعب': {
        name: "تكتيكات السيطرة",
        description: "زيادة الذكاء والسرعة.",
        requirements: { level: 5 },
        effects: [
            { stat: "IQ", base: 12, scaling: 2.3 },
            { stat: "SPD", base: 10, scaling: 2.5 }
        ]
    },
    'متخصص': {
        name: "حالة الذروة – Awakening",
        description: "يدخل حالة ذروة تزيد كل إحصاء بنسبة تعتمد على المستوى.",
        requirements: { level: 5 },
        effects: [
            {
                type: "PEAK_MODE",
                basePercent: 3,
                scalingPercent: 0.8
            }
        ]
    }
};

async function executePowerEngine(senderID, userData, powerConfig) {
    const level = userData.character.level;
    const updates = {};
    let messages = [];

    for (const effect of powerConfig.effects) {
        if (effect.type === "PEAK_MODE") {
            const percent = effect.basePercent + (level * effect.scalingPercent);
            const multiplier = percent / 100;
            const stats = ["ATK", "DEF", "SPD", "IQ", "HP"];

            for (const stat of stats) {
                const original = userData.character[stat] || 0;
                const increase = Math.floor(original * multiplier);
                updates[`character.${stat}`] = original + increase;
                messages.push(`⊳${styleText('stat')} +${styleNum(increase)}`);
            }
            continue;
        }

        const base = effect.base;
        const scaling = effect.scaling;
        const total = base + Math.floor(level * scaling);
        const statKey = `character.${effect.stat}`;
        const current = userData.character[effect.stat] || 0;

        updates[statKey] = current + total;
        messages.push(`⊳${styleText(effect.stat)}  +${styleNum(total)}`);
    }

    // [تعديل 1]: حفظ وقت الاستخدام داخل status بدلاً من character
    // استخدام "status.lastPowerUsed" سيقوم بتحديث هذا الحقل تحديداً أو إنشائه
    updates['status.lastPowerUsed'] = Date.now();

    await updateUser(senderID, updates);
    return messages.join("\n");
}

module.exports = {
    name: "قدرتي",
    otherName: ['قدرتى', 'power'],
    type: ['الالعاب'], 
   cooldown: 0, 
     rank: 0,
    usageCount: 0,
    run: async (api, event, commands, args) => {
        const { threadID, senderID, messageID } = event;

        try {
            const user = await getUser(senderID);
            if (!user || !user.character)
                return api.sendMessage("لا تملك شخصية بعد.", threadID, messageID);

            // [تعديل 2]: ضمان وجود كائن status لتجنب الأخطاء
            user.status = user.status || {};

            const type = user.character.type;
            const config = POWERS_MAP[type];

            if (!config)
                return api.sendMessage("نوع شخصيتك لا يملك قدرة معروفة.", threadID, messageID);

            const lvl = user.character.level;
            if (lvl < config.requirements.level)
                return api.sendMessage(
                    `محتاج تصل مستوي ${styleNum(config.requirements.level)} عشان تستعمل قدرتك`,
                    threadID, messageID 
                );

            // ----------- عرض المعلومات ------------
            if (!args[0] || args[0] === "معلومات") {
                let msg = `──────────\n⊳ ${config.name}\n──────────\n${config.description}\n\n`;
                msg += `⊳ النوع: ${type}\n`;
                msg += `⊳ المستوى المطلوب: ${config.requirements.level}\n`;
                msg += `⊳ الاستخدام: قدرتي تفعيل\n──────────\n`;

                config.effects.forEach(effect => {
                    if (effect.type === "PEAK_MODE") {
                        const percent = effect.basePercent + (lvl * effect.scalingPercent);
                        msg += `⊳ حالة الذروة: زيادة جميع الإحصائيات بنسبة ~${percent.toFixed(1)}%\n`;
                    } else {
                        const total = effect.base + Math.floor(lvl * effect.scaling);
                        msg += `⊳ ${styleText(effect.stat)}: +${styleNum(total)}\n`;
                    }
                });

                return api.sendMessage(msg, threadID, messageID);
            }

            // ----------- تنفيذ القدرة ------------
            if (args[0] !== "تفعيل")
                return api.sendMessage("الاستخدام الصحيح: قدرتي تفعيل", threadID, messageID);

            // ************** التحقق من التهدئة عبر status **************
            // [تعديل 3]: قراءة الوقت من user.status.lastPowerUsed
            const lastUsed = user.status.lastPowerUsed || 0;
            const now = Date.now();
            const timeElapsed = now - lastUsed;

            if (timeElapsed < COOLDOWN_TIME_MS) {
                const timeLeftMS = COOLDOWN_TIME_MS - timeElapsed;
                const seconds = Math.ceil(timeLeftMS / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                
                let timeMsg = "";
                if (minutes > 0) timeMsg += `${styleNum(minutes)} دقيقة`;
                if (remainingSeconds > 0) timeMsg += (minutes > 0 ? " و " : "") + `${remainingSeconds} ثانية`;

                return api.sendMessage(
                    `[فترة تهدئة] \n⊳ يرجى الانتظار: ${timeMsg} لاستخدام قدرتك مرة أخرى.`,
                    threadID, messageID
                );
            }
            // ************** نهاية التحقق **************

            const resultMessage = await executePowerEngine(senderID, user, config);

            return api.sendMessage(`────────\n${resultMessage}\n────────`, threadID, messageID);

        } catch (error) {
            log.error(`[قدرتي] خطأ: ${error.message}`);
            console.error(error); 
            return api.sendMessage("حدث خطأ أثناء تشغيل القدرة.", threadID, messageID) ;
        }
    }
};

