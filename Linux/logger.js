const chalk = require("chalk");

// تعريف أنواع الإشعارات مع اللون والخلفية وأيقونة لكل نوع
const logTypes = {
  INFO: { color: "#ffffff", bgColor: "#1e90ff" },       // أزرق
  SUCCESS: { color: "#ffffff", bgColor: "#28a745" },    // أخضر
  WARNING: { color: "#000000", bgColor: "#ffc107" },    // أصفر
  ERROR: { color: "#ffffff", bgColor: "#dc3545" },       // أحمر
  SYSTEM: { color: "#ffffff", bgColor: "#6c757d" },     // رمادي
};

// الدالة التي تطبع رسالة بالصيغة الصحيحة
function printLog(type, message) {
  const logInfo = logTypes[type.toUpperCase()];
  if (!logInfo) {
    console.log(chalk.white(`  [${type}] ${message}`));
    return;
  }

  const { color, bgColor } = logInfo;
  const formatted = chalk.hex(color).bgHex(bgColor)(`  [${type}] ${message}`);
  console.log(formatted);
}

// إنشاء Object يحتوي على دوال لكل نوع
const log = {
  info: (message) => printLog("INFO", message),
  success: (message) => printLog("SUCCESS", message),
  warn: (message) => printLog("WARNING", message),
  error: (message) => printLog("ERROR", message),
  system: (message) => printLog("SYSTEM", message),
};

// تصدير الكائن كله مرة واحدة
module.exports = log;
