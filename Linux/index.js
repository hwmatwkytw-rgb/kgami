const fs = require("fs");
const path = require("path");
const http = require("http"); // [إضافة] لفتح المنفذ لـ راندر
const { login } = require("ws3-fca"); 
const startFrontendServer = require("./server");
const log = require("./logger");
const config = require("./config.json");

// --- [إصلاح الزخرفة] ربط ملف التولز عالمياً ---
const tools = require('./handlers/tools'); 
global.styleText = tools.styleText;
global.styleNum = tools.styleNum;
// تثبيت ستايل افتراضي عشان النصوص ما تطلع فاضية
tools.setTextStyle(5); 
tools.setNumStyle(0);

const handlerEVE = require('./handlers/eve');
const handlerAI = require('./handlers/linux');
const connectDB = require('./data/db');
const { loadCommandsFromFiles } = require('./handlers/loadAllCmd');
const handleAutoReplies = require('./handlers/autoReplies');
const handleCommand = require("./handlers/handleCmd").handleCommand;
const LeavingAndJoining = require("./events/LeavingAndJoining");

// --- [حل راندر] فتح منفذ وهمي ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write('Eplin Bot is Active!');
  res.end();
}).listen(port, () => {
  log.success(`[Render] Server is live on port ${port}`);
});

// --- الإعدادات ---
let ACC_NUM = 1; 
const ADMIN_ID = "100083602650172";
const APPSTATES_DIR = path.join(__dirname, "appstates");

let commands = [];
let runningInstances = new Map(); 

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
  const availableFiles = files.filter(file => !runningInstances.has(file));
  if (files.length === 0) return log.error("No JSON files found!");
  
  for (const fileName of availableFiles) {
    if (runningInstances.size >= ACC_NUM) break; 
    try {
      const filePath = path.join(APPSTATES_DIR, fileName);
      const appState = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await bootBot(appState, fileName);
      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      log.error(`Skipping corrupt file ${fileName}: ${err.message}`);
    }
  }
}

function bootBot(appState, fileName) {
  return new Promise((resolve) => {
    login({ appState }, (err, api) => {
      if (err) {
        log.error(`Login failed [${fileName}]: ${err.error || JSON.stringify(err)}`);
        return resolve(false);
      }
      runningInstances.set(fileName, api);
      log.success(`Account started: ${fileName}`);
      api.setOptions({ listenEvents: true, selfListen: false, online: false });
      api.listenMqtt(async (err, event) => {
        if (err) {
          runningInstances.delete(fileName);
          setTimeout(() => { checkAndStartAccounts(); }, 10000);
          return;
        }
        if (event) handleEvents(api, event);
      });
      resolve(true);
    });
  });
}

async function notifyAdmin(failedFileName) {
  if (runningInstances.size === 0) return;
  try {
    const senderApi = runningInstances.values().next().value;
    const reportMsg = `Account Crash Report\nDied: ${failedFileName}`;
    senderApi.sendMessage(reportMsg, ADMIN_ID, null, true);
  } catch (error) { log.error("Error: " + error); }
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
      case "log:subscribe":
      case "log:unsubscribe":
        LeavingAndJoining(api, event);
        break;
    }
  } catch (e) { log.error(`Error in handleEvents: ${e}`); }
}
