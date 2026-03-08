// tools.js

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

// Character Sets (أحرف كبيرة فقط للخرائط الأساسية)
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
  { name: "SANS BOLD", map: createMap(DIGITS, "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵"), sample: "𝟬𝟭𝟮𝟯" },
  { name: "MONOSPACE", map: createMap(DIGITS, "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿"), sample: "𝟶𝟷𝟸𝟹" },
  { name: "SUBSCRIPT", map: createMap(DIGITS, "₀₁₂₃₄₅₆₇₈₉"), sample: "₀₁₂₃" },
  { name: "SUPERSCRIPT", map: createMap(DIGITS, "⁰¹²³⁴⁵⁶⁷⁸⁹"), sample: "⁰¹²³" },
  { name: "CIRCLED", map: createMap(DIGITS, "⓪①②③④⑤⑥⑦⑧⑨"), sample: "⓪①②③" },
  { name: "CIRCLED BLACK", map: createMap(DIGITS, "⓿❶❷❸❹❺❻❼❽❾"), sample: "⓿❶❷❸" },
  { name: "FULL WIDTH", map: createMap(DIGITS, "０１２３４５６７８９"), sample: "０１２３" }
];

/* =======================
   TEXT STYLES (نصوص)
======================= */
const TEXT_STYLES = [
  { name: "NORMAL", map: null, sample: "NORMAL TEXT" },
  
  {
    name: "BOLD SERIF",
    map: createMap(LATIN_UPPER, "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙"),
    sample: "𝐁𝐎𝐋𝐃 𝐓𝐄𝐗𝐓"
  },
  {
    name: "ITALIC",
    map: createMap(LATIN_UPPER, "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍"),
    sample: "𝐼𝑇𝐴𝐿𝐼𝐶 𝑇𝐸𝑋𝑇"
  },
  {
    name: "BOLD ITALIC",
    map: createMap(LATIN_UPPER, "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁"),
    sample: "𝑩𝑶𝑳𝑫 𝑰𝑻𝑨𝑳𝑰𝑪"
  },
  {
    name: "SANS NORMAL",
    map: createMap(LATIN_UPPER, "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹"),
    sample: "𝖲𝖠𝖭𝖲 𝖳𝖤𝖷𝖳"
  },
  {
    name: "SANS BOLD",
    map: createMap(LATIN_UPPER, "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭"),
    sample: "𝗦𝗔𝗡𝗦 𝗕𝗢𝗟𝗗"
  },
  {
    name: "SCRIPT",
    map: createMap(LATIN_UPPER, "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵"),
    sample: "𝒮𝒞𝑅𝐼𝒫𝒯"
  },
  {
    name: "BOLD SCRIPT",
    map: createMap(LATIN_UPPER, "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩"),
    sample: "𝓑𝓞𝓛𝓓 𝓢𝓒𝓡"
  },
  {
    name: "GOTHIC",
    map: createMap(LATIN_UPPER, "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ"),
    sample: "𝔊𝔒𝔗ℑℭ"
  },
  {
    name: "BOLD GOTHIC",
    map: createMap(LATIN_UPPER, "𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅"),
    sample: "𝕭𝕺𝕳𝕯 𝕲𝕺𝕿𝕳"
  },
  {
    name: "DOUBLE STRUCK",
    map: createMap(LATIN_UPPER, "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"),
    sample: "𝔻𝕆𝕌𝔹𝕃𝔼"
  },
  {
    name: "SMALL CAPS",
    map: createMap(LATIN_UPPER, "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ"),
    sample: "ꜱᴍᴀʟʟ ᴄᴀᴘꜱ"
  },
  
  {
    name: "CIRCLED",
    map: createMap(LATIN_UPPER, "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ"),
    sample: "ⒸⒾⓇⒸⓁⒺ"
  },
  {
    name: "CIRCLED BLACK",
    map: createMap(LATIN_UPPER, "🅰🅱🅲🅳🅴🅵🅶🅷🅸🉉🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉"),
    sample: "🅱🅻🅰🅲🅺"
  },
  {
    name: "SQUARED",
    map: createMap(LATIN_UPPER, "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉"),
    sample: "🅂🅀🅄🄰🅁🄴"
  },
  {
    name: "MONOSPACE",
    map: createMap(LATIN_UPPER, "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉"),
    sample: "𝙼𝙾𝙽𝙾𝚂𝙿𝙰𝙲𝙴"
  },
  {
    name: "WIDE",
    map: createMap(LATIN_UPPER, "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"),
    sample: "ＷＩＤＥ"
  }
];

/* =======================
   CURRENT STATE
======================= */
let CURRENT_NUM = 0;
let CURRENT_TEXT = 5;

/* =======================
   FUNCTIONS
======================= */

const styleNum = (num) => {
  if (num == null) return '';
  const style = NUM_STYLES[CURRENT_NUM];
  const str = String(num);
  if (!style.map) return str;
  
  return str.split('').map(c => style.map[c] || c).join('');
};

const styleText = (text) => {
  if (!text) return '';
  
  // الخطوة الأساسية: تحويل النص دائماً إلى أحرف كبيرة
  const upperInput = text.toUpperCase();
  const style = TEXT_STYLES[CURRENT_TEXT];
  
  if (!style || !style.map) return upperInput;
  
  return upperInput
    .split('')
    .map(char => {
      // البحث في الخريطة (بما أن النص كبير سيبحث عن المفاتيح الكبيرة)
      if (style.map[char]) return style.map[char];
      
      // احتياطي: إذا كانت الخريطة مخزنة بمفاتيح صغيرة (مثل Small Caps)
      const lowerChar = char.toLowerCase();
      if (style.map[lowerChar]) return style.map[lowerChar];
      
      return char;
    })
    .join('');
};

/* =======================
   CONTROLS
======================= */
const setNumStyle = (i) => { if (NUM_STYLES[i]) CURRENT_NUM = i; };
const setTextStyle = (i) => { if (TEXT_STYLES[i]) CURRENT_TEXT = i; };

module.exports = {
  styleNum,
  styleText,
  setNumStyle,
  setTextStyle,
  NUM_STYLES,
  TEXT_STYLES
};
