const { getUser, updateUser } = require('../data/user');
// تأكد من أن مسار المهارات صحيح
const skillsData = require('../data/skills'); // تم تغيير الاسم لتجنب التعارض
const { styleNum, styleText } = require('../tools')
const LINE = "────────";
const ARROW = "⊳";

// ==========================================
// دوال مساعدة (Utils)
// ==========================================

const applyStat = (obj, stat, value, multiply = false) => {
    if (!obj[stat]) obj[stat] = 0;
    
    if (multiply) obj[stat] = Math.floor(obj[stat] * value);
    else obj[stat] = Math.floor(obj[stat] + value);
    
    if (obj[stat] < 0) obj[stat] = 0;
};

const getMaxHP = (char) => {
    // نستخدم XHP إذا كان موجودًا، وإلا نستخدم HP الحالي كحد أقصى مبدئيًا
    return Number(char.XHP) || Number(char.HP) || 1;
};

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// دالة حساب الضرر
const calculateDamage = (userChar, targetChar, skillData, skillEffect) => {
    const minDmg = skillData.dmg.min || 0;
    const maxDmg = skillData.dmg.max || 0;
    
    if (minDmg === 0 && maxDmg === 0 && skillEffect !== "loseATKHP" && skillEffect !== "maxHPPercentDamage" && skillEffect !== "touchDmg") return 0;
    
    let baseDmg = rand(minDmg, maxDmg);
    
    // إضافة تأثير IQ للهجوم
    const iqBonus = Math.floor((userChar.IQ || 0) / 20);
    const atkBonus = Math.floor(userChar.ATK / 10);
    
    let finalDmg = baseDmg + atkBonus + iqBonus;
    let effectiveDEF = targetChar.DEF;
    
    // المهارات التي تتجاهل الدفاع
    const ignoreDefEffects = ["pureDamage", "ultimatePureDmg", "randMultiHit", "multiHit", "bypassShield", "loseATKHP", "skillCountDmg", "maxHPPercentDamage"];
    if (ignoreDefEffects.includes(skillEffect)) {
        effectiveDEF = 0;
    }
    else if (skillEffect === "loseATKHP") {
        // إذا كان ضرر يعتمد على ATK فقط
        return Math.max(1, userChar.ATK);
    }
    else if (skillEffect === "maxHPPercentDamage") {
        const maxHP = getMaxHP(targetChar);
        return Math.max(1, Math.floor(maxHP * 0.35));
    }
    else {
        // زيادة الضرر ضد الدفاع الضعيف
        if (skillEffect === "damageLowDEF" && targetChar.DEF < 500) {
            finalDmg = Math.floor(finalDmg * 1.5);
        }
        // عدالة القوة
        if (skillEffect === "lowHPDamageBoost") {
            const maxHP = getMaxHP(userChar);
            if ((userChar.HP / maxHP) <= 0.30) {
                finalDmg = Math.floor(finalDmg * 4); // 300% boost + 100% base
            }
        }
        // هجوم اللمسة
        if (skillEffect === "touchDmg") {
            const diff = Math.max(0, userChar.ATK - targetChar.DEF);
            finalDmg = Math.floor(diff * 1.5) + 50; // 50 قاعدة + 150% من الفرق
        }
    }
    
    // معادلة الدفاع الأساسية
    if (effectiveDEF > 0) {
         finalDmg = finalDmg - Math.floor(effectiveDEF / 5);
    }
    
    return Math.max(1, finalDmg);
};

// ==========================================
// معالجة الأدوار (Processors)
// ==========================================

async function startTurnProcessing(user, api, threadID) {
    user.status = user.status || {};
    let turnMsg = "";
    let isAlive = true;
    
    // معالجة النزيف
    if (user.status.bleedDuration > 0 && user.status.bleedDmg) {
        applyStat(user.character, "HP", -user.status.bleedDmg);
        turnMsg += `\n${ARROW} نزيف: خسارة ${user.status.bleedDmg} نقطة حياة`;
    }
    
    // معالجة اللعنة
    if (user.status.curseDmg) {
        applyStat(user.character, "HP", -user.status.curseDmg);
        turnMsg += `\n${ARROW} لعنة: خسارة ${user.status.curseDmg} نقطة حياة`;
        // اللعنة يتم تطبيقها لمرة واحدة عند التفعيل
        delete user.status.curseDmg;
    }
    
    // معالجة النزيف المتفجر
    if (user.status.explosiveBleedDuration > 0 && user.status.explosiveBleedDmg) {
        applyStat(user.character, "HP", -user.status.explosiveBleedDmg);
        turnMsg += `\n${ARROW} نزيف متفجر: خسارة ${user.status.explosiveBleedDmg} نقطة حياة`;
    }
    
    if (user.character.HP <= 0) {
        user.character.HP = 0;
        turnMsg += `\n${ARROW} (مات) ${user.character.name} قبل بدء دوره`;
        api.sendMessage(`${LINE}\nبداية الدور لـ ${user.character.name}:${turnMsg}\n${LINE}`, threadID);
        isAlive = false;
    } else if (turnMsg !== "") {
        api.sendMessage(`${LINE}\nبداية الدور لـ ${user.character.name}:${turnMsg}\n${LINE}`, threadID);
    }
    
    return isAlive;
}

