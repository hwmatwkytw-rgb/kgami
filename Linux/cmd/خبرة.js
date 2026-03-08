const { getUser, updateUser } = require('../data/user');
const skillsData = require('../data/skills');
const { styleNum, styleText } = require('../tools');

// رموز الزخرفة الخاصة بشينوبو
const LINE = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";
const BUTTERFLY = "🦋";
const FLOWER = "✿";

const Utils = {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    getMaxHP: (char) => Number(char.XHP) || Number(char.HP) || 1,
    applyStat: (obj, stat, value, multiply = false) => {
        if (!obj[stat]) obj[stat] = 0;
        if (multiply) obj[stat] = Math.floor(obj[stat] * value);
        else obj[stat] = Math.floor(obj[stat] + value);
        if (obj[stat] < 0) obj[stat] = 0;
    }
};

// حساب الضرر بلمسة "نفس الحشرة"
const calculateDamage = (userChar, targetChar, skillData, skillEffect) => {
    const minDmg = skillData.dmg.min || 0;
    const maxDmg = skillData.dmg.max || 0;
    let baseDmg = Utils.rand(minDmg, maxDmg);
    
    const iqBonus = Math.floor((userChar.IQ || 0) / 20);
    const atkBonus = Math.floor(userChar.ATK / 10);
    let finalDmg = baseDmg + atkBonus + iqBonus;
    let effectiveDEF = targetChar.DEF;

    const ignoreDefEffects = ["pureDamage", "ultimatePureDmg", "randMultiHit", "multiHit", "bypassShield", "loseATKHP", "skillCountDmg", "maxHPPercentDamage"];
    if (ignoreDefEffects.includes(skillEffect)) effectiveDEF = 0;
    
    if (skillEffect === "maxHPPercentDamage") return Math.max(1, Math.floor(Utils.getMaxHP(targetChar) * 0.35));
    if (skillEffect === "touchDmg") return Math.floor(Math.max(0, userChar.ATK - targetChar.DEF) * 1.5) + 50;

    if (effectiveDEF > 0) finalDmg = finalDmg - Math.floor(effectiveDEF / 5);
    return Math.max(1, finalDmg);
};

// معالجة بداية الدور (تأثير السموم والنزيف)
async function startTurnProcessing(user, api, threadID) {
    user.status = user.status || {};
    let turnMsg = "";
    
    if (user.status.bleedDuration > 0) {
        Utils.applyStat(user.character, "HP", -user.status.bleedDmg);
        turnMsg += `\n${BUTTERFLY} ${FLOWER} أثر النصل: خسارة ${user.status.bleedDmg} من الصحة.`;
    }
    
    if (user.status.curseDmg) {
        Utils.applyStat(user.character, "HP", -user.status.curseDmg);
        turnMsg += `\n${BUTTERFLY} 🧪 سم الويسيريا: يتغلغل في الجسد (-${user.status.curseDmg}).`;
        delete user.status.curseDmg;
    }

    if (user.character.HP <= 0) {
        user.character.HP = 0;
        turnMsg += `\n${BUTTERFLY} 🥀 لقد فارقت الحياة قبل أن تبدأ رقصتك.`;
        api.sendMessage(`${LINE}\n${BUTTERFLY} حـالـة الـمـحـارب (${user.character.name}):${turnMsg}\n${LINE}`, threadID);
        return false;
    } else if (turnMsg !== "") {
        api.sendMessage(`${LINE}\n${BUTTERFLY} حـالـة ${user.character.name}:${turnMsg}\n${LINE}`, threadID);
    }
    return true;
}

// دالة البحث عن مهارة (نفس المنطق السابق مع تحسين المخرجات)
function findSkill(user, skillName) {
    const search = skillName.trim().toLowerCase();
    const skills = user.character.skills;
    let match = skills.find(s => s.name.toLowerCase().includes(search));
    return { skill: match, suggestion: null }; 
}

