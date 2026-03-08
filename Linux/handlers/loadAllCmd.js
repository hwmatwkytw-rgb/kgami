const fs = require("fs");
const path = require("path");
const log = require("../logger");

const CMD_DIR = path.join(__dirname, "../cmd");
let commands = [];

/* قراءة ملفات js فقط في مجلد cmd الرئيسي */
async function loadCommandsFromFiles() {
  commands = [];
  
  if (!fs.existsSync(CMD_DIR)) {
    log.warn(`Command directory not found: ${CMD_DIR}`);
    return commands;
  }

  const cmdFiles = fs.readdirSync(CMD_DIR).filter(file => file.endsWith(".js"));

  for (const fileName of cmdFiles) {
    const filePath = path.join(CMD_DIR, fileName);
    delete require.cache[require.resolve(filePath)];

    try {
      const cmd = require(filePath);

      if (!cmd.name || typeof cmd.name !== "string") {
        log.warn(`Ignored: ${filePath} (missing name)`);
        continue;
      }

      if (commands.some(c => c.name === cmd.name)) {
        log.warn(`Duplicate command '${cmd.name}' ignored.`);
        continue;
      }

      cmd.rank = cmd.rank ?? 0;
      cmd.cooldown = cmd.cooldown ?? 3;
      cmd.hide = cmd.hide ?? false;
      cmd.prefix = cmd.prefix ?? true;
      cmd.usageCount = cmd.usageCount ?? 0;
      cmd.filePath = filePath;
      cmd.fileName = fileName;

      commands.push(cmd);

    } catch (err) {
      log.error(`Failed to load ${filePath}:` +  err);
    }
  }

  log.success(`Loaded ${commands.length} commands successfully.`);
  return commands;
}

/* إعادة تحميل أمر واحد */
function reloadCommand(name) {
  const cmd = commands.find(c => c.name === name);
  if (!cmd) return false;

  try {
    delete require.cache[require.resolve(cmd.filePath)];
    const newCmd = require(cmd.filePath);
    Object.assign(cmd, newCmd);
    log.success(`Command '${name}' reloaded.`);
    return true;
  } catch (e) {
    log.error(`Failed to reload command '${name}':` + e);
    return false;
  }
}

module.exports = {
  loadCommandsFromFiles,
  reloadCommand,
  commands
};
