const squad = require("../data/squad");
const { getUser, updateUser } = require("../data/user");
const { styleNum, styleText } = require('../tools');
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================== إعدادات النظام ================== */
const LINE = "＿＿＿＿＿＿＿";
const BULLET = "⊳";
const CREATION_COST = 5000;
const AUTO_CANCEL_TIME = 5 * 60 * 1000;

let squadTimeout = null;

/* ================== الخرائط ================== */
const MAPS = [
    { name: "السهول المفتوحة", stat: "SPD", desc: "أرض منبسطة تعطي الأفضلية للأسرع." },
    { name: "الخندق الدفاعي", stat: "DEF", desc: "تضاريس وعرة تزيد من فرص الدفاع." },
    { name: "برج المراقبة", stat: "IQ", desc: "مواقع استراتيجية تخدم الأذكى." },
    { name: "حلبة المصارعة", stat: "ATK", desc: "مساحة ضيقة تفرض الاشتباك العنيف." },
    { name: "الغابة الكثيفة", stat: "SPD", desc: "الأشجار تعيق الرؤية وتخدم المناورة." },
    { name: "المختبر المهجور", stat: "IQ", desc: "أدوات مبعثرة يمكن استغلالها بذكاء." },
    { name: "الجبل البركاني", stat: "ATK", desc: "الحرارة تزيد من حدة الغضب والهجوم." },
    { name: "القلعة الحديدية", stat: "DEF", desc: "جدران صلبة ترفع قدرة التحمل." }
];

/* ================== أدوات النظام ================== */

async function broadcast(api, msg) {
    const threads = new Set();
    if (squad.teams.A?.threadID) threads.add(squad.teams.A.threadID);
    if (squad.teams.B?.threadID) threads.add(squad.teams.B.threadID);
    for (const tID of threads) await api.sendMessage(msg, tID).catch(() => {});
}

function startAutoCancelTimer(api) {
    if (squadTimeout) clearTimeout(squadTimeout);
    squadTimeout = setTimeout(async () => {
        if (squad.active && squad.phase !== "battle") {
            await broadcast(api, `${LINE}\n انتهى وقت الانتظار. تم إلغاء السكواد تلقائيا.`);
            resetSquad();
        }
    }, AUTO_CANCEL_TIME);
}

function resetSquad() {
    if (squadTimeout) clearTimeout(squadTimeout);
    squad.active = false;
    squad.teams.A = null;
    squad.teams.B = null;
    squad.phase = "idle";
}

function findTeamKey(input) {
    if (!input) return null;
    const norm = input.toLowerCase().trim();
    if (squad.teams.A && (norm === "a" || squad.teams.A.name.toLowerCase().includes(norm))) return 'A';
    if (squad.teams.B && (norm === "b" || squad.teams.B.name.toLowerCase().includes(norm))) return 'B';
    return null;
}

/* ================== محرك اتخاذ القرار ================== */

function calcDamage(atk, def, multiplier = 1) {
    const defenseMitigation = def > 0 ? (100 / (100 + def)) : 1;
    let dmg = atk * defenseMitigation * multiplier;
    const variance = (Math.random() * 0.3) + 0.85;
    return Math.floor(Math.max(dmg * variance, 10));
}

