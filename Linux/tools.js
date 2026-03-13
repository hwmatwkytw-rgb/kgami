// tools.js - النسخة المعدلة لعرين إبلين

/* =======================
   HELPER: MAP GENERATOR
======================= */
const createMap = (chars, replacement) => {
  const map = {};
  const source = chars.split('');
  const target = Array.from(replacement);
  
  source.forEach((char, index) => {
    if (target[index]) {
      map[char] = target[index];
    }
  });
  return map;
};

const LATIN_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

/* =======================
   NUM STYLES (أرقام)
======================= */
const NUM_STYLES = [
  { name: "NORMAL", map: null, sample: "0123456789" },
  { name: "BOLD", map: createMap(DIGITS, "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗"), sample: "𝟎𝟏𝟐𝟑" },
  { name: "DOUBLE STRUCK", map: createMap(DIGITS, "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡"), sample: "𝟘𝟙𝟚𝟛" },
  { name: "SANS SERIF", map: createMap(DIGITS, "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫"), sample: "𝟢𝟣𝟤𝟥" },
  { name: "SANS BOLD", map: createMap(DIGITS, "𝟬𝟭𝟮𝟯𝟰𝟱𝟲₇₈₉"), sample: "𝟬𝟭𝟮𝟯" },
  { name: "MONOSPACE", map: createMap(DIGITS, "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿"), sample: "𝟶𝟷𝟸𝟹" }
];

/* =======================
   TEXT STYLES (نصوص)
======================= */
const TEXT_STYLES = [
  { name: "NORMAL", map: null, sample: "NORMAL TEXT" },
  { name: "BOLD SERIF", map: createMap(LATIN_UPPER, "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙"), sample: "𝐁𝐎𝐋𝐃" },
  { name: "ITALIC", map: createMap(LATIN_UPPER, "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍"), sample: "𝐼𝑇𝐴𝐿𝐼𝐶" },
  { name: "SANS NORMAL", map: createMap(LATIN_UPPER, "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹"), sample: "𝖲𝖠𝖭𝖲" },
  { name: "SANS BOLD", map: createMap(LATIN_UPPER, "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"), sample: "𝗦𝗔𝗡𝗦 𝗕𝗢𝗟𝗗" },
  { name: "MONOSPACE", map: createMap(LATIN_UPPER, "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉"), sample: "𝙼𝙾𝙽𝙾" }
];

/* =======================
   CURRENT STATE (الحالة الافتراضية)
======================= */
let CURRENT_NUM = 0;
let CURRENT_TEXT = 4; // افتراضي: SANS BOLD

/* =======================
   FUNCTIONS
======================= */

const styleNum = (num) => {
  if (num === null || num === undefined) return '';
  const style = NUM_STYLES[CURRENT_NUM] || NUM_STYLES[0];
  const str = String(num);
  if (!style.map) return str;
  return str.split('').map(c => style.map[c] || c).join('');
};

const styleText = (text) => {
  if (!text) return '';
  const upperInput = String(text).toUpperCase();
  const style = TEXT_STYLES[CURRENT_TEXT] || TEXT_STYLES[0];
  if (!style || !style.map) return upperInput;
  
  return upperInput
    .split('')
    .map(char => style.map[char] || char)
    .join('');
};

/* =======================
   CONTROLS
======================= */
const setNumStyle = (i) => { if (NUM_STYLES[i]) CURRENT_NUM = i; };
const setTextStyle = (i) => { if (TEXT_STYLES[i]) CURRENT_TEXT = i; };

// التصدير بطريقة تدعم الاستخدام العالمي والمحلي
module.exports = {
  styleNum,
  styleText,
  setNumStyle,
  setTextStyle,
  NUM_STYLES,
  TEXT_STYLES
};
