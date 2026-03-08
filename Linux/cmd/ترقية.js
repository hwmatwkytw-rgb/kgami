// cmd/ترقية.js
const skills = require('../data/skills.js');
const { getUser, updateUser } = require('../data/user');
const log = require('../logger')
const fs = require('fs')
const path = require('path');
const img = path.join(__dirname, 'cache', 'lvlup.gif');
const { styleText, styleNum } = require('../tools.js')
// دالة عشوائية
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// مستوى الإيقاظ المحدد
const AWAKENING_LEVEL = 100;

// دالة زيادات عادية
function getBoostsByType(nenType) {
    switch (nenType) {
        case 'معزز':
            return { hp: rand(50, 70), atk: rand(45, 60), def: rand(20, 30), spd: rand(15, 25), iq: rand(5, 15) };
        case 'محول':
            return { hp: rand(20, 35), atk: rand(40, 55), def: rand(15, 25), spd: rand(50, 70), iq: rand(20, 35) };
        case 'باعث':
            return { hp: rand(35, 50), atk: rand(55, 70), def: rand(20, 30), spd: rand(25, 40), iq: rand(10, 20) };
        case 'مجسد':
            return { hp: rand(40, 55), atk: rand(20, 35), def: rand(45, 60), spd: rand(20, 30), iq: rand(30, 45) };
        case 'متلاعب':
            return { hp: rand(25, 40), atk: rand(25, 40), def: rand(25, 40), spd: rand(40, 60), iq: rand(35, 50) };
        case 'متخصص':
            return { hp: rand(30, 50), atk: rand(30, 50), def: rand(30, 50), spd: rand(30, 50), iq: rand(25, 50) };
        default:
            return { hp: rand(25, 35), atk: rand(25, 35), def: rand(25, 35), spd: rand(25, 35), iq: rand(15, 25) };
    }
}

// دالة زيادات الإيقاظ
function getAwakeningBoosts(nenType) {
    switch (nenType) {
        case 'معزز':
            return { hp: rand(500, 700), atk: rand(450, 600), def: rand(200, 300), spd: rand(150, 250), iq: rand(50, 150) };
        case 'محول':
            return { hp: rand(200, 350), atk: rand(400, 550), def: rand(150, 250), spd: rand(500, 700), iq: rand(200, 350) };
        case 'باعث':
            return { hp: rand(350, 500), atk: rand(550, 700), def: rand(200, 300), spd: rand(250, 400), iq: rand(100, 200) };
        case 'مجسد':
            return { hp: rand(400, 550), atk: rand(200, 350), def: rand(450, 600), spd: rand(200, 300), iq: rand(300, 450) };
        case 'متلاعب':
            return { hp: rand(250, 400), atk: rand(250, 400), def: rand(250, 400), spd: rand(400, 600), iq: rand(350, 500) };
        case 'متخصص':
            return { hp: rand(300, 500), atk: rand(300, 500), def: rand(300, 500), spd: rand(300, 500), iq: rand(250, 500) };
        default:
            return { hp: rand(250, 350), atk: rand(250, 350), def: rand(250, 350), spd: rand(250, 350), iq: rand(150, 250) };
    }
}