function generateScenario(actor, target, matchStats) {
    const myStats = actor.u.character;
    const targetStats = target.u.character;
    const tName = target.u.character.name; // اسم الخصم لاستخدامه في النصوص
    const hpPct = actor.m.state.currentHP / actor.m.state.maxHP;
    
    const iqDiff = myStats.IQ - targetStats.IQ;
    const spdDiff = myStats.SPD - targetStats.SPD;
    const atkVsDef = myStats.ATK - targetStats.DEF;
    
    let scenarios = [];
    
    // تم تعديل النصوص لذكر اسم الخصم (tName)
    if (iqDiff > 500) {
        scenarios.push(
            { type: "DMG", mult: 1.4, txt: `توقع حركة ${tName} قبل حدوثها ووجه ضربة استباقية` }, 
            { type: "DMG", mult: 1.3, txt: `كشف نقطة ضعف في درع ${tName} واستهدفها بدقة` }, 
            { type: "FOCUS", txt: `بدأ بتحليل نمط تنفس ${tName} لزيادة دقة الضربة التالية` }, 
            { type: "TRAP", mult: 1.1, txt: `استدرج ${tName} لفخ نصبه باستخدام التضاريس` }, 
            { type: "COUNTER", mult: 1.5, txt: `سمح لـ ${tName} بالاقتراب ثم باغته بهجوم مرتد ذكي` }
        );
    }
    if (spdDiff > 500) {
        scenarios.push(
            { type: "DMG", mult: 1.2, txt: `استخدم سرعته الفائقة ليصبح كالطيف وضرب ${tName} من الخلف` }, 
            { type: "MULTI", mult: 1.1, txt: `وجه سلسلة من اللكمات السريعة نحو ${tName} لا ترى بالعين` }, 
            { type: "DODGE_ATK", mult: 0.9, txt: `راوغ هجوم ${tName} ببراعة ثم سدد ركلة سريعة` }, 
            { type: "BLITZ", mult: 1.3, txt: `انقض بسرعة البرق قبل أن يرفع ${tName} دفاعه` }, 
            { type: "CIRCLE", mult: 1.0, txt: `بدأ بالدوران حول ${tName} ليشعره بالدوار ثم هاجم` }
        );
    }
    if (atkVsDef > 1000) {
        scenarios.push(
            { type: "DMG", mult: 1.6, txt: `حطم دفاعات ${tName} بضربة مدمرة تهز الأرض` }, 
            { type: "KNOCKBACK", mult: 1.4, txt: `لكمة ثقيلة قذفت بـ ${tName} عدة أمتار للخلف` }, 
            { type: "CRUSH", mult: 1.5, txt: `أمسك بـ ${tName} وسحقه بقوة بدنية هائلة` }, 
            { type: "ROAR", mult: 1.2, txt: `أطلق صرخة قتالية أرعبت ${tName} ثم هجم بكل ثقله` }
        );
    }
    if (atkVsDef < -1000) {
        scenarios.push(
            { type: "DMG", mult: 0.5, txt: `حاول الهجوم لكن درع ${tName} كان صلبا جدا` }, 
            { type: "FAIL", mult: 0, txt: `كسر سلاحه على جسد ${tName} الصلب دون جدوى` }, 
            { type: "DMG", mult: 0.7, txt: `بحث عن ثغرة في دفاع ${tName} الحصين ووجد خدشا بسيطا` }, 
            { type: "TIRED", mult: 0.6, txt: `أنهكه ضرب ${tName} الذي لا يتزحزح` }
        );
    }
    if (hpPct < 0.25) {
        scenarios.push(
            { type: "HEAL", txt: "تراجع للخلف بخوف محاولا إيقاف النزيف" }, 
            { type: "DESPERATE", mult: 1.8, txt: `هاجم ${tName} بتهور تام غير مبال بحياته ضربة انتحارية` }, 
            { type: "ADRENALINE", mult: 1.4, txt: "دب الأدرينالين في عروقه فقاتل بشراسة الجريح" }, 
            { type: "HIDE", txt: `حاول الاختباء من ${tName} والتقاط أنفاسه خلف صخرة` }, 
            { type: "MISS", txt: `الترنح والإعياء جعله يخطئ ${tName} تماما` }
        );
    }
    
    // سيناريوهات عامة
    scenarios.push(
        { type: "DMG", mult: 1.0, txt: `اشتباك بالأيدي وتبادل للكمات المباشرة مع ${tName}` }, 
        { type: "DMG", mult: 1.1, txt: `رمى حفنة من التراب في عين ${tName} ثم هاجم` }, 
        { type: "TRIP", mult: 0.8, txt: `تعثر أثناء الهجوم لكنه نجح في إصابة ${tName} بقدمه` }, 
        { type: "LUCKY", mult: 1.3, txt: `أغمض عينيه وضرب عشوائيا فكانت إصابة موفقة في ${tName}` }, 
        { type: "WEAPON", mult: 1.2, txt: "التقط حجرا من الأرض واستخدمه كسلاح" }, 
        { type: "SHOUT", mult: 0.9, txt: `شتم ${tName} ليستفزه ثم باغته بضربة` }, 
        { type: "CLASH", mult: 1.0, txt: `تصادمت الهالات مع ${tName} محدثة موجة دفع قوية` }
    );
    
    return scenarios[Math.floor(Math.random() * scenarios.length)];
}

/* ================== المعركة ================== */