module.exports = {
    name: "خبرة",
    otherName: ['مهاره', 'skill', 'رقصة'],
    run: async (api, event) => {
        const args = event.body.trim().split(/\s+/);
        const skillName = args.slice(1).join(' ').trim();
        
        try {
            const senderId = event.senderID;
            if (!skillName) return api.sendMessage(`${BUTTERFLY} | ما هي الرقصة التي تودين تنفيذها؟`, event.threadID, event.messageID);
            
            const user = await getUser(senderId);
            if (!user?.character) return api.sendMessage(`${BUTTERFLY} | لم تسجلي في فيلق قتلة الشياطين بعد.`, event.threadID, event.messageID);
            
            const alive = await startTurnProcessing(user, api, event.threadID);
            if (!alive) return await updateUser(senderId, user);
            
            if (user.status.lock > 0) return api.sendMessage(`${BUTTERFLY} | جسدكِ مقيد بخيوط العنكبوت.. لا يمكنكِ الحراك!`, event.threadID, event.messageID);
            
            const { skill } = findSkill(user, skillName);
            if (!skill) return api.sendMessage(`${BUTTERFLY} | لا تملكين هذا الفن من فنون التنفس.`, event.threadID, event.messageID);

            // تحديد الهدف
            let target, targetId;
            const selfEffects = ['fullHeal', 'defUP', 'evasion', 'createShield', 'powerXII', 'absoluteCleanse'];
            const requiresTarget = !selfEffects.includes(skill.effect);

            if (requiresTarget) {
                if (!event.messageReply) return api.sendMessage(`${BUTTERFLY} | حددي الخصم الذي ستوجهين له نصلكِ.`, event.threadID, event.messageID);
                targetId = event.messageReply.senderID;
                target = await getUser(targetId);
                if (!target?.character) return api.sendMessage(`${BUTTERFLY} | الخصم ليس لديه كيان.`, event.threadID, event.messageID);
                if (target.character.HP <= 0) return api.sendMessage(`${BUTTERFLY} | الخصم قد سحق بالفعل.. أرِح نصلك.`, event.threadID, event.messageID);
            } else {
                target = user; targetId = senderId;
            }

            let msg = `${LINE}\n${BUTTERFLY} نـفـس الـحـشـرة: ${skill.name}\n${FLOWER} الـمـسـتـخدم: ${user.character.name}\n`;

            // تنفيذ التأثيرات (Switch)
            switch (skill.effect) {
                case "damage":
                case "multiHit":
                case "tripleHitBleed":
                    let hits = skill.effect === "multiHit" ? 5 : (skill.effect === "tripleHitBleed" ? 3 : 1);
                    let totalDmg = 0;
                    for (let i = 0; i < hits; i++) {
                        let dmg = calculateDamage(user.character, target.character, skill, skill.effect);
                        totalDmg += dmg;
                    }
                    Utils.applyStat(target.character, "HP", -totalDmg);
                    msg += `\n${BUTTERFLY} رقصة مائة زهرة: -${styleNum(totalDmg)} ضرر.`;
                    if (skill.effect === "tripleHitBleed") {
                        target.status.bleedDmg = 60; target.status.bleedDuration = 3;
                        msg += `\n${FLOWER} لقد أصبتِ نقاطه الحيوية.. إنه ينزف!`;
                    }
                    break;

                case "curse":
                    const curse = Math.floor(Utils.getMaxHP(target.character) * 0.25);
                    target.status.curseDmg = curse;
                    msg += `\n🧪 | تم غرس نصل مسموم في جسد ${target.character.name}.`;
                    break;

                case "fullHeal":
                    user.character.HP = Utils.getMaxHP(user.character);
                    msg += `\n✨ | تم استعادة القوى بفضل مصل العلاج الخاص.`;
                    break;

                case "evasion":
                    user.status.evasion = true;
                    msg += `\n🦋 | سرعة الفراشة: ستتلاشى حركتكِ أمام هجوم الخصم القادم.`;
                    break;

                default:
                    msg += `\n${FLOWER} تم تفعيل مهارة ${skill.name} بنجاح.`;
            }

            // تحديث عدد الاستخدامات
            if (skill.limitUse !== undefined) {
                skill.limitUse--;
                if (skill.limitUse <= 0) {
                    user.character.skills = user.character.skills.filter(s => s.name !== skill.name);
                    msg += `\n${LINE}\n🥀 | لقد استنفدتِ كل طاقة هذه المهارة.`;
                } else {
                    msg += `\n[ متبقي: ${skill.limitUse} ]`;
                }
            }

            if (target.character.HP <= 0) msg += `\n${BUTTERFLY} "أرقد بسلام.. الموت هو مجرد بداية لرحلة جديدة."`;

            await updateUser(senderId, user);
            if (targetId !== senderId) await updateUser(targetId, target);
            
            api.sendMessage(styleText(msg), event.threadID, event.messageID);

        } catch (err) {
            console.error(err);
            api.sendMessage(`${BUTTERFLY} | حدث اضطراب في مصل المهارات..`, event.threadID, event.messageID);
        }
    }
};
