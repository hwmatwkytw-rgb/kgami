const { getUser, updateUser } = require('../data/user');
const config = require('../config.json');
const { styleNum } = require('../tools')
const CONSTS = {
  MIN_HIT_PCT: 0.30,
  MAX_HIT_PCT: 0.95,
  BASE_CRIT_PCT: 0.05,
  MIN_DMG: 5,
  POWER_GAP_LIMIT: 5000
};

const NEN_MODIFIERS = {
  'معزز': { atk: 1.2, def: 1.0, spd: 1.0, iq: 0.9 },
  'محول': { atk: 1.0, def: 0.9, spd: 1.1, iq: 1.1 },
  'باعث': { atk: 1.1, def: 0.9, spd: 1.2, iq: 1.0 },
  'متخصص': { atk: 1.0, def: 1.0, spd: 1.0, iq: 1.3 },
  'مجسد': { atk: 0.9, def: 1.3, spd: 0.8, iq: 1.0 },
  'متلاعب': { atk: 1.0, def: 1.0, spd: 1.0, iq: 1.2 }
};

const Utils = {
  rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  calcTotalPower: (char) => (char.ATK || 0) + (char.DEF || 0) + (char.SPD || 0) + (char.IQ || 0)
};

class BattleSystem {
  constructor(attacker, defender) {
    this.A = attacker.character;
    this.D = defender.character;
    
    this.modA = NEN_MODIFIERS[this.A.type] || { atk: 1, def: 1, spd: 1, iq: 1 };
    this.modD = NEN_MODIFIERS[this.D.type] || { atk: 1, def: 1, spd: 1, iq: 1 };
    
    this.hitText = '';
    this.isCrit = false;
  }
  
  getStat(char, mod, statName) {
    return (char[statName] || 10) * (mod[statName.toLowerCase()] || 1);
  }
  
  calcDamage() {
    const Atk = this.getStat(this.A, this.modA, 'ATK');
    const Def = this.getStat(this.D, this.modD, 'DEF');
    const Spd_A = this.getStat(this.A, this.modA, 'SPD');
    const Spd_D = this.getStat(this.D, this.modD, 'SPD');
    const Iq_A = this.getStat(this.A, this.modA, 'IQ');
    
    // حساب نسبة الإصابة
    let hitChance = CONSTS.MAX_HIT_PCT;
    if (Spd_D > Spd_A) {
      hitChance -= ((Spd_D - Spd_A) / (Spd_A + 100));
    }
    hitChance += (Iq_A / 5000);
    hitChance = Math.max(CONSTS.MIN_HIT_PCT, Math.min(CONSTS.MAX_HIT_PCT, hitChance));
    
    if (Math.random() > hitChance) {
      this.hitText = "فشل الهجوم (تفادي)";
      return 0;
    }
    
    // حساب الضربة الحرجة
    let critChance = CONSTS.BASE_CRIT_PCT + (Iq_A / 2000) + (Spd_A / 3000);
    this.isCrit = Math.random() < critChance;
    
    // معادلة الضرر
    let damageRatio = Atk / (Atk + (Def * 1.2));
    let baseDmg = Atk * damageRatio;
    
    baseDmg *= 0.65;
    
    if (this.isCrit) {
      const critMult = 1.5 + (Iq_A / 1000);
      baseDmg *= critMult;
      this.hitText = "إصابة حرجة";
    } else {
      this.hitText = "إصابة";
    }
    
    const variance = (Math.random() * 0.2) + 0.9;
    let finalDmg = Math.floor(baseDmg * variance);
    
    return Math.max(CONSTS.MIN_DMG, finalDmg);
  }
  
  execute() {
    const damage = this.calcDamage();
    let actualDmg = Math.min(damage, this.D.HP);
    
    this.D.HP -= actualDmg;
    if (this.D.HP < 0) this.D.HP = 0;
    
    return {
      attackerChar: this.A,
      defenderChar: this.D,
      damage: actualDmg,
      hitText: this.hitText,
      isDead: this.D.HP <= 0
    };
  }
}

module.exports = {
  name: 'هجوم',
  type: ['الالعاب'],
  otherName: ['attack', 'اهجم'],
  cooldown: 5,
  rank: 0,
  run: async (api, event) => {
    try {
      if (!event.messageReply || !event.messageReply.senderID) {
        return api.sendMessage("رد على زول يا باطل .", event.threadID, event.messageID);
      }
      
      const attackerId = event.senderID;
      const defenderId = event.messageReply.senderID;
      
      if (attackerId === defenderId) return api.sendMessage("لا بتقدر تضرب نفسك.", event.threadID, event.messageID);
      
      const [attackerDoc, defenderDoc] = await Promise.all([getUser(attackerId), getUser(defenderId)]);
      if (!attackerDoc?.character) return api.sendMessage("أنت غير مسجل.", event.threadID, event.messageID);
      if (!defenderDoc?.character) return api.sendMessage("الخصم غير مسجل.", event.threadID, event.messageID);
      if (attackerDoc.character.HP <= 0) return api.sendMessage("أنت ميت.", event.threadID, event.messageID);
      if (defenderDoc.character.HP <= 0) return api.sendMessage("الضرب في الميت حرام", event.threadID, event.messageID);
      if (attackerDoc?.character.location != defenderDoc?.character.location) return api.sendMessage(`انت في ${attackerDoc.character.location} وهو في ${defenderDoc.character.location} داير تضربو كيف ؟`, event.threadID, event.messageID)      
      // نظام منع التنمر
      if (config.ATTACKD === true) {
        const powerA = Utils.calcTotalPower(attackerDoc.character);
        const powerD = Utils.calcTotalPower(defenderDoc.character);
        const diff = powerA - powerD;
        
        if (diff > CONSTS.POWER_GAP_LIMIT) {
          return api.sendMessage("ممنوع التنمر علي الضعفاء", event.threadID, event.messageID);
        }
        
        if (diff < -CONSTS.POWER_GAP_LIMIT) {
          return api.sendMessage("شوف زول قدرك ااجنا", event.threadID, event.messageID);
        }
      }
      
      const battle = new BattleSystem(attackerDoc, defenderDoc);
      const result = battle.execute();
      
      await Promise.all([
        updateUser(attackerId, { character: attackerDoc.character }),
        updateUser(defenderId, { character: defenderDoc.character })
      ]);
      
      let msg = `───────\n`
      msg += `[ ${attackerDoc.character.name} ضد ${defenderDoc.character.name} ]\n`;
      msg += `⊳الضرر -${styleNum(result.damage) || '𝟶'}\n`;
      msg += `───────\n`;
      msg += `${defenderDoc.character.name}: ${styleNum(result.defenderChar.HP)} ☇ ${styleNum(defenderDoc.character.XHP)}`;
      
      if (result.isDead) msg += `\nتم اسقاط الباطل`;
      
      return api.sendMessage(msg, event.threadID, event.messageID);
      
    } catch (err) {
      console.error(err);
      return api.sendMessage("خطأ في النظام.", event.threadID, event.messageID);
    }
  }
}