async function endTurnProcessing(user, target, api, threadID) {
    // --- معالجة المستخدم ---
    
    // إزالة الدرع المئوي المتبقي
    if (user.status.shield && user.status.shield.type === 'percent') delete user.status.shield;
    
    // تقليل مدة النزيف و القفل
    if (user.status.bleedDuration > 0) user.status.bleedDuration--;
    if (user.status.explosiveBleedDuration > 0) user.status.explosiveBleedDuration--;
    if (user.status.lock > 0) user.status.lock--;
    
    // إزالة التفادي
    if (user.status.evasion) delete user.status.evasion;
    if (user.status.evasionChance) delete user.status.evasionChance;
    if (user.status.guaranteedHit) delete user.status.guaranteedHit;

    // تنظيف البوفات المؤقتة (Buffs)
    
    // chainBoost
    if (user.status.chainBoostDuration === 1 && user.status.chainBoostStats) {
        applyStat(user.character, "ATK", -user.status.chainBoostStats.ATK);
        applyStat(user.character, "SPD", -user.status.chainBoostStats.SPD);
        delete user.status.chainBoostStats;
    }
    if (user.status.chainBoostDuration > 0) user.status.chainBoostDuration--;
    
    // defUP
    if (user.status.defBoostDuration === 1 && user.status.tempDEFBoost) {
        applyStat(user.character, "DEF", -user.status.tempDEFBoost);
        delete user.status.tempDEFBoost;
    }
    if (user.status.defBoostDuration > 0) user.status.defBoostDuration--;
    
    // speedBoost50Percent
    if (user.status.speedBoost50Percent === 1 && user.status.speedBoost50PercentValue) {
        applyStat(user.character, "SPD", -user.status.speedBoost50PercentValue);
        delete user.status.speedBoost50PercentValue;
    }
    if (user.status.speedBoost50Percent > 0) user.status.speedBoost50Percent--;
    
    // boostATKSPEED
    if (user.status.boostATKSPEED === 1 && user.status.boostATKSPEEDValue) {
        applyStat(user.character, "ATK", -user.status.boostATKSPEEDValue.atk);
        applyStat(user.character, "SPD", -user.status.boostATKSPEEDValue.spd);
        delete user.status.boostATKSPEEDValue;
    }
    if (user.status.boostATKSPEED > 0) user.status.boostATKSPEED--;
    
    // absoluteCleanse
    if (user.status.absCleanseDef === 1 && user.status.absCleanseValue) {
        applyStat(user.character, "DEF", -user.status.absCleanseValue);
        delete user.status.absCleanseValue;
    }
    if (user.status.absCleanseDef > 0) user.status.absCleanseDef--;
    
    // --- معالجة الهدف ---
    if (target) {
        // تقليل مدة النزيف
        if (target.status.bleedDuration > 0) target.status.bleedDuration--;
        if (target.status.explosiveBleedDuration > 0) target.status.explosiveBleedDuration--;
        
        // إبطاء الزمن (slow)
        if (target.status.slow === 1 && target.status.originalSPD !== undefined) {
            target.character.SPD = target.status.originalSPD;
            delete target.status.originalSPD;
        }
        if (target.status.slow > 0) target.status.slow--;
        
        // gravityDebuff / defDown40_2turns
        if ((target.status.gravityDebuff === 1 || target.status.defDown40_2turns === 1) && target.status.originalDEF !== undefined) {
            target.character.DEF = target.status.originalDEF;
            delete target.status.originalDEF;
            delete target.status.gravityDebuff;
            delete target.status.defDown40_2turns;
        } else if (target.status.gravityDebuff > 0) {
            target.status.gravityDebuff--;
        } else if (target.status.defDown40_2turns > 0) {
            target.status.defDown40_2turns--;
        }
        
        // swapAllStats
        if (target.status.swapDuration === 1 && target.status.swappedStats) {
            // استعادة الإحصائيات المتبادلة
            ['HP', 'ATK', 'DEF', 'SPD', 'IQ'].forEach(stat => {
                // استعادة إحصائيات الهدف الأصلية
                target.character[stat] = target.status.swappedStats.target[stat];
                // استعادة إحصائيات المستخدم الأصلية
                user.character[stat] = target.status.swappedStats.user[stat];
            });
            delete target.status.swappedStats;
        }
        if (target.status.swapDuration > 0) target.status.swapDuration--;
        
        // lockAttack
        if (target.status.lockAttack > 0) target.status.lockAttack--;
        
        // reflectDamage100
        if (target.status.reflectDamage) delete target.status.reflectDamage;
        
        // إزالة الدرع المئوي المتبقي
        if (target.status.shield && target.status.shield.type === 'percent') delete target.status.shield;
        
        // إزالة التفادي
        if (target.status.evasion) delete target.status.evasion;
        
        // drainATKtoSelf
        if (target.status.drainATK === 1 && target.status.drainATKValue) {
            applyStat(target.character, "ATK", target.status.drainATKValue);
            delete target.status.drainATKValue;
        }
        if (target.status.drainATK > 0) target.status.drainATK--;
        
        // swapHPDEFOnce
        if (target.status.swapHPDEFOnce === 1 && target.status.swapHPDEFOriginals) {
            target.character.HP = target.status.swapHPDEFOriginals.HP;
            target.character.DEF = target.status.swapHPDEFOriginals.DEF;
            delete target.status.swapHPDEFOriginals;
        }
        if (target.status.swapHPDEFOnce > 0) target.status.swapHPDEFOnce--;
    }
}

