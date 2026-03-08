const { getUser, updateUser } = require('../data/user');
const weapons = require('../data/weapon.json');
const monsters = require('../data/monster.json');
const { styleText, styleNum } = require('../tools');
const axios = require('axios');

const LINE = "⊱━━━━━━━━━━━━━━━⊰ 🦋 ⊱━━━━━━━━━━━━━━━⊰";
const BUTTERFLY = "🦋";
const FLOWER = "✿";

if (!global.activeCaves) global.activeCaves = new Map();

module.exports = {
  name: 'بعثة',
  otherName: ['مغارة', 'صيد', 'mission'],
  type: ['الالعاب'],
  cooldown: 5,
  rank: 0,
  run: async (api, event, args) => {
    const { senderID, threadID, messageID } = event;
    const { sendMessage } = api;
    
    const user = await getUser(senderID);
    if (!user || !user.character) return sendMessage(`${BUTTERFLY} | أوه؟ عليكِ التسجيل في الفيلق أولاً قبل الخروج في بعثة.`, threadID, messageID);
    
    const calculatePower = (u) => {
      return (u.character.HP || 0) + (u.character.ATK || 0) + (u.character.DEF || 0) + (u.character.SPD || 0);
    };
    
    const getRank = (power, user) => {
      const ex = user.cave?.exp || 0;
      const total = power + ex;
      if (total < 10000) return 'ميزونوتو (F)';
      if (total < 50000) return 'ميزونوي (E)';
      if (total < 200000) return 'كانوي (D) ';
      if (total < 800000) return 'كانوتو (C)';
      if (total < 2500000) return 'هينوي (B)';
      if (total < 10000000) return 'كوشي (A)';
      return 'هاشيرة (S)';
    };
    
    const userPower = calculatePower(user);
    const userRankDisplay = getRank(userPower, user);
    const userRankLetter = userRankDisplay.match(/\(([^)]+)\)/)[1]; // استخراج الحرف (F, E, etc)
    const subCommand = args[0];
    
    if (!subCommand) {
      let msg = `${LINE}\n`;
      msg += `   亗 مـقـر فـيـلـق الـقـتـلـة 亗\n${LINE}\n`;
      msg += `${BUTTERFLY} بعثة ملفي : عرض رتبتك وسجلك\n`;
      msg += `${BUTTERFLY} بعثة انشاء <الرتبة> : بدء رحلة صيد\n`;
      msg += `${BUTTERFLY} بعثة انضمام : مشاركة الرفاق في القتال\n`;
      msg += `${BUTTERFLY} بعثة شراء : حداد السيوف (المتجر)\n`;
      msg += `${BUTTERFLY} بعثة اسلحتي : استعراض نصولك\n`;
      msg += `${BUTTERFLY} بعثة تجهيز <رقم> : اختيار السلاح\n`;
      msg += `${BUTTERFLY} بعثة هجوم : توجيه ضربة للشيطان\n`;
      msg += `${BUTTERFLY} بعثة حالة : رصد قوة الشيطان الحالي\n`;
      msg += `${LINE}\n${FLOWER} اختاري وجهتكِ بعناية..`;
      return sendMessage(msg, threadID, messageID);
    }
    
    switch (subCommand) {
      case 'شراء': {
        const weaponIndex = parseInt(args[1]) - 1;
        const ownedWeaponNames = user.cave.weapon ? user.cave.weapon.map(w => w.name) : [];
        
        if (isNaN(weaponIndex)) {
          let msg = `${LINE}\n    ⚔️ مـتـجـر نـصـول الـنـيـتـشـيـريـن\n${LINE}\n`;
          let displayCount = 0;
          weapons.forEach((w, i) => {
            if (w.price <= (user.money) && !ownedWeaponNames.includes(w.name)) {
              msg += `${styleNum(i + 1)}. ${styleText(w.name)}\n       💰 السعر: ${styleNum(w.price)} ¥\n\n`;
              displayCount++;
            }
          });
          if (displayCount === 0) msg += "🦋 | لا توجد نصول جديدة تناسب ميزانيتكِ حالياً.";
          msg += `\n${FLOWER} للشراء: بعثة شراء <الرقم>`;
          return sendMessage(msg, threadID, messageID);
        }
        
        const targetWeapon = weapons[weaponIndex];
        if (!targetWeapon) return sendMessage("🦋 | هذا السلاح غير موجود في سجلاتنا.", threadID, messageID);
        if (targetWeapon.price > user.money) return sendMessage("🦋 | ينقصكِ بعض المال لاقتناء هذا النصل.", threadID, messageID);
        
        user.money -= targetWeapon.price;
        if (!user.cave.weapon) user.cave.weapon = [];
        user.cave.weapon.push({ ...targetWeapon, isUsed: false });
        
        await updateUser(senderID, user);
        return sendMessage(`🦋 | مبارك لكِ.. لقد حصلتِ على ${styleText(targetWeapon.name)}. استخدميه بحكمة.`, threadID, messageID);
      }
      
      case 'اسلحتي': {
        if (!user.cave.weapon || user.cave.weapon.length === 0) return sendMessage("🦋 | حقيبتكِ فارغة.. ألا تملكين نصلاً؟", threadID, messageID);
        let msg = `${LINE}\n    🦋 خـزانـة الأسـلـحـة الـخـاصـة\n${LINE}\n`;
        user.cave.weapon.forEach((w, i) => {
          msg += `${styleNum(i + 1)}. ${styleText(w.name)} ${w.isUsed ? " ⊳ [ مجهز ]" : ""}\n`;
          msg += `⚔️ ATK: +${w.ATK} | 🛡️ DEF: +${w.DEF}\n\n`;
        });
        return sendMessage(msg, threadID, messageID);
      }

      case 'تجهيز': {
        const weaponIndex = parseInt(args[1]) - 1;
        if (isNaN(weaponIndex) || !user.cave.weapon?.[weaponIndex]) return sendMessage("🦋 | رقم السلاح غير صحيح.", threadID, messageID);
        
        const targetWeapon = user.cave.weapon[weaponIndex];
        const currentlyEquipped = user.cave.weapon.find(w => w.isUsed);
        
        if (currentlyEquipped) {
          user.character.HP -= (currentlyEquipped.HP || 0);
          user.character.ATK -= (currentlyEquipped.ATK || 0);
          user.character.DEF -= (currentlyEquipped.DEF || 0);
          user.character.SPD -= (currentlyEquipped.SPD || 0);
          currentlyEquipped.isUsed = false;
        }
        
        if (currentlyEquipped?.name === targetWeapon.name) {
          await updateUser(senderID, user);
          return sendMessage(`🦋 | تم نزع ${styleText(targetWeapon.name)}.. هل ستكتفين بالسموم؟`, threadID, messageID);
        } else {
          targetWeapon.isUsed = true;
          user.character.HP += (targetWeapon.HP || 0);
          user.character.ATK += (targetWeapon.ATK || 0);
          user.character.DEF += (targetWeapon.DEF || 0);
          user.character.SPD += (targetWeapon.SPD || 0);
          await updateUser(senderID, user);
          return sendMessage(`🦋 | تم تجهيز ${styleText(targetWeapon.name)}.. رقصة موفقة.`, threadID, messageID);
        }
      }

      case 'انشاء': {
        const rankReq = args[1]?.toUpperCase();
        const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
        if (!ranks.includes(rankReq)) return sendMessage(`🦋 | حددي رتبة البعثة المطلوبة:\n[ ${ranks.join(' - ')} ]`, threadID, messageID);
        
        const playerRankIndex = ranks.indexOf(userRankLetter);
        const requestedRankIndex = ranks.indexOf(rankReq);
        if (requestedRankIndex > playerRankIndex) return sendMessage(`🦋 | رتبتكِ [ ${userRankDisplay} ] لا تؤهلكِ لهذه المهمة الانتحارية.`, threadID, messageID);
        
        const minLocation = requestedRankIndex * 3;
        const region = monsters[Math.floor(Math.random() * 3) + minLocation];
        const monster = region.creature[Math.floor(Math.random() * region.creature.length)];
        
        const timer = setTimeout(() => {
          if (global.activeCaves.has(threadID)) {
            global.activeCaves.delete(threadID);
            sendMessage(`${LINE}\n🦋 | انتهى وقت البعثة في [ ${region.location} ] وهرب الشيطان في الظلام.\n${LINE}`, threadID);
          }
        }, 5 * 60 * 1000);
        
        global.activeCaves.set(threadID, {
          monster: { ...monster, currentHP: monster.HP },
          participants: [senderID],
          locationName: region.location,
          timeout: timer,
          totalAttacks: 0
        });
        
        try {
          const res = await axios.get(monster.image, { responseType: "stream" });
          return sendMessage({
            body: `${LINE}\n🚨 بـلاغ عـاجـل: ظهور شيطان!\n${LINE}\n📍 الموقع: ${styleText(region.location)}\n🎭 الرتبة: ${rankReq}\n👹 الشيطان: ${monster.Name}\n🩸 الصحة: ${styleNum(monster.HP)}\n⚔️ القوة: ${styleNum(monster.ATK)}\n\n${FLOWER} للانضمام: بعثة انضمام`,
            attachment: res.data
          }, threadID, messageID);
        } catch (e) {
          return sendMessage("🦋 | ظهر الشيطان! لكن الغراب لم يستطع جلب صورته.. أسرعوا!", threadID, messageID);
        }
      }
      
      case 'هجوم': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("🦋 | لا توجد شياطين في الجوار حالياً.. استمتعي بالشاي.", threadID, messageID);
        if (!cave.participants.includes(senderID)) return sendMessage("🦋 | انضمي للفريق أولاً قبل الهجوم.", threadID, messageID);
        if ((user.character.HP || 0) <= 0) return sendMessage('🦋 | جسدكِ منهك.. عليكِ استخدام (شفاء) أولاً.', threadID, messageID);
        
        let baseDamage = (user.character.ATK || 10) - (cave.monster.DEF * 0.4);
        const variance = (Math.random() * 0.2) + 0.9;
        let finalDamage = Math.floor(Math.max(1, baseDamage) * variance);
        
        let isCrit = Math.random() < 0.15;
        if (isCrit) finalDamage = Math.floor(finalDamage * 1.5);
        
        cave.monster.currentHP -= finalDamage;
        cave.totalAttacks += 1;
        
        let extraMsg = "";
        if (cave.totalAttacks % 10 === 0) {
          const victim = await getUser(cave.participants[Math.floor(Math.random() * cave.participants.length)]);
          const mDmg = Math.max(10, Math.floor(cave.monster.ATK - (victim.character.DEF * 0.3)));
          victim.character.HP = Math.max(0, (victim.character.HP || 0) - mDmg);
          await updateUser(victim.senderID, victim);
          extraMsg = `\n${FLOWER} هجوم غادر! الشيطان أصاب ${victim.character.name} بضرر ${styleNum(mDmg)}`;
        }
        
        if (cave.monster.currentHP <= 0) {
          clearTimeout(cave.timeout);
          const sharedExp = Math.floor((cave.monster.exp / 2) / cave.participants.length);
          const sharedMoney = Math.floor((cave.monster.price / 2) / cave.participants.length);
          
          for (const pID of cave.participants) {
            const pUser = await getUser(pID);
            if (pUser) {
              pUser.cave.exp = (pUser.cave.exp || 0) + sharedExp;
              pUser.money += sharedMoney;
              await updateUser(pID, pUser);
            }
          }
          global.activeCaves.delete(threadID);
          return sendMessage(`${LINE}\n🦋 | "أرقد بسلام.." تم سحق ${cave.monster.Name}!\n💰 الغنائم: +${styleNum(sharedMoney)} ¥\n✨ الخبرة: +${styleNum(sharedExp)}\n${LINE}`, threadID);
        }
        return sendMessage(`🦋 | رقصة الحشرة! ضربة بقوة ${styleNum(finalDamage)}${isCrit ? " (حرجة!)" : ""}\n🩸 صحة الشيطان: ${styleNum(cave.monster.currentHP)}${extraMsg}`, threadID, messageID);
      }
      
      case 'ملفي': {
        const equipped = user.cave.weapon?.find(w => w.isUsed) || { name: "يد عارية" };
        let msg = `${LINE}\n    🦋 سـجـل الـصـيـاد الـمـلـكـي\n${LINE}\n`;
        msg += `🎖️ الرتبة: ${styleText(userRankDisplay)}\n`;
        msg += `🔥 القدرة: ${styleNum(userPower)}\n`;
        msg += `❤️ الصحة: ${styleNum(user.character.HP)}\n`;
        msg += `⚔️ السلاح: ${styleText(equipped.name)}\n`;
        msg += `✨ الخبرة: ${styleNum(user.cave.exp || 0)}\n${LINE}`;
        return sendMessage(msg, threadID, messageID);
      }

      case 'انضمام': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("🦋 | لا توجد معركة جارية حالياً.", threadID, messageID);
        if (cave.participants.includes(senderID)) return sendMessage("🦋 | أنتِ في قلب المعركة بالفعل!", threadID, messageID);
        cave.participants.push(senderID);
        return sendMessage(`🦋 | انضمت ${user.character.name} إلى ساحة القتال. فلنرقص معاً!`, threadID, messageID);
      }

      case 'حالة': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("🦋 | الأجواء هادئة.. لا توجد شياطين حالياً.", threadID, messageID);
        return sendMessage(`${LINE}\n👹 الشيطان: ${styleText(cave.monster.Name)}\n🩸 الصحة: ${styleNum(cave.monster.currentHP)} / ${styleNum(cave.monster.HP)}\n👥 المحاربون: ${styleNum(cave.participants.length)}\n${LINE}`, threadID, messageID);
      }
    }
  }
};
