// دالة مساعدة لحساب وقت التأخير بالمللي ثانية
// لا حاجة لتغييرها
function COOLDOWN_TIME(number) {
    return number * 1000;
}

// دالة مُحسّنة لجدولة إرسال الرسالة
// يجب أن تكون دالة بسيطة بدون await لتبسيط الاستخدام
function SCHEDULE_MESSAGE(api, event, messageText, name, arraytag, delayTime) {
    // نستخدم setTimeout لجدولة الرسالة
    setTimeout(() => {
        // نستخدم api.sendMessage لإرسال الرسالة
        api.sendMessage({
            body: `${messageText} ${name}`,
            mentions: arraytag
        }, event.threadID);
    }, delayTime);
}

module.exports = {
    name: "نكد",
    rank: 0,
    discretion: 'قم بالنكد عن طريق عمل تاق',
    cooldowns: 60,
    run: async (api, event) => {
        const messages = [ // تم تغيير اسم المتغير إلى messages لتجنب الخلط
            `ماذا فعلت بي لأراك في أحلامي؟\nماذا فعلت بي لينبض قلبي بأسمك؟\nماذا فعلت بي لأبتسم حين اتذكرك؟\nماذا فعلت بي لتجعلني أبكي عليك
الليالي وأنت لا تعلم؟`,
            `كوتي امور، كوتي شطور، كوتي يا حياتي، كوتي يا كيوت`,
            `ما قادر اتنفس`,
            `وحيات ديني فكت`,
            "طيب والحبل الجديد؟",
            `باسلوب رمضاني كلهم عصر الا انت مغرب`,
            `حن علي يا جن`,
            `انا بعشقك بجنون ممكن اعرف ليه قلبك ما حنون ؟`,
            `موااه مواااه`,
            `يرضيك اكوي جلابيتي براي ؟`,
            `لو فهمتي قصدي اعملي اشارة ^>^`,
            `ترا ما بس المخدارات بتخدر انا برضو بوستي ما هينة`,
            `كنت في حصة الرياضيات والاستاذ طلب مني احل مسألة واداني خيارين رقم زوجي وفردي، طبعاً انا اخترت الرقم الفردي عشان مافي غيرك ح يكون زوجي، بعد الاجابة انضربت 10 سوط عشانك يا حبي`,
            `الابتسامة في وجه اخيك صدقة فما بالك بالبوسة ؟`,
            `لقد احبني البيض والسود والمثليين واليهود ما عدا الشخص الذي احببته`
        ];
        
        var mention = Object.keys(event.mentions)[0];
        if (!mention) return api.sendMessage("⊳تاقي زول.", event.threadID, event.messageID);
        
        let name = event.mentions[mention];
        var arraytag = [];
        arraytag.push({ id: mention, tag: name });
        
        let totalDelay = 0;
        const delayIncrement = 7; // زيادة التأخير بمقدار 3 ثواني بين كل رسالة
        
        // استخدام حلقة for...in أو forEach مع مؤشر (index) لحساب التأخير
        for (let i = 0; i < messages.length; i++) {
            const txt = messages[i];
            
            // حساب التأخير الكلي (التأخير التراكمي)
            // (i + 1) * 3 يعطي: 3, 6, 9, 12, ... ثواني
            totalDelay = COOLDOWN_TIME((i + 1) * delayIncrement);
            
            // جدولة الرسالة
            // لن نستخدم await هنا. سنقوم بجدولة كل الرسائل دفعة واحدة
            // ولكن كل رسالة ستُرسل في وقتها المحدد
            SCHEDULE_MESSAGE(api, event, txt, name, arraytag, totalDelay);
        }
    }
}