async function playRound(roundNum, api) {
    const currentMap = MAPS[Math.floor(Math.random() * MAPS.length)];
    
    let allActors = [];
    ["A", "B"].forEach(key => {
        if (squad.teams[key]) {
            squad.teams[key].members.forEach(m => {
                if (m.state.currentHP > 0) allActors.push({ team: key, m });
            });
        }
    });
    
    for (let actor of allActors) {
        actor.u = actor.m.u;
    }
    
    await broadcast(api, `${LINE}\nالجولة ${styleNum(roundNum)} في ${currentMap.name}\n${currentMap.desc}`);
    await wait(20000);
    
    allActors.sort((a, b) => {
        let spdA = a.u.character.SPD + (currentMap.stat === "SPD" ? 30 : 0);
        let spdB = b.u.character.SPD + (currentMap.stat === "SPD" ? 30 : 0);
        return spdB - spdA;
    });
    
    let winner = null;
    
    // التكرار حتى الموت (من الإصلاح السابق)
    while (!winner) {
        for (const actor of allActors) {
            if (actor.m.state.currentHP <= 0) continue;
            
            const enemyKey = actor.team === "A" ? "B" : "A";
            const enemies = allActors.filter(a => a.team === enemyKey && a.m.state.currentHP > 0);
            
            if (enemies.length === 0) {
                winner = actor.team;
                break;
            }
            
            let target;
            if (actor.u.character.IQ > 1200) {
                target = enemies.sort((a, b) => a.m.state.currentHP - b.m.state.currentHP)[0];
            } else {
                target = enemies[Math.floor(Math.random() * enemies.length)];
            }
            
            const event = generateScenario(actor, target, {});
            
            if (event.type === "HEAL") {
                const heal = Math.floor(actor.m.state.maxHP * 0.25);
                actor.m.state.currentHP = Math.min(actor.m.state.maxHP, actor.m.state.currentHP + heal);
                await broadcast(api, `${BULLET} ${actor.u.character.name} ${event.txt} استعاد ${styleNum(heal)} ${styleText('hp')}`);
            }
            else if (event.type === "FOCUS" || event.type === "HIDE") {
                actor.m.state.focus = true;
                await broadcast(api, `${BULLET} ${actor.u.character.name} ${event.txt}`);
            }
            else if (event.type === "FAIL" || event.type === "MISS") {
                await broadcast(api, `${BULLET} ${actor.u.character.name} ${event.txt}`);
            }
            else {
                let dmg = calcDamage(actor.u.character.ATK, target.u.character.DEF, event.mult);
                
                if (currentMap.stat === "ATK") dmg = Math.floor(dmg * 1.15);
                if (currentMap.stat === "DEF") dmg = Math.floor(dmg * 0.85);
                
                if (actor.m.state.focus) {
                    dmg = Math.floor(dmg * 1.8);
                    actor.m.state.focus = false;
                    event.txt += " مع تركيز تام";
                }
                
                actor.m.stats.totalDamage += dmg;
                target.m.state.currentHP -= dmg;
                
                let msg = `${BULLET} ${actor.u.character.name} ${event.txt}`;
                msg += `\n${styleText('Hp')} -${styleNum(dmg)} | المتبقي: ${Math.max(0, styleNum(target.m.state.currentHP))}`;
                
                if (target.m.state.currentHP <= 0) {
                    target.m.state.currentHP = 0;
                    msg += `\n   سقط ${target.u.character.name} مهزوما`;
                    actor.m.stats.kills += 1;
                }
                
                await broadcast(api, msg);
            }
            
            await wait(10000);
            
            if (enemies.filter(e => e.m.state.currentHP > 0).length === 0) {
                winner = actor.team;
                break;
            }
        }
    }
    
    return winner;
}