module.exports = {
    name: 'ترقية',
    otherName: ['ترقيه', 'up', 'upgrade'],
    cooldown: 5,
    rank: 0,
    type: ['الالعاب'],
    run: async (api, event) => {
        try {
            const senderID = event.senderID;
            const args = event.body ? event.body.split(" ").slice(1) : [];
            const user = await getUser(senderID);

            if (!user)
                return api.sendMessage('⚠ | ليس لديك حساب، استخدم أمر التسجيل أولاً.', event.threadID, event.messageID);

            const nenType = user.character?.type;
            if (!user.character || !nenType)
                return api.sendMessage('⚠ | لا يمكنك الترقية قبل إنشاء شخصية وتحديد فئتها.', event.threadID, event.messageID);

            if (user.character.battle?.status)
                return api.sendMessage('لا يمكنك الترقية وأنت في وسط معركة', event.threadID, event.messageID);

            // تأكد من مصفوفة مهارات الشخصية
            if (!Array.isArray(user.character.skills)) {
                user.character.skills = [];
            }

            const costPerLevel = 148 + (user.character.level * 3);
            let levelsToUpgrade = 1;

            const isUpgradeAll = args[0] && (args[0].toLowerCase() === 'الكل' || args[0].toLowerCase() === 'all');

            if (isUpgradeAll) {
                const maxAffordable = Math.floor((user.diamond || 0) / costPerLevel);
                if (maxAffordable < 1) {
                    return api.sendMessage(`ما عندك ${styleNum(costPerLevel)} جوهرة`, event.threadID, event.messageID);
                }
                levelsToUpgrade = maxAffordable;
            } else {
                if ((user.diamond || 0) < costPerLevel) {
                    return api.sendMessage(`محتاج ${styleNum(costPerLevel)} جوهرة .`, event.threadID, event.messageID);
                }
            }

            const totalCost = levelsToUpgrade * costPerLevel;

            let totalHP = 0,
                totalATK = 0,
                totalDEF = 0,
                totalSPD = 0,
                totalIQ = 0;

            let totalRatingIncrease = 0;
            let obtainedSkills = [];
            let awakeningTriggered = false;

            // قائمة مهارات غير مملوكة
            let availablePool = skills.filter(s =>
                !user.character.skills.some(us => us.name === s.name)
            );

            const currentLevelStart = user.character.level || 0;

            if (typeof user.character.awakened !== 'boolean') {
                user.character.awakened = false;
            }

            // --- حلقة المستويات ---
            for (let i = 0; i < levelsToUpgrade; i++) {
                const nextLevel = currentLevelStart + i + 1;

                // زيادة عادية
                const b = getBoostsByType(nenType);
                totalHP += b.hp;
                totalATK += b.atk;
                totalDEF += b.def;
                totalSPD += b.spd;
                totalIQ += b.iq;

                // الإيقاظ
                if (!user.character.awakened && nextLevel >= AWAKENING_LEVEL) {
                    awakeningTriggered = true;
                    user.character.awakened = true;

                    const awk = getAwakeningBoosts(nenType);
                    totalHP += awk.hp;
                    totalATK += awk.atk;
                    totalDEF += awk.def;
                    totalSPD += awk.spd;
                    totalIQ += awk.iq;
                }

                // زيادة التصنيف
                if (nextLevel % 10 === 0) {
                    totalRatingIncrease += 1;
                }

                // فرصة المهارة 20%
                if (Math.random() < 0.20 && availablePool.length > 0) {
                    const randomIndex = rand(0, availablePool.length - 1);
                    const newSkill = availablePool[randomIndex];

                    // إضافة الكائن كاملاً
                    user.character.skills.push(newSkill);

                    obtainedSkills.push(newSkill.name);

                    availablePool.splice(randomIndex, 1);
                }
            }

            // تحديث المستخدم
            user.diamond -= totalCost;
            user.character.level = currentLevelStart + levelsToUpgrade;

            user.character.XHP = (user.character.XHP || 0) + totalHP;
            user.character.XATK = (user.character.XATK || 0) + totalATK;
            user.character.XDEF = (user.character.XDEF || 0) + totalDEF;
            user.character.XSPD = (user.character.XSPD || 0) + totalSPD;
            user.character.XIQ = (user.character.XIQ || 0) + totalIQ;

            if (totalRatingIncrease > 0) {
                user.character.rating = (user.character.rating || 0) + totalRatingIncrease;
            }

            await updateUser(senderID, user);

            // الرسالة النهائية
            let message = `────────\n`;
            message += `${styleText("type")} : ${nenType}\n`;
            message += `${styleText("lvl")} : ${styleNum(user.character.level)}\n`;

            if (awakeningTriggered) {
                message += `────────\nالإيقاظ ${styleNum(AWAKENING_LEVEL)}!\n`;
            }

            message += `────────\n`;
            message += `${styleText("hp")} : +${styleNum(totalHP)}\n`;
            message += `${styleText("atk")} : +${styleNum(totalATK)}\n`;
            message += `${styleText("def")} : +${styleNum(totalDEF)}\n`;
            message += `${styleText("spd")} : +${styleNum(totalSPD)}\n`;
            message += `${styleText("iq")} : +${styleNum(totalIQ)}\n`;

            if (totalRatingIncrease > 0) {
                message += `⊳${styleText('Rating')} : +${styleNum(totalRatingIncrease)}\n`;
            }

            if (obtainedSkills.length > 0) {
                message += `────────\n⊳ مهارات مكتسبة :\n`;
                obtainedSkills.forEach(s => message += `⊳ ${s}\n`);
            }

            message += `────────\n`;
            message += `⊳ الجواهر المتبقية : ${styleNum(user.diamond)}`;

            api.sendMessage(message, event.threadID, event.messageID);

        } catch (error) {
            log.error('Error in upgrade command:', error);
            api.sendMessage('حدث خطأ أثناء عملية الترقية.', event.threadID, event.messageID);
        }
    }
}
