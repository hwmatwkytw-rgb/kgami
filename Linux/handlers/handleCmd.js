// handlers/handleCmd.js
const { getUser } = require("../data/user");
const path = require('path');
// نحتفظ بمسار الملف لاستخدامه في إعادة التحميل
const configPath = path.resolve(__dirname, '../config.json');
const initialConfig = require(configPath); 
const log = require("../logger");
const con = require('../config.json')
const DEFAULT_COOLDOWN = 5;
const cooldowns = new Map();

// دالة لإعادة تحميل الكونفق وتجاوز الكاش (Cache)
function reloadConfig() {
    try {
        delete require.cache[require.resolve(configPath)]; // حذف النسخة القديمة من الذاكرة
        return require(configPath); // قراءة النسخة الجديدة من الملف
    } catch (e) {
        log.error("Error reloading config: " + e);
        return initialConfig;
    }
}

// دالة مساعدة لتحويل أي مدخل (رقم/نص/مصفوفة) إلى مصفوفة نصوص
// هذه الدالة هي السر في حل مشكلة "الشخصين"
function normalizeIds(input) {
    if (!input) return [];
    // تحويل المدخل إلى مصفوفة إذا لم يكن كذلك
    const arr = Array.isArray(input) ? input : [input];
    // تحويل كل عنصر داخل المصفوفة إلى نص (String) وإزالة المسافات الزائدة
    return arr.map(id => String(id).trim());
}

// 👑 دالة الرتبة المحسنة والمحصنة
function getUserRank(senderID) {
    // 1. جلب أحدث بيانات من الملف
    const currentConfig = reloadConfig();
    
    // 2. ضمان أن الـ ID الخاص بالمرسل هو نص
    const uid = String(senderID).trim();

    // 3. تحويل قوائم المشرفين والمطورين إلى نصوص لضمان التطابق
    const editors = normalizeIds(currentConfig.editor);
    const admins = normalizeIds(currentConfig.AdminsID);

    if (editors.includes(uid)) {  
        return 2; // Editor
    }  
    if (admins.includes(uid)) {  
        return 1; // Admin
    }  
    return 0; // Member
}

// جلب معلومات المستخدم
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
    // استخدام reloadConfig هنا أيضاً لضمان تحديث البادئة ووضع التطوير
    const config = reloadConfig(); 

    if (!commands || !Array.isArray(commands) || !event.body) {
        return false;
    }

    const raw = event.body.trim();  
    let commandName = "";  
    let args = [];  
    let isCommandFound = false;  

    // --- 1. تحليل الرسالة ---  
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

    // --- 2. التحقق من الرتبة ---  
    // سيتم استدعاء الدالة الجديدة التي تضمن قراءة الملف وتوحيد الأنواع
    const userRank = getUserRank(event.senderID);  

    const rp = [  
        `ليس لديك صلاحيات كافية لاستخدام ${command.name}`,  
        `.'-'ノ⁩╯⁠⁦`,
        `𝐹𝑢𝑐𝑘 𝑦𝑜𝑢 𝑏𝑟𝑜꒰* ॢꈍ◡ꈍ ॢ꒱.*˚‧`,
         `(𓁹_𓁹.)\n(.𓁹‿𓁹)`,
        `ياخ ما قادر اوصفها ليك هي مظة شديد مافي اتنين زيها '-'`,
        `ستارك يا جنك علي صغر سنك كلهم راجنك وبعلي منك.`  
    ];  
    const respon = rp[Math.floor(Math.random() * rp.length)];  

    if (userRank < command.rank) {  
        api.setMessageReaction('🦧', event.messageID);  
        api.sendMessage(respon, event.threadID, event.messageID);  
        return true; 
    }  

    if (con.developmentMode && userRank < 1) {  
        api.setMessageReaction('🚫', event.messageID);  
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
            api.sendMessage(`انتظر ${remainingTime} ثانية ꇎ`, event.threadID, event.messageID);  
            return true; 
        }  

        cooldowns.set(cooldownKey, now + duration);  
    }  

    // --- 4. تنفيذ الأمر ---  
    try {  
        api.setMessageReaction('🔄', event.messageID);  
        await command.run(api, event, commands, args);  
        command.usageCount++  
        return true; 
    } catch (e) {  
        log.error(`Error In Cmd (${command.name}):` + e);  
        api.setMessageReaction('🪗', event.messageID);  
        if (commandCooldown > 0) cooldowns.delete(cooldownKey);  
        return true; 
    }
}

module.exports = {
    handleCommand,
    getUserRank,
    fetchUserInfo
};

