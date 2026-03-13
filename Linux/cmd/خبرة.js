const { getUser, updateUser } = require('../data/user');
const skillsData = require('../data/skills');
const { styleNum, styleText } = require('../tools');
const log = require('../logger');

// رموز الزخرفة الموحدة لإبلين
const LINE = "●────── ✾ ⌬ ✾ ──────●";
const BUTTERFLY = "🦋";
const FLOWER = "✾";

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

async function startTurnProcessing(user, api, threadID) {
    user.status = user.status || {};
    let turnMsg = "";
    
    if (user.status.bleedDuration > 0) {
        Utils.applyStat(user.character, "HP", -user.status.bleedDmg);
        turnMsg += `\n${FLOWER} ┇ 🩸 أثر النصل: -${user.status.bleedDmg} صحة.`;
    }
    
    if (user.status.curseDmg) {
        Utils.applyStat(user.character, "HP", -user.status.curseDmg);
        turnMsg += `\n${FLOWER} ┇ 🧪 سم الويسيريا: يتغلغل (-${user.status.curseDmg}).`;
        delete user.status.curseDmg;
    }

    if (user.character.HP <= 0) {
        user.character.HP = 0;
        turnMsg += `\n${FLOWER} ┇ 🥀 لقد سقطت في ميدان المعركة.`;
        api.sendMessage(`${LINE}\n${FLOWER} ┇ ⦿ ⟬ حـالة الـمـحـارب ⟭\n${turnMsg}\n${LINE}`, threadID);
        return false;
    } else if (turnMsg !== "") {
        api.sendMessage(`${LINE}\n${FLOWER} ┇ ⦿ ⟬ تـحديث الـحـالة ⟭\n${turnMsg}\n${LINE}`, threadID);
    }
    return true;
}

function findSkill(user, skillName) {
    const search = skillName.trim().toLowerCase();
    const skills = user.character.skills || [];
    let match = skills.find(s => s.name.toLowerCase().includes(search));
    return { skill: match }; 
}

module.exports = {
    name: "خبرة",
    otherName: ['مهاره', 'skill', 'رقصة'],
    category: "الألعاب", // إضافة القسم
    run: async (api, event) => {
        const args = event.body.trim().split(/\s+/);
        const skillName = args.slice(1).join(' ').trim();
        
        try {
            const senderId = event.senderID;
            if (!skillName) return api.sendMessage(`${FLOWER} ┇ ما هي المهارة التي تود تنفيذها؟`, event.threadID, event.messageID);
            
            const user = await getUser(senderId);
            if (!user?.character) return api.sendMessage(`${FLOWER} ┇ لم تسجل في النظام بعد.`, event.threadID, event.messageID);
            
            const alive = await startTurnProcessing(user, api, event.threadID);
            if (!alive) return await updateUser(senderId, user);
            
            if (user.status.lock > 0) return api.sendMessage(`${FLOWER} ┇ جسدك مقيد.. لا يمكنك الحراك!`, event.threadID, event.messageID);
            
            const { skill } = findSkill(user, skillName);
            if (!skill) return api.sendMessage(`${FLOWER} ┇ لا تملك هذه الخبرة في سجلك.`, event.threadID, event.messageID);

            let target, targetId;
            const selfEffects = ['fullHeal', 'defUP', 'evasion', 'createShield', 'powerXII', 'absoluteCleanse'];
            const requiresTarget = !selfEffects.includes(skill.effect);

            if (requiresTarget) {
                if (!event.messageReply) return api.sendMessage(`${FLOWER} ┇ قم بالرد على رسالة الخصم لتوجيه المهارة.`, event.threadID, event.messageID);
                targetId = event.messageReply.senderID;
                target = await getUser(targetId);
                if (!target?.character) return api.sendMessage(`${FLOWER} ┇ الخصم ليس لديه كيان قتالي.`, event.threadID, event.messageID);
                if (target.character.HP <= 0) return api.sendMessage(`${FLOWER} ┇ الخصم مسحوق بالفعل.`, event.threadID, event.messageID);
            } else {
                target = user; targetId = senderId;
            }

            let resultMsg = "";

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
                    resultMsg = `💥 تـم تـنفيذ ${skill.name}\n${FLOWER} ┇ الـضرر الـناتج: -${styleNum(totalDmg)}`;
                    if (skill.effect === "tripleHitBleed") {
                        target.status.bleedDmg = 60; target.status.bleedDuration = 3;
                        resultMsg += `\n${FLOWER} ┇ الـخصم يـنزف الآن!`;
                    }
                    break;

                case "curse":
                    const curse = Math.floor(Utils.getMaxHP(target.character) * 0.25);
                    target.status.curseDmg = curse;
                    resultMsg = `🧪 تـم تـسميم ${target.character.name}\n${FLOWER} ┇ سيعاني في الدور القادم.`;
                    break;

                case "fullHeal":
                    user.character.HP = Utils.getMaxHP(user.character);
                    resultMsg = `✨ تـم اسـتعادة كـامل الـصحة.`;
                    break;

                default:
                    resultMsg = `✅ تـم تـفعيل ${skill.name} بـنجاح.`;
            }

            if (skill.limitUse !== undefined) {
                skill.limitUse--;
                if (skill.limitUse <= 0) {
                    user.character.skills = user.character.skills.filter(s => s.name !== skill.name);
                }
            }

            let finalOutput = `${LINE}\n`;
            finalOutput += `${FLOWER} ┇ ⦿ ⟬ ${styleText(skill.name)} ⟭\n`;
            finalOutput += `${FLOWER} ┇\n`;
            finalOutput += `${FLOWER} ┇ ◤ الـمـسـتخدم: ${user.character.name}\n`;
            finalOutput += `${FLOWER} ┇ ◤ الـنـتيجة: ${resultMsg}\n`;
            if (skill.limitUse !== undefined) finalOutput += `${FLOWER} ┇ ◤ مـتبقي: ${styleNum(skill.limitUse)} مـرة\n`;
            finalOutput += `${FLOWER} ┇\n`;
            finalOutput += `${LINE}`;

            await updateUser(senderId, user);
            if (targetId !== senderId) await updateUser(targetId, target);
            
            api.sendMessage(finalOutput, event.threadID, event.messageID);

        } catch (err) {
            log.error(err);
            api.sendMessage(`${FLOWER} ┇ حـدث خطأ في تنفيذ الخبرة.`, event.threadID, event.messageID);
        }
    }
};
