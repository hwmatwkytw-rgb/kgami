// handlers/handleCmd.js
const { getUser } = require("../data/user");
const path = require('path');
const configPath = path.resolve(__dirname, '../config.json');
const initialConfig = require(configPath); 
const log = require("../logger");
const con = require('../config.json')
const DEFAULT_COOLDOWN = 5;
const cooldowns = new Map();

function reloadConfig() {
    try {
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
    } catch (e) {
        log.error("Error reloading config: " + e);
        return initialConfig;
    }
}

function normalizeIds(input) {
    if (!input) return [];
    const arr = Array.isArray(input) ? input : [input];
    return arr.map(id => String(id).trim());
}

function getUserRank(senderID) {
    const currentConfig = reloadConfig();
    const uid = String(senderID).trim();
    const editors = normalizeIds(currentConfig.editor);
    const admins = normalizeIds(currentConfig.AdminsID);

    if (editors.includes(uid)) return 2; 
    if (admins.includes(uid)) return 1; 
    return 0; 
}

async function fetchUserInfo(api, userIDs) {
    if (!api || !Array.isArray(userIDs) || userIDs.length === 0) return {};
    try {
        const userInfo = await api.getUserInfo(userIDs);
        return Object.values(userInfo).map(user => ({
            id: user.userID,
            name: user.name
        }));
    } catch (e) {
        log.error("Error fetching user info:" + e);
        return {};
    }
}

async function handleCommand(api, event, commands) {
    const config = reloadConfig(); 

    if (!commands || !Array.isArray(commands) || !event.body) {
        return false;
    }

    const raw = event.body.trim();  
    let commandName = "";  
    let args = [];  
    let isCommandFound = false;  

    try {  
        const noPrefixCommand = commands.find(cmd =>  
            cmd.prefix === false &&  
            raw.split(/\s+/)[0].toLowerCase() === cmd.name.toLowerCase()  
        );  

        if (noPrefixCommand) {  
            commandName = noPrefixCommand.name.toLowerCase();  
            args = raw.split(/\s+/).slice(1);  
            isCommandFound = true;  
        } else {  
            const prefix = config.prefix || ""; 
            if (prefix.length > 0) {  
                 if (!raw.startsWith(prefix)) return false;  
            } else if (raw.length === 0) {  
                 return false;  
            }  

            const content = raw.slice(prefix.length).trim();  
            const parts = content.split(/\s+/);  
            if (parts.length === 0 || parts[0].length === 0) return false;  

            commandName = parts[0].toLowerCase();  
            args = parts.slice(1);  
            isCommandFound = true;  
        }  
    } catch (e) {  
        log.error("Error parsing command body:" + e);  
        return false;  
    }  

    if (!isCommandFound) return false;  

    const command = commands.find(cmd =>  
        cmd.name.toLowerCase() === commandName ||  
        (Array.isArray(cmd.otherName) &&  
            cmd.otherName.map(n => n.toLowerCase()).includes(commandName))  
    );  

    if (!command) return false; 

    const userRank = getUserRank(event.senderID);  

    // --- 1. التحقق من وضع المطور (التعديل الجديد) ---
    if (config.developmentMode && userRank < 1) {  
        api.setMessageReaction('❌', event.messageID); // تفاعل الـ ❌ المطلوب
        return true; 
    }

    // --- 2. رسائل رفض الصلاحيات (بأسلوب الفيلق) ---
    const rp = [  
        `أوه؟ محارب برتبة متدنية يحاول استخدام ${command.name}.. يا لك من مسكين.`,  
        `عذراً، هذا الأمر مخصص للهاشيرا فقط.. عُد لتدريباتك.`,
        `لا تمتلك القوة الكافية لفتح هذا السجل.`,
        `شينوبو تمنعك من العبث بمعدات المشفى.`,
        ``  
    ];  
    const respon = rp[Math.floor(Math.random() * rp.length)];  

    if (userRank < command.rank) {  
        api.setMessageReaction('🦋', event.messageID);  
        api.sendMessage(respon, event.threadID, event.messageID);  
        return true; 
    }  

    // --- 3. التهدئة (Cooldown) ---  
    const commandCooldown = command.cooldown !== undefined ? command.cooldown : DEFAULT_COOLDOWN;  
    const cooldownKey = `${command.name}_${event.senderID}`;  

    if (commandCooldown > 0) {  
        const now = Date.now();  
        const expirationTime = cooldowns.get(cooldownKey);  
        const duration = commandCooldown * 1000;  

        if (expirationTime && expirationTime > now) {  
            const remainingTime = Math.ceil((expirationTime - now) / 1000);  
            api.setMessageReaction('⏳️', event.messageID);  
            api.sendMessage(`عليك الانتظار لـ ${remainingTime} ثانية قبل التنفس مرة أخرى.`, event.threadID, event.messageID);  
            return true; 
        }  
        cooldowns.set(cooldownKey, now + duration);  
    }  

    // --- 4. تنفيذ الأمر ---  
    try {  
        api.setMessageReaction('✨', event.messageID); // تفاعل الفراشة بدلاً من 🔄
        await command.run(api, event, commands, args);  
        if (command.usageCount !== undefined) command.usageCount++;  
        return true; 
    } catch (e) {  
        log.error(`Error In Cmd (${command.name}):` + e);  
        api.setMessageReaction('⚠️', event.messageID);  
        if (commandCooldown > 0) cooldowns.delete(cooldownKey);  
        return true; 
    }
}

module.exports = {
    handleCommand,
    getUserRank,
    fetchUserInfo
};