async function startMatch(api) {
    if (squadTimeout) clearTimeout(squadTimeout);
    squad.phase = "battle";
    
    const preparationPromises = [];
    ["A", "B"].forEach(key => {
        if (squad.teams[key]) {
            squad.teams[key].members.forEach(m => {
                const p = getUser(m.id).then(u => {
                    m.u = u;
                    m.state = {
                        maxHP: u.character.HP,
                        currentHP: u.character.HP,
                        focus: false
                    };
                    m.stats = {
                        totalDamage: 0,
                        kills: 0,
                        moneyChange: 0,
                    };
                });
                preparationPromises.push(p);
            });
        }
    });
    await Promise.all(preparationPromises);
    
    await broadcast(api, `${LINE}\nبدا الاسكواد\n${squad.teams.A.name} ${styleText('vs')} ${squad.teams.B.name}\n`);
    await wait(20000);
    
    let scoreA = 0,
        scoreB = 0;
    
    for (let i = 1; i <= 4; i++) {
        ["A", "B"].forEach(key => squad.teams[key].members.forEach(m => m.state.currentHP = m.state.maxHP));
        const rWinner = await playRound(i, api);
        if (rWinner === "A") scoreA++;
        if (rWinner === "B") scoreB++;
        
        await broadcast(api, `${LINE}\nالنتيجة الحالية: ${squad.teams.A.name} [${styleNum(scoreA)}] - [${styleNum(scoreB)}] ${squad.teams.B.name}`);
        await wait(10000);
        if (scoreA === 3 || scoreB === 3) break;
    }
    
    if (scoreA === scoreB) {
        await wait(10000);
        await broadcast(api, `${LINE}\nتعادل الفريقين\nجولة حاسمة`);
        ["A", "B"].forEach(key => squad.teams[key].members.forEach(m => m.state.currentHP = m.state.maxHP));
        const rWinner = await playRound("الحاسمة", api);
        if (rWinner === "A") scoreA++;
        else if (rWinner === "B") scoreB++;
    }
    
    const finalWinner = scoreA > scoreB ? "A" : "B";
    const finalLoser = finalWinner === "A" ? "B" : "A";
    
    const winners = squad.teams[finalWinner].members;
    const losers = squad.teams[finalLoser].members;
    let loot = 0;
    
    for (const m of losers) {
        const u = m.u;
        const loss = Math.floor(u.money * 0.50);
        if (loss > 0) {
            u.money -= loss;
            loot += loss;
            m.stats.moneyChange = -loss;
        }
    }
    
    const share = Math.floor((loot + 500) / winners.length);
    for (const m of winners) {
        const u = m.u;
        u.money += share;
        u.rating = (u.rating || 0) + 1;
        m.stats.moneyChange = share;
    }
    
    const updatePromises = [];
    [...winners, ...losers].forEach(m => {
        updatePromises.push(updateUser(m.id, { money: m.u.money, rating: m.u.rating }));
    });
    await Promise.all(updatePromises);
    
    await broadcast(api, `${LINE}\nانتصر فريق ${squad.teams[finalWinner].name}\nالنتيجة النهائية: ${styleNum(scoreA)} - ${styleNum(scoreB)}`);
    
    await wait(5000);
    let finalStatsMsg = `${LINE}\n${BULLET} الإحصائيات `;
    const formatTeamStats = (team) => {
        let teamMsg = `\n${BULLET}فريق ${team.name} --\n`;
        team.members.forEach(m => {
            teamMsg += `${BULLET} ${m.u.character.name}\n`;
            teamMsg += `  - ${styleText('dmg')}: ${styleNum(m.stats.totalDamage)}\n`;
            teamMsg += `  - ${styleText('kill')}: ${styleNum(m.stats.kills)}\n`;
            const change = m.stats.moneyChange;
            teamMsg += `  - ${styleText('money')}: ${change >= 0 ? '+' : ''}${styleNum(change)}\n`;
        });
        return teamMsg;
    };
    finalStatsMsg += formatTeamStats(squad.teams[finalWinner]);
    finalStatsMsg += formatTeamStats(squad.teams[finalLoser]);
    await broadcast(api, finalStatsMsg);
    resetSquad();
}

/* ================== الأوامر ================== */

