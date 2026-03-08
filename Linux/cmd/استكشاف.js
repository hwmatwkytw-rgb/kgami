const { getUser, updateUser } = require('../data/user');
const creaturesData = require('../data/creatures.json');
const { styleNum, styleText } = require('../tools');
const axios = require('axios');

const LINE = "───────────";

module.exports = {
    name: 'استكشاف',
    rank: 1,
    type: ['الالعاب'],
    cooldown: 30,
    run: async (api, event, commands, args) => {
        const { senderID, threadID, messageID } = event;
        const { sendMessage } = api;
        
        const user = await getUser(senderID);
        if (!user) {
            return sendMessage('ليس لديك حساب! قم بإنشاء حساب أولاً.', threadID, messageID);
        }
        
        // نظام الطاقة
        if ((user.gold || 0) < 10) {
            return sendMessage('محتاج 10 جرام', threadID, messageID);
        }
        
        // اختيار عشوائي معقد
        const group = creaturesData[Math.floor(Math.random() * creaturesData.length)];
        const area = group.area[Math.floor(Math.random() * group.area.length)];
        const creature = area.creature[Math.floor(Math.random() * area.creature.length)];
        
        // استهلاك الطاقة
        user.gold -= 10;
        
        const rates = {
            "شائع": 95,
            "غير شائع": 75,
            "نادر": 45,
            "ملحمي": 15,
            "أسطوري": 5,
            "خرافي": 1
        };
        
        const roll = Math.floor(Math.random() * 100);
        
        if (roll > rates[creature.category]) {
            await updateUser(senderID, user);
            return sendMessage(
                `غصت في [ ${area.name} ] لكن المخلوقات كانت حذرة اليوم، لم تصطد شيئاً.`,
                threadID,
                messageID
            );
        }
        
        // النجاح
        if (!user.status) user.status = {};
        if (!user.status.collection) user.status.collection = [];
        
        let isNew = false;
        let found = user.status.collection.find(c => c.name === creature.name);
        
        if (!found) {
            user.status.collection.push({
                name: creature.name,
                category: creature.category,
                count: 1
            });
            isNew = true;
        } else {
            found.count++;
        }
        
        user.money = (user.money || 0) + creature.sell;
        await updateUser(senderID, user);
        
        let msg = `${LINE}\n`;
        msg += `المنطقة: ${area.name}\n`;
        msg += `المخلوق: ${creature.name}\n`;
        msg += `الندرة: ${creature.category}\n`;
        msg += `القيمة: +${styleNum(creature.sell)}$\n`;
        msg += isNew ?
            'مخلوق لموسوعتك\n' :
            `تكرار: لديك الآن ${found.count}\n`;
        //msg += `${LINE}`;
        
        const res = await axios.get(url, {
            responseType: "stream",
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
        
        const contentType = res.headers["content-type"];
        
        return sendMessage(
            {
                body: msg,
                attachment: res.data
            },
            threadID,
            messageID
        );
    }
};
