// commands/register.js
const { getUser, saveUser, getAllUsers } = require('../data/user'); 
const log = require('../logger');
const config = require('../config.json');

const MAX_NAME_LENGTH = 10;
const MIN_NAME_LENGTH = 3;

const SEP = "⎔────────────⎔";
const BUTTERFLY = "㊙︎";

// تحويل الفئات لتناسب عالم قاتل الشياطين (نفس توزيع الإحصائيات)
function getInitialStatsByType(type) {
  const stats = {
    'ماء':     { HP: 350, ATK: 220, DEF: 180, SPD: 120, IQ: 130 },
    'لهب':    { HP: 320, ATK: 260, DEF: 150, SPD: 130, IQ: 140 },
    'رعد':    { HP: 300, ATK: 200, DEF: 140, SPD: 200, IQ: 160 },
    'صخر':    { HP: 280, ATK: 210, DEF: 170, SPD: 170, IQ: 170 },
    'رياح':   { HP: 260, ATK: 160, DEF: 140, SPD: 230, IQ: 210 },
    'شمس':   { HP: 300, ATK: 180, DEF: 150, SPD: 150, IQ: 220 }
  };

  return stats[type] || stats['ماء'];
}

function getRandomBreathType() {
  const breathTypes = ['ماء', 'ماء', 'لهب', 'لهب', 'رعد', 'رعد', 'صخر', 'صخر', 'رياح', 'شمس'];
  const randomIndex = Math.floor(Math.random() * breathTypes.length);
  return breathTypes[randomIndex];
}

function sanitizeName(rawName) {
    if (!rawName) return null;
    let cleanedName = rawName.trim();
    const invalidCharRegex = /[^أ-ي0-9\s]/g;
    if (invalidCharRegex.test(cleanedName)) {
        return null; 
    }
    return cleanedName;
}

module.exports = {
  name: 'تسجيل',
  otherName: ['سجلني', 'انشاء'],
  rank: 0,
  type: 'النظام',
  discretion: 'الانضمام لفيلق قتلة الشياطين وإنشاء حسابك الخاص.', 
  cooldown: 3,
  run: async (api, event) => {
    try {
      const senderId = event.senderID;
      const threadID = event.threadID;
      const messageID = event.messageID;

      const exist = await getUser(senderId);
      if (exist) {
        api.setMessageReaction('🦋', messageID, threadID);
        return api.sendMessage(
          `${BUTTERFLY} | "أوه؟ أنت عضو في الفيلق بالفعل يا ${exist.character.name}."`,
          threadID,
          messageID
        );
      }

      const rawArgs = event.body.trim().split(/\s+/).slice(1);
      const fullInput = rawArgs.join(" ");
      const sanitizedFullInput = sanitizeName(fullInput);

      if (!sanitizedFullInput) {
        api.setMessageReaction('❌', messageID);
        return api.sendMessage(
            `${BUTTERFLY} | "عليك كتابة اسمك بشكل صحيح لتسجيلك في السجلات.. مثال: تسجيل سينكو"`,
            threadID,
            messageID
        );
      }
      
      const sanitizedArgs = sanitizedFullInput.split(/\s+/).filter(Boolean);
      let name = '';
      const firstWord = sanitizedArgs[0];
      const secondWord = sanitizedArgs.length > 1 ? sanitizedArgs[1] : null;

      if (!firstWord) {
        api.setMessageReaction('💔', messageID);
        return api.sendMessage(
          `${BUTTERFLY} | "أين الاسم؟ لا يمكنني تسجيل محارب بدون اسم."`,
          threadID,
          messageID
        );
      }
      
      if (firstWord.length >= MIN_NAME_LENGTH) {
        name = firstWord;
      } else if (firstWord.length < MIN_NAME_LENGTH) {
        if (secondWord) {
          name = secondWord;
        } else {
          api.setMessageReaction('😕', messageID);
          return api.sendMessage(
            `${BUTTERFLY} | "الاسم قصير جداً.. نحتاج لـ ${MIN_NAME_LENGTH} أحرف على الأقل."`,
            threadID,
            messageID
          );
        }
      }

      if (name.length > MAX_NAME_LENGTH) {
        api.setMessageReaction('❌', messageID);
        return api.sendMessage(
          `${BUTTERFLY} | "هذا الاسم طويل جداً، لن يسعه سجل الفيلق."`,
          threadID,
          messageID
        );
      }
      
      const allUsers = await getAllUsers();
      const nameToCheck = name.toLowerCase(); 
      const isDuplicate = allUsers.some(user => user.character.name.toLowerCase() === nameToCheck);
      
      if (isDuplicate) {
          api.setMessageReaction('📛', messageID);
          return api.sendMessage(
              `${BUTTERFLY} | "هذا الاسم محجوز لمحارب آخر، اختر اسماً يميزك."`,
              threadID,
              messageID
          );
      }

      const randomType = getRandomBreathType();
      const stats = getInitialStatsByType(randomType);

      const newUser = {
        id: senderId,
        gold: 1,
        diamond: 50,
        money: 1000,
        character: {
          name, 
          type: randomType,
          level: 1,
          rating: 0,
          bar: ['⓿', ''],
          HP: stats.HP, XHP: stats.HP,
          ATK: stats.ATK, XATK: stats.ATK,
          DEF: stats.DEF, XDEF: stats.DEF,
          SPD: stats.SPD, XSPD: stats.SPD,
          IQ: stats.IQ, XIQ: stats.IQ
        }
      };

      await saveUser(newUser);

      api.setMessageReaction('✅', messageID);

      return api.sendMessage(
        `${SEP}\n` +
        `${BUTTERFLY} | تـم الـانـضـمـام لـلـفـيـلـق بـنـجـاح\n` +
        `${SEP}\n` +
        `⌬ الاسم: ${name}\n` +
        `⌬ تنفس: ${randomType}\n` +
        `✨ "مرحباً بك في مواجهة الظلام.. كُن قوياً." ✨\n` +
        `${SEP}`,
        threadID,
        messageID
      );

    } catch (error) {
      log.error('Error in تسجيل command:' + error);
      api.sendMessage(`${BUTTERFLY} | حدث خطأ أثناء التسجيل: ${error.message}`, threadID, messageID);
    }
  }
};