// ==========================================
// نظام البحث الذكي (محسن جداً) - لم يتم تغييرها
// ==========================================

function normalize(str) {
    if (!str) return "";
    return str.toString().trim().toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
        .replace(/\s+/g, ' '); // إزالة المسافات الزائدة
}

function levenshtein(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return matrix[a.length][b.length];
}

function findSkill(user, skillName) {
    const search = normalize(skillName);
    const skills = user.character.skills;
    
    // 1. تطابق تام
    let index = skills.findIndex(s => normalize(s.name) === search);
    if (index !== -1) return { skill: skills[index], index: index, suggestion: null };
    
    // 2. بداية الكلمة
    index = skills.findIndex(s => normalize(s.name).startsWith(search));
    if (index !== -1) return { skill: skills[index], index: index, suggestion: null };
    
    // 3. يحتوي على الكلمة
    index = skills.findIndex(s => normalize(s.name).includes(search));
    if (index !== -1) return { skill: skills[index], index: index, suggestion: null };
    
    // 4. البحث عن طريق Levenshtein (التشابه)
    let bestMatch = null;
    let bestIndex = -1;
    let minDistance = Infinity;
    
    skills.forEach((s, idx) => {
        const normName = normalize(s.name);
        const dist = levenshtein(normName, search);
        
        // عتبة الخطأ: 3 أحرف أو 40% من الطول
        const threshold = Math.max(3, Math.floor(normName.length * 0.4));
        
        if (dist < minDistance && dist <= threshold) {
            minDistance = dist;
            bestMatch = s;
            bestIndex = idx;
        }
    });
    
    if (bestMatch && minDistance <= 1) return { skill: bestMatch, index: bestIndex, suggestion: null };
    
    return { skill: null, index: -1, suggestion: bestMatch };
}