module.exports = {
    name: "سكواد",
    rank: 0,
    
    run: async (api, event, commands, args) => {
        const { senderID, threadID, messageID } = event;
        const sub = args[0];
        const user = await getUser(senderID);
        if (!user || !user.character) return api.sendMessage("أنت لا تملك شخصية.", threadID);
        
        if (!sub) {
            return api.sendMessage(
                `${LINE}\nنظام السكواد\n` +
                `${BULLET} انشاء اسم : دفع ${CREATION_COST} غير مستردة\n` +
                `${BULLET} انضم اسم : الانضمام لفريق\n` +
                `${BULLET} خروج : مغادرة الفريق الحالي\n` +
                `${BULLET} بدء : للقائد\n` +
                `${BULLET} الغاء : للقائد  \n` +
                `${BULLET} حالة : عرض الفرق وتفاصيل الأعضاء`,
                threadID, event.messageID);
        }
        
        if (sub === "انشاء") {
            if (squad.teams.A && squad.teams.B) return api.sendMessage("يوجد سكواد نشط بالكامل حاليا.", threadID, event.messageID);
            if (user.money < CREATION_COST) return api.sendMessage(`لا تملك ${styleNum(CREATION_COST)} لفتح الساحة.`, threadID, event.messageID);
            
            const teamKey = !squad.teams.A ? "A" : (!squad.teams.B ? "B" : null);
            if (!teamKey) return api.sendMessage("الساحة ممتلئة!", threadID, messageID);
            
            const name = args.slice(1).join(" ");
            if (!name) return api.sendMessage("اكتب اسم للفريق", threadID, messageID);
            
            squad.teams[teamKey] = {
                name,
                leader: senderID,
                threadID: threadID,
                ready: false,
                members: [{ id: senderID }]
            };
            squad.active = true;
            startAutoCancelTimer(api);
            return api.sendMessage(`${BULLET} تم تأسيس فريق [${name}]`, threadID, messageID);
        }
        
        if (sub === "انضم" || sub === "انضمام") {
            if (squad.phase === "battle") return api.sendMessage("إنك لأكل العدس بالجبن\nلقد بدات المعركة بالفعل", threadID, messageID);
            
            const teamNamePart = args.slice(1).join(" ");
            const targetKey = findTeamKey(teamNamePart);
            if (!targetKey) return api.sendMessage("لم اعثر على فريق بهذا الاسم.", threadID, messageID);
            
            if (squad.teams.A?.members.some(m => m.id === senderID) || squad.teams.B?.members.some(m => m.id === senderID)) {
                return api.sendMessage("انت منضم بالفعل للفريق.", threadID, messageID);
            }
            
            squad.teams[targetKey].members.push({ id: senderID });
            await api.sendMessage(`${BULLET} انضم ${user.character.name} الى فريق ${squad.teams[targetKey].name}`, threadID);
            return;
        }
        
        if (sub === "خروج" || sub === "مغادرة") {
            if (!squad.active) return;
            if (squad.phase === "battle") return api.sendMessage("لا يمكنك الخروج أثناء القتال.", threadID, event.messageID);
            
            let teamKey = squad.teams.A?.members.some(m => m.id === senderID) ? "A" : (squad.teams.B?.members.some(m => m.id === senderID) ? "B" : null);
            if (!teamKey) return api.sendMessage("أنت لست في أي فريق.", threadID, event.messageID);
            
            if (squad.teams[teamKey].leader === senderID) {
                if (teamKey === "A") {
                    await broadcast(api, `${BULLET} غادر القائد المؤسس. تم إلغاء السكواد.`);
                    resetSquad();
                } else {
                    squad.teams.B = null;
                    await broadcast(api, `${BULLET} انسحب قائد الفريق الثاني. تم حل الفريق.`);
                }
            } else {
                squad.teams[teamKey].members = squad.teams[teamKey].members.filter(m => m.id !== senderID);
                api.sendMessage(`${BULLET} غادر ${user.character.name} الفريق.`, threadID);
            }
            return;
        }
        
        if (sub === "بدء") {
            if (!squad.teams.A || !squad.teams.B) return api.sendMessage("يجب وجود فريقين للبدء.", threadID, event.messageID);
            let myTeam = squad.teams.A.leader === senderID ? squad.teams.A : (squad.teams.B.leader === senderID ? squad.teams.B : null);
            if (!myTeam) return;
            myTeam.ready = true;
            api.sendMessage(`${BULLET} فريق ${myTeam.name} جاهز`, threadID);
            if (squad.teams.A.ready && squad.teams.B.ready) startMatch(api);
        }
        
        if (sub === "الغاء") {
            if (squad.teams.A?.leader === senderID) {
                await broadcast(api, "تم إلغاء السكواد بطلب من المؤسس.");
                resetSquad();
            }
        }
        
        if (sub === "حالة") {
            if (!squad.active) return api.sendMessage("لا يوجد سكواد.", threadID, messageID);
            let msg = `${LINE}\nحالة السكواد النشط:\n`;
            for (const k of ["A", "B"]) {
                if (squad.teams[k]) {
                    const team = squad.teams[k];
                    msg += `\n[فريق ${team.name}] [${styleNum(team.members.length)}]\n`;
                    for (const m of team.members) {
                        try {
                            const u = await getUser(m.id);
                            const leaderMark = team.leader === m.id ? `  القائد` : "";
                            let hpInfo = squad.phase === "battle" ? ` ${styleText('hp')}: ${styleNum(m.state.currentHP)}/${styleNum(m.state.maxHP)}` : ` HP: ${styleNum(u.character.HP)}`;
                            msg += `${BULLET} ${u.character.name}${leaderMark}${hpInfo}\n`;
                        } catch (e) { msg += `${BULLET} [عضو غير معروف]\n`; }
                    }
                    if (team.ready) msg += `جاهز للبدء ✅\n`;
                }
            }
            return api.sendMessage(msg, threadID, messageID);
        }
    }
};

