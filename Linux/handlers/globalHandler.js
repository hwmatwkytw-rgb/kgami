// globalHandler.js (محدث لتوقيت السودان)
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { createReadStream } = fs;

// الدوال لقاعدة البيانات
const { getGroup, updateGroup, saveGroup, getAllGroups } = require('../data/thread');

// --- الثوابت والإعدادات العالمية ---
const DEFAULT_LATITUDE = 15.5007;   // خط عرض الخرطوم
const DEFAULT_LONGITUDE = 32.5599;  // خط طول الخرطوم
const PRAYER_CALCULATION_METHOD = 5; // طريقة هيئة المساحة المصرية (المستخدمة في السودان)

// فترات الجدولة بالمللي ثانية
const CHECK_INTERVAL = 60000; // تحقق كل دقيقة
const AYAT_INTERVAL = 1200000; // 20 دقيقة

// --- بيانات الأذكار والأدعية ---
const AD3EYA = [
    "اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً.",
    "اللهم إنك عفو كريم تحب العفو فاعفُ عني.",
    "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار.",
    "يا مقلب القلوب ثبت قلبي على دينك.",
    "اللهم اغفر لي، وارحمني، واهدني، وعافني، وارزقني.",
];

const ATHKAR_DATA = {
    MORNING: {
        text: "⊳أذكار الصباح: أصبحنا وأصبح الملك لله...\n\n",
        startHour: 5,
        endHour: 9,
        key: 'morning'
    },
    EVENING: {
        text: "⊳أذكار المساء: أمسينا وأمسى الملك لله...\n\n",
        startHour: 17,
        endHour: 23,
        key: 'evening'
    }
};

const PRAYER_NAMES = {
    Fajr: "صلاة الفجر",
    Dhuhr: "صلاة الظهر",
    Asr: "صلاة العصر",
    Maghrib: "صلاة المغرب",
    Isha: "صلاة العشاء",
};

// --- دوال المساعدة ---

// جلب أوقات الصلاة من API مع ضبط توقيت السودان
async function fetchPrayerTimes(lat, lon, method) {
    const todayKh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Khartoum' }));
    const date = `${todayKh.getDate()}-${todayKh.getMonth() + 1}-${todayKh.getFullYear()}`;

    const url = `http://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=${method}&timezonestring=Africa/Khartoum`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.data) {
            return response.data.data.timings;
        }
        log.error("Aladhan API returned unexpected data structure.");
        return null;
    } catch (error) {
        log.error("Error fetching prayer times from Aladhan API: " + error.message);
        return null;
    }
}

// جلب آية قرآنية عشوائية
async function fetchRandomAyat() {
    const totalPages = 604;
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    const url = `http://api.alquran.cloud/v1/page/${randomPage}/quran-simple`;

    try {
        const response = await axios.get(url);
        const ayats = response.data.data.ayahs;

        if (ayats && ayats.length > 0) {
            const randomIndex = Math.floor(Math.random() * ayats.length);
            const ayatText = ayats[randomIndex].text;
            const surahName = ayats[randomIndex].surah.englishName;
            const ayahNumber = ayats[randomIndex].numberInSurah;

            return `${ayatText}\n(سورة ${surahName}، الآية ${ayahNumber})`;
        }
        return "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ";
    } catch (error) {
        log.error("Error fetching Quran Ayat: " + error.message);
        return "لا حول ولا قوة إلا بالله";
    }
}

// تحويل وقت الصلاة من String إلى Date
function timeToDate(timeStr, dateObj) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(dateObj);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

// --- المنطق الرئيسي للجدولة ---
async function scheduleHandler(api, groupDB) {
    const { id: threadID, status } = groupDB;
    const nowKh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Khartoum' }));
    const todayStr = nowKh.toDateString();

    let updatedStatus = { ...status };

    // تحديث أوقات الصلاة يوميًا
    const lastPrayerDate = updatedStatus.prayerTimes?.date;
    if (!updatedStatus.prayerTimes || lastPrayerDate !== todayStr) {
        const timings = await fetchPrayerTimes(DEFAULT_LATITUDE, DEFAULT_LONGITUDE, PRAYER_CALCULATION_METHOD);
        if (timings) {
            const prayerTimestamps = { date: todayStr };
            updatedStatus.lastPrayerSend = updatedStatus.lastPrayerSend || {};

            for (const key of Object.keys(PRAYER_NAMES)) {
                const dateObj = timeToDate(timings[key], nowKh);
                const ts = dateObj.getTime();
                prayerTimestamps[key] = ts;

                // تعليم الصلوات الفائتة بأنها مرسلة تلقائيًا
                updatedStatus.lastPrayerSend[key] = (ts < nowKh.getTime());
            }

            updatedStatus.prayerTimes = prayerTimestamps;
            updatedStatus.lastAyatSend = updatedStatus.lastAyatSend || 0;
            updatedStatus.lastAthkarDate = '';
        } else {
            return;
        }
    }

    // إرسال تنبيهات الصلاة
    let shouldUpdateDB = false;
    updatedStatus.lastPrayerSend = updatedStatus.lastPrayerSend || {};

    for (const [key, name] of Object.entries(PRAYER_NAMES)) {
        const prayerTimestamp = updatedStatus.prayerTimes && updatedStatus.prayerTimes[key];
        const hasBeenSent = !!updatedStatus.lastPrayerSend[key];

        if (prayerTimestamp && nowKh.getTime() >= prayerTimestamp && !hasBeenSent) {
            api.sendMessage(`حان الآن موعد ${name}. تقبل الله طاعتكم.`, threadID);
            updatedStatus.lastPrayerSend[key] = true;
            shouldUpdateDB = true;
        }
    }

    // إرسال آيات القرآن كل 20 دقيقة
    const currentTime = nowKh.getTime();
    const lastSend = updatedStatus.lastAyatSend || 0;

    if (currentTime - lastSend >= AYAT_INTERVAL) {
        const ayat = await fetchRandomAyat();
        api.sendMessage(ayat, threadID);
        updatedStatus.lastAyatSend = currentTime;
        shouldUpdateDB = true;
    }

    // حفظ التغييرات في قاعدة البيانات
    if (shouldUpdateDB) {
        await updateGroup(threadID, { status: updatedStatus });
    }
}

// --- دالة المعالج العام ---
async function globalHandler(api, event) {
    try {
        const { threadID } = event;
        const threadData = await getGroup(threadID);

        if (!threadData) {
            let threadInfo;
            try {
                threadInfo = await api.getThreadInfo(threadID);
            } catch (err) {
                log.error("Error fetching thread info: " + err);
                return;
            }

            const groupData = {
                id: threadID,
                name: threadInfo.threadName || "",
                emoji: threadInfo.emoji || "",
                img: threadInfo.imageSrc || "",
                members: threadInfo.participantIDs || [],
                admins: (threadInfo.adminIDs || []).map(admin => admin.id || admin),
            };
            await saveGroup(groupData);
        }

        if (!global.schedulerInterval) {
            log.info('Starting global scheduler...');

            global.schedulerInterval = setInterval(async () => {
                try {
                    const activeGroups = await getAllGroups();
                    for (const group of activeGroups) {
                        if (group.status && group.status.on === true) {
                            await scheduleHandler(api, group);
                        }
                    }
                } catch (error) {
                    log.error("Scheduler error: " + error);
                }
            }, CHECK_INTERVAL);
        }

    } catch (error) {
        log.error("Error in global handler: " + error);
    }
};

module.exports = { globalHandler };
