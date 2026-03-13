const { getUser, updateUser } = require('../data/user');
const weapons = require('../data/weapon.json');
const monsters = require('../data/monster.json');
const { styleText, styleNum } = require('../tools');
const axios = require('axios');

const SEP = "●───── ✾ ⌬ ✾ ─────●";
const FLOWER = "✾";
const ARROW = "➪";

if (!global.activeCaves) global.activeCaves = new Map();

module.exports = {
  name: 'بعثة',
  otherName: ['مغارة', 'صيد', 'mission'],
  category: 'الألعاب', // تمت إضافته لقائمة الألعاب
  cooldown: 5,
  rank: 0,
  run: async (api, event, args) => {
    const { senderID, threadID, messageID } = event;
    const { sendMessage } = api;
    
    const user = await getUser(senderID);
    if (!user || !user.character) return sendMessage(`${FLOWER} ┇ عذراً.. عليك التسجيل أولاً قبل الخروج في بعثة.`, threadID, messageID);
    
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
    const userRankLetter = userRankDisplay.match(/\(([^)]+)\)/)[1];
    const subCommand = args[0];
    
    // القائمة الرئيسية للأمر
    if (!subCommand) {
      let msg = `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText('MISSION HEADQUARTERS')} ⟭\n${SEP}\n`;
      msg += `✾ ┇ بعثة ملفي ${ARROW} عرض رتبتك وسجلك\n`;
      msg += `✾ ┇ بعثة انشاء <الرتبة> ${ARROW} بدء رحلة صيد\n`;
      msg += `✾ ┇ بعثة انضمام ${ARROW} مشاركة الرفاق في القتال\n`;
      msg += `✾ ┇ بعثة شراء ${ARROW} حداد السيوف (المتجر)\n`;
      msg += `✾ ┇ بعثة اسلحتي ${ARROW} استعراض نصولك\n`;
      msg += `✾ ┇ بعثة تجهيز <رقم> ${ARROW} اختيار السلاح\n`;
      msg += `✾ ┇ بعثة هجوم ${ARROW} توجيه ضربة للشيطان\n`;
      msg += `✾ ┇ بعثة حالة ${ARROW} رصد قوة الشيطان الحالي\n\n`;
      msg += `${SEP}`;
      return sendMessage(msg, threadID, messageID);
    }
    
    switch (subCommand) {
      case 'شراء': {
        const weaponIndex = parseInt(args[1]) - 1;
        const ownedWeaponNames = user.cave.weapon ? user.cave.weapon.map(w => w.name) : [];
        
        if (isNaN(weaponIndex)) {
          let msg = `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText('WEAPON SHOP')} ⟭\n${SEP}\n`;
          let displayCount = 0;
          weapons.forEach((w, i) => {
            if (w.price <= (user.money) && !ownedWeaponNames.includes(w.name)) {
              msg += `✾ ┇ ${styleNum(i + 1)}. ${styleText(w.name)}\n   💰 السعر: ${styleNum(w.price)} ¥\n\n`;
              displayCount++;
            }
          });
          if (displayCount === 0) msg += `${FLOWER} ┇ لا توجد نصول تناسب ميزانيتك حالياً.`;
          msg += `\n${SEP}`;
          return sendMessage(msg, threadID, messageID);
        }
        
        const targetWeapon = weapons[weaponIndex];
        if (!targetWeapon) return sendMessage(`${FLOWER} ┇ هذا السلاح غير موجود.`, threadID, messageID);
        if (targetWeapon.price > user.money) return sendMessage(`${FLOWER} ┇ ينقصك المال لاقتناء هذا النصل.`, threadID, messageID);
        
        user.money -= targetWeapon.price;
        if (!user.cave.weapon) user.cave.weapon = [];
        user.cave.weapon.push({ ...targetWeapon, isUsed: false });
        
        await updateUser(senderID, user);
        return sendMessage(`${SEP}\n${FLOWER} ┇ مبارك.. حصلت على ${styleText(targetWeapon.name)}\n${SEP}`, threadID, messageID);
      }
      
      case 'اسلحتي': {
        if (!user.cave.weapon || user.cave.weapon.length === 0) return sendMessage(`${FLOWER} ┇ حقيبتك فارغة حالياً.`, threadID, messageID);
        let msg = `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText('MY WEAPONS')} ⟭\n${SEP}\n`;
        user.cave.weapon.forEach((w, i) => {
          msg += `✾ ┇ ${styleNum(i + 1)}. ${styleText(w.name)} ${w.isUsed ? ` ✅ [مجهز]` : ""}\n`;
          msg += `   ⚔️ ATK: +${w.ATK} | 🛡️ DEF: +${w.DEF}\n\n`;
        });
        msg += `${SEP}`;
        return sendMessage(msg, threadID, messageID);
      }

      case 'تجهيز': {
        const weaponIndex = parseInt(args[1]) - 1;
        if (isNaN(weaponIndex) || !user.cave.weapon?.[weaponIndex]) return sendMessage(`${FLOWER} ┇ رقم السلاح غير صحيح.`, threadID, messageID);
        
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
          return sendMessage(`${FLOWER} ┇ تم نزع ${styleText(targetWeapon.name)}.`, threadID, messageID);
        } else {
          targetWeapon.isUsed = true;
          user.character.HP += (targetWeapon.HP || 0);
          user.character.ATK += (targetWeapon.ATK || 0);
          user.character.DEF += (targetWeapon.DEF || 0);
          user.character.SPD += (targetWeapon.SPD || 0);
          await updateUser(senderID, user);
          return sendMessage(`${FLOWER} ┇ تم تجهيز ${styleText(targetWeapon.name)}.`, threadID, messageID);
        }
      }

      case 'انشاء': {
        const rankReq = args[1]?.toUpperCase();
        const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
        if (!ranks.includes(rankReq)) return sendMessage(`${FLOWER} ┇ حدد الرتبة [ ${ranks.join(' - ')} ]`, threadID, messageID);
        
        const playerRankIndex = ranks.indexOf(userRankLetter);
        const requestedRankIndex = ranks.indexOf(rankReq);
        if (requestedRankIndex > playerRankIndex) return sendMessage(`${FLOWER} ┇ رتبتك [ ${userRankDisplay} ] لا تسمح بهذه المهمة.`, threadID, messageID);
        
        const minLocation = requestedRankIndex * 3;
        const region = monsters[Math.floor(Math.random() * 3) + minLocation];
        const monster = region.creature[Math.floor(Math.random() * region.creature.length)];
        
        const timer = setTimeout(() => {
          if (global.activeCaves.has(threadID)) {
            global.activeCaves.delete(threadID);
            sendMessage(`${SEP}\n${FLOWER} ┇ انتهى الوقت وهرب الشيطان في الظلام.\n${SEP}`, threadID);
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
            body: `${SEP}\n🚨 ${styleText('MONSTER ALERT')}\n${SEP}\n📍 الموقع: ${styleText(region.location)}\n🎭 الرتبة: ${rankReq}\n👹 الشيطان: ${monster.Name}\n🩸 الصحة: ${styleNum(monster.HP)}\n⚔️ القوة: ${styleNum(monster.ATK)}\n\n${SEP}`,
            attachment: res.data
          }, threadID, messageID);
        } catch (e) {
          return sendMessage(`${SEP}\n👹 ظهر الشيطان ${monster.Name} في ${region.location}!\n${SEP}`, threadID, messageID);
        }
      }
      
      case 'هجوم': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage(`${FLOWER} ┇ لا توجد معركة حالياً.`, threadID, messageID);
        if (!cave.participants.includes(senderID)) return sendMessage(`${FLOWER} ┇ انضم للفريق أولاً.`, threadID, messageID);
        if ((user.character.HP || 0) <= 0) return sendMessage(`${FLOWER} ┇ جسدك منهك.. استعمل شفاء أولاً.`, threadID, messageID);
        
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
          extraMsg = `\n${FLOWER} هجوم مضاد! أصيب ${victim.character.name} بضرر ${styleNum(mDmg)}`;
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
          return sendMessage(`${SEP}\n✅ تم سحق ${cave.monster.Name}!\n💰 الغنائم: +${styleNum(sharedMoney)} ¥\n✨ الخبرة: +${styleNum(sharedExp)}\n${SEP}`, threadID);
        }
        return sendMessage(`${FLOWER} ضربة بقوة ${styleNum(finalDamage)}${isCrit ? " (حرجة!)" : ""}\n🩸 صحة الشيطان: ${styleNum(cave.monster.currentHP)}${extraMsg}`, threadID, messageID);
      }
      
      case 'ملفي': {
        const equipped = user.cave.weapon?.find(w => w.isUsed) || { name: "يد عارية" };
        let msg = `${SEP}\n   ✾ ┇ ⦿ ⟬ ${styleText('PLAYER DOSSIER')} ⟭\n${SEP}\n`;
        msg += `✾ ┇ الرتبة: ${styleText(userRankDisplay)}\n`;
        msg += `✾ ┇ القدرة: ${styleNum(userPower)}\n`;
        msg += `✾ ┇ الصحة: ${styleNum(user.character.HP)}\n`;
        msg += `✾ ┇ السلاح: ${styleText(equipped.name)}\n`;
        msg += `✾ ┇ الخبرة: ${styleNum(user.cave.exp || 0)}\n\n`;
        msg += `${SEP}`;
        return sendMessage(msg, threadID, messageID);
      }

      case 'انضمام': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage(`${FLOWER} ┇ لا توجد معركة جارية.`, threadID, messageID);
        if (cave.participants.includes(senderID)) return sendMessage(`${FLOWER} ┇ أنت في المعركة بالفعل.`, threadID, messageID);
        cave.participants.push(senderID);
        return sendMessage(`${FLOWER} ┇ انضم ${user.character.name} إلى الفريق.`, threadID, messageID);
      }

      case 'حالة': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage(`${FLOWER} ┇ الأجواء هادئة حالياً.`, threadID, messageID);
        return sendMessage(`${SEP}\n👹 الشيطان: ${styleText(cave.monster.Name)}\n🩸 الصحة: ${styleNum(cave.monster.currentHP)} / ${styleNum(cave.monster.HP)}\n👥 المحاربون: ${styleNum(cave.participants.length)}\n${SEP}`, threadID, messageID);
      }
    }
  }
};
