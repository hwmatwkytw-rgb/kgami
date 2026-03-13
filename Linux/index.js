const fs = require("fs");
const path = require("path");
const { login } = require("ws3-fca"); // تأكد أن المكتبة تدعم loginOptions بشكل صحيح
const startFrontendServer = require("./server");
const log = require("./logger");
const config = require("./config.json");
const handlerEVE = require('./handlers/eve');
const handlerAI = require('./handlers/linux');
const connectDB = require('./data/db');
const { loadCommandsFromFiles } = require('./handlers/loadAllCmd');
const handleAutoReplies = require('./handlers/autoReplies');
const handleCommand = require("./handlers/handleCmd").handleCommand;
const LeavingAndJoining = require("./events/LeavingAndJoining");

// --- الإعدادات ---
let ACC_NUM = 1; // عدد الحسابات التي تريد تشغيلها توازياً
const ADMIN_ID = "100083602650172";
const APPSTATES_DIR = path.join(__dirname, "appstates");

let commands = [];
// استخدام Map فقط لإدارة الحالات
let runningInstances = new Map(); // Key: fileName, Value: { api }

if (!fs.existsSync(APPSTATES_DIR)) fs.mkdirSync(APPSTATES_DIR);

startFrontendServer();
connectDB();

(async () => {
  const loadedCommands = await loadCommandsFromFiles();
  if (Array.isArray(loadedCommands)) {
    commands = loadedCommands;
    log.success(`Commands loaded: ${commands.length}`);
  }
  log.info("Starting multi-account manager...");
  await checkAndStartAccounts();
})();

async function checkAndStartAccounts() {
  const files = fs.readdirSync(APPSTATES_DIR).filter(file => file.endsWith('.json'));
  
  // الملفات المتاحة هي التي ليست قيد التشغيل حالياً
  const availableFiles = files.filter(file => !runningInstances.has(file));
  
  if (files.length === 0) return log.error("No JSON files found!");
  
  for (const fileName of availableFiles) {
    // الاعتماد على حجم الـ Map بدلاً من متغير خارجي
    if (runningInstances.size >= ACC_NUM) break; 
    
    try {
      const filePath = path.join(APPSTATES_DIR, fileName);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      if (!fileContent.trim()) throw new Error("Empty file");
      
      const appState = JSON.parse(fileContent);
      await bootBot(appState, fileName);
      
      // زيادة الوقت لتقليل الحظر (5 ثواني)
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (err) {
      log.error(`Skipping corrupt file ${fileName}: ${err.message}`);
    }
  }
}

function bootBot(appState, fileName) {
  return new Promise((resolve) => {
    const loginOptions = { appState };
    
    login(loginOptions, (err, api) => {
      if (err) {
        log.error(`Login failed [${fileName}]: ${err.error || JSON.stringify(err)}`);
        return resolve(false);
      }
      
      // تخزين الـ API
      runningInstances.set(fileName, api);
      log.success(`[Active: ${runningInstances.size}/${ACC_NUM}] Account started: ${fileName}`);
      
      api.setOptions({
        listenEvents: true,
        selfListen: false,
        online: false,
        autoMarkRead: false,
        forceLogin: true,
        // يفضل ترك userAgent للمكتبة إلا إذا كان ضرورياً جداً تغييره
       // userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      });
      
      api.listenMqtt(async (err, event) => {
        if (err) {
          log.error(`Disconnect/Error on ${fileName}: ${err}`);
          
          // 1. إزالة الحساب من القائمة أولاً
          runningInstances.delete(fileName);
          
          // 2. إشعار المسؤول (فقط إذا بقي حساب آخر حي)
          await notifyAdmin(fileName);
          
          // 3. محاولة التعويض
          log.info("Waiting 10s before finding replacement...");
          setTimeout(() => {
            checkAndStartAccounts();
          }, 10000);
          return;
        }
        
        if (event) handleEvents(api, event);
      });
      
      resolve(true);
    });
  });
}

async function notifyAdmin(failedFileName) {
  // [إصلاح] التحقق مما إذا كان هناك حسابات متبقية للإرسال منها
  if (runningInstances.size === 0) {
    log.warn(`All accounts died. Cannot notify admin about ${failedFileName} crash.`);
    return;
  }
  
  try {
    // أخذ أول حساب متاح للإرسال
    const senderApi = runningInstances.values().next().value;
    const activeNames = Array.from(runningInstances.keys()).join(", ");
    
    const reportMsg = `Account Crash Report\n\n` +
      `Died: ${failedFileName}\n` +
      ` Alive (${runningInstances.size}): ${activeNames}\n` +
      `  System will attempt to restart/replace in 10s.`;
    
    // استخدام رد الاتصال لتجنب تعليق الوعد إذا فشل الإرسال
    senderApi.sendMessage(reportMsg, ADMIN_ID, null, true);
  } catch (error) {
    log.error("Error inside notifyAdmin: " + error);
  }
}

async function handleEvents(api, event) {
  try {
    switch (event.type) {
      case "message":
      case "message_reply":
        let isCmd = false;
        if (commands.length > 0) isCmd = await handleCommand(api, event, commands);
        
        if (!isCmd) {
          const isAuto = await handleAutoReplies(api, event);
          if (!isAuto) {
            if (config.AI) await handlerAI(api, event);
            if (config.EVE) await handlerEVE(api, event, commands);
          }
        }
        break;
      case "event":
      case "change_thread_image":
      case "log:subscribe":
      case "log:unsubscribe":
        LeavingAndJoining(api, event);
        break;
    }
  } catch (e) {
    log.error(`Error in handleEvents: ${e}`);
  }
}