module.exports = {
    name: "مهارة",
    otherName: ['مهاره', 'skill'],
    rank: 0,
    type: ['الالعاب'],
    cooldown: 3,
    run: async (api, event) => {
        const args = event.body.trim().split(/\s+/);
        const skillName = args.slice(1).join(' ').trim();
        
        try {
            const senderId = event.senderID;
            
            if (!skillName) return api.sendMessage("اكتب اسم المهارة.", event.threadID, event.messageID);
            
            const user = await getUser(senderId);
            if (!user || !user.character) return api.sendMessage("ليس لديك شخصية. اكتب 'تسجيل'.", event.threadID, event.messageID);
            
            // تهيئة
            user.status = user.status || {};
            user.character.HP = Number(user.character.HP) || 0;
            user.character.IQ = Number(user.character.IQ) || 1;
            
            const alive = await startTurnProcessing(user, api, event.threadID);
            if (!alive) {
                await updateUser(senderId, user);
                return;
            }
            
            if (user.status.lock > 0) {
                return api.sendMessage(`${LINE}\n${ARROW} أنت مقيد. لا يمكنك استخدام المهارات.\n${LINE}`, event.threadID, event.messageID);
            }
            
            // استخدام دالة البحث المحسنة
            const { skill, index, suggestion } = findSkill(user, skillName);
            
            if (!skill) {
                if (suggestion) {
                    return api.sendMessage(
                        `لا تملك هذه المهارة.\n\nهل تقصد:\n➡ ${suggestion.name} ؟`,
                        event.threadID,
                        event.messageID
                    );
                }
                return api.sendMessage('لا تملك هذه المهارة.', event.threadID, event.messageID);
            }
            
            // ===========================================
            // إصلاح حد الاستخدام (limitUse) - العد التنازلي
            // ===========================================
            if (skill.limitUse !== undefined && skill.limitUse <= 0) {
                // إذا وصل هنا وكان رصيده 0 أو أقل، نحذفه الآن
                user.character.skills.splice(index, 1);
                await updateUser(senderId, user);
                return api.sendMessage(`لقد نفدت مرات استخدام مهارة ${skill.name} وتمت إزالتها.`, event.threadID, event.messageID);
            }
            
            // تحديد الهدف
            let target;
            let targetId = null;
            
            const selfEffects = ['fullHeal', 'defUP', 'sacATKDEF', 'shadowBoost', 'evasion', 'createShield', 'boostATKSPEED', 'restoreMissingHP', 'evasion50', 'guaranteedHit', 'powerXII', 'permanentDEFBoost', 'absoluteCleanse', 'healBasedOnATK', 'powerX', 'speedBoost50Percent'];
            
            const requiresTarget = !selfEffects.includes(skill.effect);
            
            if (requiresTarget && event.messageReply && event.messageReply.senderID) {
                targetId = event.messageReply.senderID;
                target = await getUser(targetId);
                if (!target || !target.character) return api.sendMessage('الهدف لا يملك شخصية.', event.threadID, event.messageID);
                if (targetId === senderId && skill.type.includes('attack')) return api.sendMessage('لا يمكنك مهاجمة نفسك.', event.threadID, event.messageID);
                
                target.character.IQ = Number(target.character.IQ) || 1;
                if (target.character.HP <= 0) return api.sendMessage('الهدف مات بالفعل.', event.threadID, event.messageID);
                
            } else if (requiresTarget && !event.messageReply) {
                return api.sendMessage(`هذه المهارة تتطلب الرد على شخص ما لاستخدامها.`, event.threadID, event.messageID);
            } else {
                // إذا كانت المهارة ذاتية، يتم تعيين المستخدم كهدف
                target = user;
                targetId = senderId;
            }
            
            let msg = `${LINE}\n${user.character.name} استخدم: ${skill.name}\n`;
            const checkDeath = (char, name) => char.HP <= 0 ? `\n${ARROW} (مات) ${name}` : "";
            
            // ===========================================
            // معالجة التأثيرات (Switch)
            // ===========================================
            
            switch (skill.effect) {
                
                case "damage":
                case "pureDamage":
                case "doubleHit":
                case "tripleHitBleed":
                case "randMultiHit":
                case "multiHit":
                case "highDmgLowSpeed":
                case "lowHPDamageBoost":
                case "ultimatePureDmg":
                case "damageLowDEF":
                case "bypassShield":
                case "lifeSteal50":
                case "dmgATK":
                case "dmgDEF":
                case "loseATKHP":
                case "maxHPPercentDamage":
                case "touchDmg":
                case "deathAttack":
                case "dmgBack":
                case "explosiveBleed": // تمت إضافته لضمان حساب الضرر الأساسي
                case "gravityDebuff": // تمت إضافته لضمان حساب الضرر الأساسي
                {
                    let totalDmg = 0;
                    let hits = 1;
                    if (skill.effect === "doubleHit" && Math.random() < 0.3) hits = 2;
                    else if (skill.effect === "tripleHitBleed") hits = 3;
                    else if (skill.effect === "randMultiHit") hits = rand(4, 7);
                    else if (skill.effect === "multiHit") hits = 5;
                    
                    for (let i = 0; i < hits; i++) {
                        const canEvade = !user.status.guaranteedHit && (target.status.evasion || (target.status.evasionChance && Math.random() < 0.5));
                        
                        if (canEvade) {
                            msg += `\n${ARROW} (تفادي) ${target.character.name} تجنب الهجوم!`;
                            if (target.status.evasion) delete target.status.evasion;
                            continue;
                        } else if (user.status.guaranteedHit && target.status.evasion) {
                            msg += `\n${ARROW} (خرق) تم اختراق تفادي الخصم!`;
                            delete target.status.evasion;
                        }
                        
                        let dmg = calculateDamage(user.character, target.character, skill, skill.effect);
                        
                        if (i === 0 && user.status.shadowBoost) {
                            // يتم تطبيق ShadowBoost مرة واحدة على الضربة الأولى
                            dmg += user.status.shadowBoost;
                            delete user.status.shadowBoost;
                            msg += ` (${ARROW} نسخة الظل: +${user.status.shadowBoost})`;
                        }
                        
                        // معالجة الدرع
                        if (target.status.shield && skill.effect !== 'bypassShield') {
                            let absorbed = 0;
                            if (target.status.shield.type === 'fixed') {
                                const remainingShield = Math.max(0, target.status.shield.value - dmg);
                                absorbed = target.status.shield.value - remainingShield;
                                target.status.shield.value = remainingShield;
                                dmg = Math.max(0, dmg - absorbed);
                                if (target.status.shield.value <= 0) delete target.status.shield;
                            } else if (target.status.shield.type === 'percent') {
                                absorbed = Math.floor(dmg * target.status.shield.value);
                                dmg -= absorbed;
                            }
                            if (absorbed > 0) msg += ` (درع: -${absorbed})`;
                        }
                        
                        // معالجة الانعكاس
                        if (target.status.reflectDamage) {
                            const reflected = Math.floor(dmg * target.status.reflectDamage / 100);
                            applyStat(user.character, "HP", -reflected);
                            msg += ` (انعكاس: ${reflected} عليك)`;
                            delete target.status.reflectDamage; // الانعكاس لمرة واحدة
                        }
                        
                        totalDmg += dmg;
                    }
                    
                    applyStat(target.character, "HP", -totalDmg);
                    msg += `\n${ARROW} الضرر على ${target.character.name}: -${totalDmg}`;
                    
                    if (user.status.guaranteedHit) delete user.status.guaranteedHit;
                    
                    // تأثيرات إضافية بناء على نوع الهجوم
                    if (skill.effect === "highDmgLowSpeed") {
                        const spdLoss = Math.floor(user.character.SPD * 0.10);
                        applyStat(user.character, "SPD", -spdLoss);
                        msg += `\n${ARROW} انخفاض سرعتك: -${spdLoss}`;
                    }
                    if (skill.effect === "lifeSteal50") {
                        const heal = Math.floor(totalDmg * 0.50);
                        applyStat(user.character, "HP", heal);
                        msg += `\n${ARROW} شفاء: +${heal}`;
                    }
                    if (skill.effect === "dmgATK") {
                        const loss = Math.floor(target.character.ATK * 0.05);
                        applyStat(target.character, "ATK", -loss);
                        msg += `\n${ARROW} تدمير هجوم الخصم: -${loss}`;
                    }
                    if (skill.effect === "dmgDEF") {
                        const loss = Math.floor(target.character.DEF * 0.05);
                        applyStat(target.character, "DEF", -loss);
                        msg += `\n${ARROW} تدمير دفاع الخصم: -${loss}`;
                    }
                    if (skill.effect === "deathAttack" && Math.random() < 0.05) {
                        target.character.HP = 0;
                        msg += `\n${ARROW} قتلة فورية! الضربة القاضية نجحت.`;
                    }
                    if (skill.effect === "dmgBack") {
                        const recoil = rand(20, 50);
                        applyStat(user.character, "HP", -recoil);
                        msg += `\n${ARROW} ارتداد: تضررت بـ ${recoil} نقطة.`;
                    }
                    if (skill.effect === "tripleHitBleed" && Math.random() < 0.15) {
                        target.status.bleedDmg = 50;
                        target.status.bleedDuration = 3;
                        msg += `\n${ARROW} تم تطبيق النزيف!`;
                    }
                    
                    // تأثيرات الـ DoT والـ Debuff التي تحتاج إلى الضرر الأساسي أولاً
                    if (skill.effect === "explosiveBleed") {
                         const bleed = Math.floor(getMaxHP(target.character) * 0.15);
                         target.status.explosiveBleedDmg = bleed;
                         target.status.explosiveBleedDuration = 3;
                         msg += `\n${ARROW} تطبيق نزيف متفجر (${bleed} ضرر/دور).`;
                    }
                    if (skill.effect === "gravityDebuff") {
                         if (!target.status.gravityDebuff) {
                            target.status.originalDEF = target.character.DEF;
                            // تقليل DEF و SPD بنسبة 25% (يتبقى 75% = 0.75)
                            applyStat(target.character, "DEF", 0.75, true); 
                            applyStat(target.character, "SPD", 0.75, true);
                            target.status.gravityDebuff = 2;
                            msg += `\n${ARROW} جاذبية: تقليل دفاع وسرعة الخصم لدورين.`;
                        }
                    }
                    
                    msg += checkDeath(target.character, target.character.name);
                    msg += checkDeath(user.character, user.character.name);
                    break;
                }
                
                case 'skillCountDmg': {
                    // يحسب المهارات التي لم تنتهِ (limitUse > 0 أو لا يوجد limitUse)
                    const count = target.character.skills.filter(s => s.limitUse === undefined || s.limitUse > 0).length;
                    const dmg = count * 50;
                    applyStat(target.character, "HP", -dmg);
                    msg += `\n${ARROW} قنبلة الروح: -${dmg} ضرر (بناء على ${count} مهارة).`;
                    msg += checkDeath(target.character, target.character.name);
                    break;
                }
                
                case 'megaSacrifice': {
                    user.character.HP = 0;
                    msg += `\n${ARROW} ضحيت بحياتك!`;
                    if (Math.random() < 0.50) {
                        target.character.HP = 0;
                        msg += `\n${ARROW} نجحت التضحية! مات الخصم معك.`;
                    } else {
                        msg += `\n${ARROW} فشلت التضحية في قتل الخصم.`;
                    }
                    msg += checkDeath(user.character, user.character.name);
                    msg += checkDeath(target.character, target.character.name);
                    break;
                }
                
                case 'chainBoost': {
                    // ضرر مسبق
                    const dmg = calculateDamage(user.character, target.character, skill, 'damage');
                    applyStat(target.character, "HP", -dmg);
                    
                    const spdBoost = Math.floor(user.character.SPD * 0.20);
                    const atkBoost = Math.floor(user.character.ATK * 0.10);
                    
                    applyStat(user.character, "SPD", spdBoost);
                    applyStat(user.character, "ATK", atkBoost);
                    
                    user.status.chainBoostStats = { ATK: atkBoost, SPD: spdBoost };
                    user.status.chainBoostDuration = 2;
                    
                    msg += `\n${ARROW} سلسلة القدر: ضرر -${dmg}. زيادة سرعتك (+${spdBoost}) وهجومك (+${atkBoost}) لدورين.`;
                    msg += checkDeath(target.character, target.character.name);
                    break;
                }
                
                case 'shadowBoost': {
                    user.status.shadowBoost = user.character.ATK;
                    msg += `\n${ARROW} نسخة الظل: تمت إضافة ${user.character.ATK} على هجومك القادم!`;
                    break;
                }
                
                case 'powerXII': {
                    const boost = 1.5;
                    // تحديث HP و XHP
                    user.character.XHP = Math.floor(getMaxHP(user.character) * boost);
                    user.character.HP = Math.floor(user.character.HP * boost);
                    
                    user.character.ATK = Math.floor(user.character.ATK * boost);
                    user.character.DEF = Math.floor(user.character.DEF * boost);
                    user.character.SPD = Math.floor(user.character.SPD * boost);
                    user.character.IQ = Math.floor((user.character.IQ || 1) * boost);
                    msg += `\n${ARROW} زيادة جميع الإحصائيات (بما فيها IQ و Max HP) بنسبة 50% بشكل دائم.`;
                    break;
                }
                
                case 'powerX': {
                    const boost = 1.15;
                    user.character.ATK = Math.floor(user.character.ATK * boost);
                    user.character.DEF = Math.floor(user.character.DEF * boost);
                    user.character.SPD = Math.floor(user.character.SPD * boost);
                    user.character.IQ = Math.floor((user.character.IQ || 1) * boost);
                    msg += `\n${ARROW} ألترا إنستينكت: زيادة الإحصائيات و IQ بنسبة 15% بشكل دائم.`;
                    break;
                }
                
                case 'shield75AndDefBoost': {
                    user.status.shield = { type: 'percent', value: 0.75 };
                    msg += `\n${ARROW} حاجز: امتصاص 75% من الضرر القادم.`;
                    if (Math.random() < 0.20) {
                        const boost = Math.floor(user.character.DEF * 0.10);
                        applyStat(user.character, "DEF", boost); // زيادة دائمة
                        msg += ` وزيادة دفاع دائمة +${boost}.`;
                    }
                    break;
                }
                
                case 'createShield': {
                    const val = (user.status.shield && user.status.shield.type === 'fixed') ? user.status.shield.value : 0;
                    user.status.shield = { type: 'fixed', value: val + 300 };
                    msg += `\n${ARROW} درع: يمتص 300 ضرر قادم.`;
                    break;
                }
                
                case 'defUP': {
                    const boost = Math.floor(user.character.DEF * 0.30);
                    applyStat(user.character, "DEF", boost);
                    user.status.tempDEFBoost = boost;
                    user.status.defBoostDuration = 2;
                    msg += `\n${ARROW} صمود: زيادة الدفاع +${boost} لدورين.`;
                    break;
                }
                
                case 'reflectDamage100': {
                    target.status.reflectDamage = 100;
                    msg += `\n${ARROW} انعكاس الضرر: سيعكس ${target.character.name} 100% من الهجوم القادم.`;
                    break;
                }
                
                case 'evasion': {
                    user.status.evasion = true;
                    msg += `\n${ARROW} رؤية المستقبل: ستتفادى الهجوم القادم مؤكداً.`;
                    break;
                }
                
                case 'evasion50': {
                    user.status.evasionChance = true;
                    msg += `\n${ARROW} تضليل: فرصة 50% لتفادي الهجوم القادم.`;
                    break;
                }
                
                case 'guaranteedHit': {
                    user.status.guaranteedHit = true;
                    msg += `\n${ARROW} تثبيت الهدف: هجومك القادم لا يمكن تفاديه وسيخترق التضليل.`;
                    break;
                }
                
                case 'lock': {
                    target.status.lock = 2;
                    msg += `\n${ARROW} بونجي غوم: تم تقييد الخصم من استخدام المهارات لدورين.`;
                    break;
                }
                
                case 'lockAttack': {
                    target.status.lockAttack = 1;
                    msg += `\n${ARROW} ختم: تم منع الخصم من الهجوم العادي للدور القادم.`;
                    break;
                }
                
                case 'slow': {
                    if (!target.status.slow) {
                        target.status.originalSPD = target.character.SPD;
                        // تقليل السرعة للنصف (ضرب * 0.5)
                        applyStat(target.character, "SPD", 0.5, true); 
                        target.status.slow = 3;
                        msg += `\n${ARROW} إبطاء: سرعة الخصم انخفضت للنصف لمدة 3 أدوار.`;
                    } else {
                        msg += `\n${ARROW} الخصم مبطأ بالفعل.`;
                    }
                    break;
                }
                
                case 'curse': {
                    const curseDmg = Math.floor(getMaxHP(target.character) * 0.30);
                    target.status.curseDmg = curseDmg;
                    msg += `\n${ARROW} لعنة: سيتلقى الخصم ${curseDmg} ضرر في بداية دوره.`;
                    break;
                }
                
                // gravityDebuff تم التعامل معه في الـ Switch الأساسي ليتضمن الضرر
                
                case 'defDown40_2turns': {
                    if (!target.status.defDown40_2turns) {
                        target.status.originalDEF = target.character.DEF;
                        // تقليل الدفاع بنسبة 40% (يتبقى 60% = 0.60)
                        applyStat(target.character, "DEF", 0.60, true); 
                        target.status.defDown40_2turns = 2;
                        msg += `\n${ARROW} ضعف: دفاع الخصم انخفض بنسبة 40% لدورين.`;
                    }
                    break;
                }
                
                case 'fullHeal': {
                    const max = getMaxHP(user.character);
                    user.character.HP = max;
                    msg += `\n${ARROW} شفاء تام: صحتك كاملة الآن (${max}).`;
                    break;
                }
                
                case 'healTarget': {
                    applyStat(target.character, "HP", 150);
                    msg += `\n${ARROW} بركة: شفاء الهدف +150 HP.`;
                    break;
                }
                
                case 'restoreMissingHP': {
                    const max = getMaxHP(user.character);
                    const missing = Math.max(0, max - user.character.HP);
                    const heal = Math.floor(missing * 0.25);
                    applyStat(user.character, "HP", heal);
                    msg += `\n${ARROW} استراحة: استعدت ${heal} نقطة حياة.`;
                    break;
                }
                
                case 'healBasedOnATK': {
                    const heal = Math.floor(user.character.ATK * 0.75);
                    applyStat(user.character, "HP", heal);
                    msg += `\n${ARROW} تجديد: استعدت ${heal} HP بناء على قوتك.`;
                    break;
                }
                
                case 'manaDrain': {
                    const drain = Math.floor(target.character.ATK * 0.20);
                    applyStat(target.character, "ATK", -drain);
                    applyStat(user.character, "ATK", drain);
                    msg += `\n${ARROW} استنزاف: سرقت ${drain} ATK من الخصم.`;
                    break;
                }
                
                case 'stealSkill': {
                    if (target.character.skills.length === 0) {
                        msg += `\n${ARROW} فشلت السرقة (الخصم بلا مهارات حالياً).`;
                        break;
                    }
                    const randSkill = target.character.skills[rand(0, target.character.skills.length - 1)];
                    
                    // نستخدم تأثير 'damage' لضمان تطبيق حساب الضرر الأساسي
                    const dmg = calculateDamage(user.character, target.character, randSkill, 'damage');
                    applyStat(target.character, "HP", -dmg);
                    msg += `\n${ARROW} سرقة: نسخت مهارة "${randSkill.name}" واستخدمتها فوراً! سببّت ضرر ${dmg}.`;
                    
                    msg += checkDeath(target.character, target.character.name);
                    break;
                }
                
                case 'swapStats': {
                    const myATK = user.character.ATK;
                    user.character.ATK = target.character.DEF;
                    target.character.DEF = myATK;
                    msg += `\n${ARROW} تبديل: هجومك (${user.character.ATK}) بدفاع الخصم (${target.character.DEF}) (دائم).`;
                    break;
                }
                
                case 'swapAllStats': {
                    target.status.swappedStats = {
                        user: { HP: user.character.HP, ATK: user.character.ATK, DEF: user.character.DEF, SPD: user.character.SPD, IQ: user.character.IQ },
                        target: { HP: target.character.HP, ATK: target.character.ATK, DEF: target.character.DEF, SPD: target.character.SPD, IQ: target.character.IQ }
                    };
                    ['HP', 'ATK', 'DEF', 'SPD', 'IQ'].forEach(stat => {
                        const temp = user.character[stat];
                        user.character[stat] = target.character[stat];
                        target.character[stat] = temp;
                    });
                    target.status.swapDuration = 2;
                    msg += `\n${ARROW} تبادل مصيري: تبدلت جميع إحصائياتك مع الخصم لدورين.`;
                    break;
                }
                
                case 'swapHPDEFOnce': {
                    const hp = target.character.HP;
                    const def = target.character.DEF;
                    target.status.swapHPDEFOriginals = { HP: hp, DEF: def };
                    target.character.HP = def;
                    target.character.DEF = hp;
                    target.status.swapHPDEFOnce = 1;
                    msg += `\n${ARROW} تضخم: انقلبت صحة ودفاع الخصم لدور واحد.`;
                    break;
                }
                
                case 'equalizeHP': {
                    const userHP = user.character.HP;
                    target.character.HP = Math.max(1, userHP);
                    msg += `\n${ARROW} مساواة: صحة الخصم أصبحت تطابق صحتك (${userHP} HP).`;
                    break;
                }
                
                case 'drainATKtoSelf': {
                    const stolen = target.character.ATK;
                    const bonus = Math.floor(stolen * 0.5);
                    
                    target.status.drainATKValue = stolen;
                    target.character.ATK = 1; // يقلل هجوم الهدف إلى 1
                    target.status.drainATK = 2; // لمدة دورين
                    
                    applyStat(user.character, "ATK", bonus);
                    msg += `\n${ARROW} استنزاف مصير: الخصم فقد هجومه (متبقي 1)، وكسبت +${bonus} ATK.`;
                    break;
                }
                
                case 'copyATK': {
                    const copy = target.character.ATK;
                    applyStat(user.character, "ATK", copy);
                    msg += `\n${ARROW} نسخ: تمت إضافة +${copy} لهجومك بشكل دائم.`;
                    break;
                }
                
                case 'sacATKDEF': {
                    const loss = Math.floor(user.character.ATK * 0.25);
                    const gain = Math.floor(user.character.DEF * 0.50);
                    applyStat(user.character, "ATK", -loss);
                    applyStat(user.character, "DEF", gain);
                    msg += `\n${ARROW} تضحية: -${loss} ATK مقابل +${gain} DEF (دائم).`;
                    break;
                }
                
                case 'permanentDEFBoost': {
                    const loss = Math.floor(user.character.ATK * 0.50);
                    const gain = user.character.DEF;
                    applyStat(user.character, "ATK", -loss);
                    applyStat(user.character, "DEF", gain);
                    msg += `\n${ARROW} تضحية أبدية: -${loss} ATK مقابل +${gain} DEF (دائم).`;
                    break;
                }
                
                case 'speedBoost50Percent': { // تم تغيير الاسم
                    const boost = Math.floor(user.character.SPD * 0.50);
                    user.status.speedBoost50PercentValue = boost;
                    user.status.speedBoost50Percent = 3;
                    applyStat(user.character, "SPD", boost);
                    msg += `\n${ARROW} تسارع: +${boost} سرعة لمدة 3 أدوار.`;
                    break;
                }
                
                case 'boostATKSPEED': {
                    const atk = Math.floor(user.character.ATK * 0.20);
                    const spd = Math.floor(user.character.SPD * 0.20);
                    user.status.boostATKSPEEDValue = { atk, spd };
                    user.status.boostATKSPEED = 1;
                    applyStat(user.character, "ATK", atk);
                    applyStat(user.character, "SPD", spd);
                    msg += `\n${ARROW} طاقة: +${atk} ATK و +${spd} SPD لدور واحد.`;
                    break;
                }
                
                case 'absoluteCleanse': {
                    // تنظيف المستخدم
                    if (user.status.bleedDuration) delete user.status.bleedDuration;
                    if (user.status.curseDmg) delete user.status.curseDmg;
                    if (user.status.explosiveBleedDuration) delete user.status.explosiveBleedDuration;
                    if (user.status.slow) delete user.status.slow;
                    if (user.status.lock) delete user.status.lock;
                    if (user.status.defDown40_2turns) delete user.status.defDown40_2turns;
                    
                    // تنظيف الهدف (اختياري، لكن مفيد لـ "التطهير المطلق")
                    if (target) {
                        if (target.status.bleedDuration) delete target.status.bleedDuration;
                        if (target.status.curseDmg) delete target.status.curseDmg;
                        if (target.status.explosiveBleedDuration) delete target.status.explosiveBleedDuration;
                        if (target.status.slow) delete target.status.slow;
                        if (target.status.lock) delete target.status.lock;
                        if (target.status.defDown40_2turns) delete target.status.defDown40_2turns;
                        // استعادة الإحصائيات إذا كانت مخفضة مؤقتاً
                        if (target.status.originalSPD !== undefined) target.character.SPD = target.status.originalSPD;
                        if (target.status.originalDEF !== undefined) target.character.DEF = target.status.originalDEF;
                    }
                    
                    const boost = Math.floor(user.character.DEF * 0.20);
                    applyStat(user.character, "DEF", boost);
                    user.status.absCleanseValue = boost;
                    user.status.absCleanseDef = 1;
                    
                    msg += `\n${ARROW} تطهير: إزالة السلبيات (عنك وعن الخصم) وزيادة دفاعك +${boost} لدور واحد.`;
                    break;
                }
                
                default:
                    msg += `\n${ARROW} تأثير المهارة (${skill.effect}) غير معرف، لكن تم تفعيلها.`;
            }
            
            // ===========================================
            // تحديث عدد الاستخدامات (نظام العد التنازلي) - الإصلاح المطلوب
            // ===========================================
            
            if (skill.limitUse !== undefined) {
                // نصل للمهارة عبر الفهرس (index) لتعديلها في ذاكرة المستخدم مباشرة
                const skillToUpdate = user.character.skills[index];
                
                if (skillToUpdate) {
                    // ننقص العدد مباشرة
                    skillToUpdate.limitUse = skillToUpdate.limitUse - 1;
                    
                    if (skillToUpdate.limitUse <= 0) {
                        // حذف المهارة من المصفوفة
                        user.character.skills.splice(index, 1);
                        msg += `\n${LINE}\nانتهت مهارة ${skill.name} وحذفت من قائمتك.`;
                    } else {
                        // عرض العدد المتبقي
                        msg += `\n(متبقي: ${skillToUpdate.limitUse})`;
                    }
                }
            }
            
            await endTurnProcessing(user, target, api, event.threadID);
            
            // حفظ بيانات المستخدم والهدف
            await updateUser(senderId, user);
            if (target && targetId) await updateUser(targetId, target);
            
            api.sendMessage(`${styleNum(styleText(msg))}`, event.threadID, event.messageID);
            
        } catch (err) {
            console.error(err);
            api.sendMessage('حدث خطأ أثناء تنفيذ المهارة.', event.threadID, event.messageID);
        }
    }
};

