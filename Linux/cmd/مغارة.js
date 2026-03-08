const { getUser, updateUser } = require('../data/user');
const weapons = require('../data/weapon.json');
const monsters = require('../data/monster.json');
const { styleText, styleNum } = require('../tools');
const axios = require('axios')
const LINE = "───────────";
const BULLET = "⊳";

if (!global.activeCaves) global.activeCaves = new Map();

module.exports = {
  name: 'مغارة',
  type: ['الالعاب'],
  cooldown: 5,
  rank: 0,
  run: async (api, event, commands, args) => {
    const { senderID, threadID, messageID } = event;
    const { sendMessage } = api;
    
    const user = await getUser(senderID);
    if (!user) return sendMessage('ليس لديك حساب! قم بإنشاء حساب أولاً.', threadID, messageID);
    
    const calculatePower = (u) => {
      const base = (u.character.HP || 0) + (u.character.ATK || 0) + (u.character.DEF || 0) + (u.character.SPD || 0);
      return base;
    };
    
    const getRank = (power, user) => {
      const ex = user.cave.exp || 0
      if ((power + ex) < 10000) return 'F';
      if ((power + ex) < 50000) return 'E';
      if ((power + ex) < 200000) return 'D';
      if ((power + ex) < 800000) return 'C';
      if ((power + ex) < 2500000) return 'B';
      if ((power + ex) < 10000000) return 'A';
      return 'S';
    };
    
    const userPower = calculatePower(user);
    const userRank = getRank(userPower, user);
    const subCommand = args[0];
    
    if (!subCommand) {
      // ... (القائمة الرئيسية كما هي)
      let msg = `${LINE}\n`;
      msg += `${BULLET} مغارة ملفي : عرض بياناتك\n`;
      msg += `${BULLET} مغارة انشاء <الرتبة> : فتح مغارة جديدة\n`;
      msg += `${BULLET} مغارة انضمام : دخول مغارة حالية\n`;
      msg += `${BULLET} مغارة شراء : متجر الأسلحة\n`;
      msg += `${BULLET} مغارة اسلحتي : عرض ممتلكاتك\n`;
      msg += `${BULLET} مغارة تجهيز <الرقم> : ارتداء سلاح\n`;
      msg += `${BULLET} مغارة هجوم : ضرب الوحش\n`;
      msg += `${BULLET} مغارة حالة : وضع المغارة الحالي\n`;
      return sendMessage(msg, threadID, messageID);
    }
    
    switch (subCommand) {
      case 'شراء': {
        const weaponIndex = parseInt(args[1]) - 1;
        // جلب أسماء الأسلحة التي يمتلكها المستخدم حالياً
        const ownedWeaponNames = user.cave.weapon ? user.cave.weapon.map(w => w.name) : [];
        
        if (isNaN(weaponIndex)) {
          let msg = `__متجر الأسلحة__\n${LINE}\n`;
          let displayCount = 0;
          weapons.forEach((w, i) => {
            // الشرط: السعر مناسب + اللاعب لا يمتلك السلاح بالفعل
            if (w.price <= (user.money) && !ownedWeaponNames.includes(w.name)) {
              msg += `${styleNum(i + 1)}.${w.name}\n       ${styleNum(w.price)} $\n\n`;
              displayCount++;
            }
          });
          if (displayCount === 0) msg += "لا توجد أسلحة جديدة متاحة لشرائها بمالك الحالي.";
          msg += `\nللشراء: مغارة شراء <رقم السلاح>`;
          return sendMessage(msg, threadID, messageID);
        }
        
        const targetWeapon = weapons[weaponIndex];
        if (!targetWeapon) return sendMessage("سلاح غير موجود", threadID, messageID);
        if (targetWeapon.price > user.money) return sendMessage("مالك غير كافٍ لشراء هذا السلاح", threadID, messageID);
        if (ownedWeaponNames.includes(targetWeapon.name)) return sendMessage("أنت تمتلك هذا السلاح بالفعل!", threadID, messageID);
        
        user.money -= targetWeapon.price;
        if (!user.cave.weapon) user.cave.weapon = [];
        user.cave.weapon.push({ ...targetWeapon, isUsed: false });
        
        await updateUser(senderID, user);
        return sendMessage(`تم شراء ${styleText(targetWeapon.name)} بنجاح`, threadID, messageID);
      }
      
      case 'اسلحتي': {
        if (!user.cave.weapon || user.cave.weapon.length === 0) return sendMessage("لا تملك أسلحة", threadID, messageID);
        let msg = `__حقيبة الأسلحة__\n${LINE}\n`;
        user.cave.weapon.forEach((w, i) => {
          msg += `${styleNum(i + 1)}.${w.name}    ${w.isUsed ? "  [مجهز]" : ""}\n`;
          msg += `${styleText('atk')}: +${w.ATK}   ${styleText('def')}: +${w.DEF}    ${styleText('spd')}: +${w.SPD}   ${styleText('hp')}: +${w.HP}\n\n`;
        });
        return sendMessage(msg, threadID, messageID);
      }
      
      case 'تجهيز': {
        const weaponIndex = parseInt(args[1]) - 1;
        if (isNaN(weaponIndex) || !user.cave.weapon || !user.cave.weapon[weaponIndex]) return sendMessage("رقم السلاح غير صحيح", threadID, messageID);
        
        const targetWeapon = user.cave.weapon[weaponIndex];
        const currentlyEquipped = user.cave.weapon.find(w => w.isUsed);
        let actionMsg = "";
        
        // 1. إذا كان هناك سلاح مجهز، قم بنزع إحصائياته أولاً
        if (currentlyEquipped) {
          user.character.HP -= (currentlyEquipped.HP || 0);
          user.character.ATK -= (currentlyEquipped.ATK || 0);
          user.character.DEF -= (currentlyEquipped.DEF || 0);
          user.character.SPD -= (currentlyEquipped.SPD || 0);
          currentlyEquipped.isUsed = false;
        }
        
        // 2. التحقق مما إذا كان اللاعب يريد تجهيز نفس السلاح (نزع فقط) أم سلاح جديد
        if (currentlyEquipped && currentlyEquipped.name === targetWeapon.name) {
          // اللاعب اختار نفس السلاح، تم نزعه في الخطوة السابقة، نتوقف هنا
          actionMsg = `تم نزع ${styleText(targetWeapon.name)}`;
        } else {
          // اللاعب اختار سلاحاً جديداً (أو لم يكن يرتدي شيئاً)، نضيف إحصائياته
          targetWeapon.isUsed = true;
          user.character.HP += (targetWeapon.HP || 0);
          user.character.ATK += (targetWeapon.ATK || 0);
          user.character.DEF += (targetWeapon.DEF || 0);
          user.character.SPD += (targetWeapon.SPD || 0);
          actionMsg = `تم تجهيز ${styleText(targetWeapon.name)}`;
        }
        
        // التأكد من عدم نزول القيم عن الصفر (حماية إضافية)
        if (user.character.HP < 0) user.character.HP = 1;
        
        await updateUser(senderID, user);
        return sendMessage(actionMsg, threadID, messageID);
      }
      
      case 'انشاء': {
        // ... (نفس كود الإنشاء دون تغيير كبير، فقط تأكد من المسافات)
        const rankReq = args[1]?.toUpperCase();
        const ranks = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
        if (!ranks.includes(rankReq)) return sendMessage(`حدد رتبة صحيحة\n${styleText(ranks.join('  '))}`, threadID, messageID);
        
        const playerRankIndex = ranks.indexOf(userRank);
        const requestedRankIndex = ranks.indexOf(rankReq);
        if (requestedRankIndex > playerRankIndex) return sendMessage(`رتبتك الحالية [ ${userRank} ] لا تسمح بفتح مغارة رتبة [ ${rankReq} ]`, threadID, messageID);
        
        const rankIndex = ranks.indexOf(rankReq);
        const minLocation = rankIndex * 3;
        const maxLocation = minLocation + 2;
        const randomLocationIndex = Math.floor(Math.random() * (maxLocation - minLocation + 1)) + minLocation;
        const region = monsters[randomLocationIndex];
        const monster = region.creature[Math.floor(Math.random() * region.creature.length)];
        
        const timer = setTimeout(() => {
          if (global.activeCaves.has(threadID)) {
            global.activeCaves.delete(threadID);
            sendMessage(`انتهى الوقت المحدد للمغارة في [ ${region.location} ] وتم إغلاقها تلقائيا`, threadID);
          }
        }, 5 * 60 * 1000);
        
        global.activeCaves.set(threadID, {
          monster: { ...monster, currentHP: monster.HP },
          participants: [senderID],
          locationName: region.location,
          timeout: timer,
          totalAttacks: 0
        });
        
        // معالجة الصورة (نفس الكود السابق)
        try {
          const res = await axios.get(monster.image, {
            responseType: "stream",
            timeout: 15000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          const msg = {
            body: `تم فتح مغارة في  ${styleText(region.location)} \n${styleText('rank')}:  ${rankReq} \n${styleText('monster')}: ${monster.Name}\n${styleText('hp')}: ${styleNum(monster.HP)}\n${styleText('atk')}: ${styleNum(monster.ATK)}\n${styleText('def')}: ${styleNum(monster.DEF)}\nللانضمام: مغارة انضمام`,
            attachment: res.data
          };
          return sendMessage(msg, threadID, messageID);
        } catch (e) {
          return sendMessage("حدث خطأ في تحميل صورة الوحش، لكن المغارة مفتوحة.", threadID, messageID);
        }
      }
      
      case 'هجوم': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("لا توجد مغارة نشطة", threadID, messageID);
        if (!cave.participants.includes(senderID)) return sendMessage("انضم للمغارة أولا", threadID, messageID);
        if ((user.character.HP || 0) <= 0) return sendMessage('انت ميت اكتب شفاء', threadID, messageID);
        
        // --- خوارزمية حساب الضرر الجديدة ---
        const playerAtk = user.character.ATK || 10;
        const monsterDef = cave.monster.DEF || 0;
        
        // 1. حساب الضرر الأساسي (الهجوم - 40% من دفاع الخصم)
        // هذا يجعل للدفاع قيمة ولكن لا يلغي الضرر تماماً
        let baseDamage = playerAtk - (monsterDef * 0.4);
        
        // 2. التباين العشوائي (بين 90% و 110%)
        const variance = (Math.random() * 0.2) + 0.9;
        let finalDamage = Math.floor(baseDamage * variance);
        
        // 3. الضربة الحرجة (Critical Hit) تعتمد على الحظ (10%)
        let isCrit = Math.random() < 0.1;
        let critMsg = "";
        if (isCrit) {
          finalDamage = Math.floor(finalDamage * 1.5);
          critMsg = " (ضربة حرجة!)";
        }
        
        // 4. التأكد من وجود حد أدنى للضرر (على الأقل 5% من هجوم اللاعب)
        // حتى لو كان دفاع الوحش عالياً جداً، اللاعب سيسبب ضرراً بسيطاً
        const minDamage = Math.max(1, Math.floor(playerAtk * 0.05));
        finalDamage = Math.max(minDamage, finalDamage);
        
        cave.monster.currentHP -= finalDamage;
        cave.totalAttacks += 1;
        
        let extraMsg = "";
        // هجوم الوحش المضاد
        if (cave.totalAttacks % 10 === 0) {
          const randomVictimID = cave.participants[Math.floor(Math.random() * cave.participants.length)];
          const victim = await getUser(randomVictimID);
          if (victim) {
            // حساب ضرر الوحش بشكل مشابه
            const mAtk = cave.monster.ATK || 50;
            const pDef = victim.character.DEF || 0;
            const monsterDamage = Math.max(10, Math.floor(mAtk - (pDef * 0.3)));
            
            victim.character.HP = Math.max(0, (victim.character.HP || 0) - monsterDamage);
            await updateUser(randomVictimID, victim);
            extraMsg = `\nقام ${cave.monster.Name} بهجوم مضاد على ${victim.character.name} بضرر ${styleNum(monsterDamage)}`;
          }
        }
        
        if (cave.monster.currentHP <= 0) {
          clearTimeout(cave.timeout);
          const totalExp = cave.monster.exp / 2 || 0;
          const totalMoney = cave.monster.price / 2 || 0;
          const count = cave.participants.length;
          const sharedExp = Math.floor(totalExp / count);
          const sharedMoney = Math.floor(totalMoney / count);
          
          for (const pID of cave.participants) {
            const pUser = await getUser(pID);
            if (pUser) {
              pUser.cave.exp = (pUser.cave.exp || 0) + sharedExp;
              pUser.money = (pUser.money || 0) + sharedMoney;
              await updateUser(pID, pUser);
            }
          }
          global.activeCaves.delete(threadID);
          return sendMessage(`تم تصفية الوحش ${cave.monster.Name}\nالموقع: ${styleText(cave.locationName)}\n${styleText('الارباح')}: +${styleNum(sharedMoney)} \n${styleText('exp')}: +${styleNum(sharedExp)}`, threadID);
        }
        return sendMessage(`لقد تلقي الوحش ${cave.monster.Name}\n${styleText('ضرر')} قدره ${styleNum(finalDamage)}\n${styleText('hp')}: ${styleNum(cave.monster.currentHP)}${extraMsg}`, threadID, messageID);
      }
      
      case 'انضمام': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("لا توجد مغارة مفتوحة", threadID, messageID);
        if (cave.participants.includes(senderID)) return sendMessage("أنت منضم بالفعل", threadID, messageID);
        cave.participants.push(senderID);
        return sendMessage(`انضم ${user.character.name} للفريق`, threadID, messageID);
      }
      
      case 'ملفي': {
        const equipped = user.cave.weapon?.find(w => w.isUsed) || { name: "لا يوجد" };
        let msg = `__ملف الصياد__${user.character.name}__\n${LINE}\n`;
        msg += `${styleText('rank')}: ${styleText(userRank)}\n`;
        msg += `${styleText('power')}: ${styleNum(userPower)}\n`;
        msg += `${styleText('hp')}: ${styleNum(user.character.HP) || 0}\n`;
        msg += `${styleText('wopon')}: ${equipped.name}\n`;
        msg += `${styleText('exp')}: ${user.cave.exp || 0}\n`;
        return sendMessage(msg, threadID, messageID);
      }
      
      case 'حالة': {
        const cave = global.activeCaves.get(threadID);
        if (!cave) return sendMessage("لا توجد مغارة نشطة", threadID, messageID);
        return sendMessage(`${styleText('monster')}: ${styleText(cave.monster.Name)}\n${styleText('hp')}: ${styleNum(cave.monster.currentHP)} / ${styleNum(cave.monster.HP)}\n${styleText('hunters')}: ${styleNum(cave.participants.length)}`, threadID, messageID);
      }
    }
  }
};
