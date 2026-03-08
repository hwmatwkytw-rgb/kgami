const { getUser, updateUser } = require('../data/user');
const LINE = "───────────";
const plantsData = [
    { id: 1, name: "عدس", buyPrice: 1000, sellPrice: 2000, time: 5 },
    { id: 2, name: "بصل", buyPrice: 2000, sellPrice: 3500, time: 10 },
    { id: 3, name: "بطاطس", buyPrice: 3000, sellPrice: 5000, time: 15 },
    { id: 4, name: "فاصوليا", buyPrice: 5000, sellPrice: 7000, time: 20 },
    { id: 5, name: "موز", buyPrice: 8000, sellPrice: 10000, time: 30 },
    { id: 6, name: "بطيخ", buyPrice: 15000, sellPrice: 20000, time: 60 },
    { id: 7, name: "فراولة", buyPrice: 20000, sellPrice: 25000, time: 90 },
    { id: 8, name: "عنب", buyPrice: 30000, sellPrice: 40000, time: 120 },
    { id: 9, name: "برتقال", buyPrice: 50000, sellPrice: 70000, time: 180 },
    { id: 10, name: "تفاح", buyPrice: 70000, sellPrice: 85000, time: 240 },
    { id: 11, name: "مانجو", buyPrice: 100000, sellPrice: 160000, time: 300 },
    { id: 12, name: "الأناناس", buyPrice: 150000, sellPrice: 200000, time: 400 },
    { id: 13, name: "الكاكاو", buyPrice: 250000, sellPrice: 300000, time: 600 },
    { id: 14, name: "البن", buyPrice: 400000, sellPrice: 500000, time: 800 },
    { id: 15, name: "تبغ", buyPrice: 500000, sellPrice: 800000, time: 1440 }
];
const { styleNum } = require('../tools');

module.exports = {
  name: 'زراعة',
  otherName: ['زراعه'],
  type: ['الاموال'],
  cooldown: 5,
  rank: 0,
  run: async (api, event, commands, args) => {
    const { senderID, threadID, messageID } = event;
    const user = await getUser(senderID);

    if (!user) return api.sendMessage('ليس لديك حساب', threadID, messageID);
    if (!user.status) user.status = {};
    if (!user.status.garden) user.status.garden = [];

    const subCommand = args[0];

    if (!subCommand) {
      let menu = `[ 🌿 نظام الزراعة ]\n${LINE}\n`;
      menu += `• زراعة شراء\n`;
      menu += `• زراعة عرض\n`;
      menu += `• زراعة حصاد\n${LINE}`;
      return api.sendMessage(menu, threadID, messageID);
    }

    // --- نظام الشراء (تم التعديل هنا) ---
    if (subCommand === "شراء") {
      const plantID = parseInt(args[1]);

      // فلترة النباتات التي يستطيع المستخدم شراءها فقط
      const affordablePlants = plantsData.filter(p => user.money >= p.buyPrice);

      if (!plantID || isNaN(plantID)) {
        if (affordablePlants.length === 0) {
          return api.sendMessage(`❌ رصيدك الحالي (${styleNum(user.money)}) لا يكفي لشراء أي بذور حالياً.`, threadID, messageID);
        }

        let storeMsg = `[ 🛒 بذور يمكنك شراؤها ]\n${LINE}\n`;
        storeMsg += `رصيدك: ${styleNum(user.money)}\n${LINE}\n`;
        
        affordablePlants.forEach(p => {
          storeMsg += `${styleNum(p.id)} - ${p.name} ￨ السعر: ${styleNum(p.buyPrice)} \n`;
        });
        
        storeMsg += `\nلشراء نبتة اكتب: زراعة شراء [رقم النبتة]`;
        return api.sendMessage(storeMsg, threadID, messageID);
      }

      const selectedPlant = plantsData.find(p => p.id === plantID);
      if (!selectedPlant) return api.sendMessage("❌ هذا الرقم غير موجود في المتجر", threadID, messageID);

      if (user.money < selectedPlant.buyPrice) {
        return api.sendMessage(`💰 رصيدك لا يكفي! تحتاج إلى ${styleNum(selectedPlant.buyPrice - user.money)} إضافية لشراء ${selectedPlant.name}.`, threadID, messageID);
      }

      // إتمام عملية الشراء
      user.money -= selectedPlant.buyPrice;
      const newPlant = {
        id: selectedPlant.id,
        name: selectedPlant.name,
        plantedAt: Date.now(),
        readyAt: Date.now() + (selectedPlant.time * 60 * 1000)
      };

      user.status.garden.push(newPlant);
      await updateUser(senderID, { money: user.money, status: user.status });

      return api.sendMessage(`✅ تمت زراعة ${selectedPlant.name} بنجاح!\n⏳ سيجهز المحصول بعد ${selectedPlant.time} دقيقة.`, threadID, messageID);
    }

    // --- نظام العرض ---
    if (subCommand === "عرض") {
      if (user.status.garden.length === 0) return api.sendMessage("🏡 حديقتك فارغة حالياً.", threadID, messageID);

      let gardenMsg = `[ 🏡 حديقتك الخاصة ]\n${LINE}\n`;
      user.status.garden.forEach((p, index) => {
        const timeLeftMs = p.readyAt - Date.now();
        const timeLeftMin = Math.max(0, Math.ceil(timeLeftMs / (60 * 1000)));
        const status = timeLeftMs <= 0 ? "✅ ناضج" : `⏳ ينمو (${timeLeftMin} د)`;
        gardenMsg += `${styleNum(index + 1)} - ${p.name} ￨ ${status}\n`;
      });
      return api.sendMessage(gardenMsg, threadID, messageID);
    }

    // --- نظام الحصاد ---
    if (subCommand === "حصاد") {
      const now = Date.now();
      const readyToSell = user.status.garden.filter(p => now >= p.readyAt);

      if (readyToSell.length === 0) return api.sendMessage("⚠️ لا توجد محاصيل ناضجة.", threadID, messageID);

      let totalProfit = 0;
      readyToSell.forEach(p => {
        const originalData = plantsData.find(pd => pd.id === p.id);
        if (originalData) totalProfit += originalData.sellPrice;
      });

      user.status.garden = user.status.garden.filter(p => now < p.readyAt);
      user.money += totalProfit;

      await updateUser(senderID, { money: user.money, status: user.status });

      return api.sendMessage(`🧺 تم حصاد ${readyToSell.length} محصول!\n💰 الربح: ${styleNum(totalProfit)} جنيه`, threadID, messageID);
    }
  }
};

