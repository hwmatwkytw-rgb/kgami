// data/skills.js

const skills = [
  {
    name: 'كاميهاميها',
    dmg: { min: 140, max: 200 },
    description: 'هجوم طاقي مرعب، فرصة 10% لتجاهل 50% من دفاع الخصم.',
    effect: 'damage',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'شينرا تينسي',
    dmg: { min: 100, max: 130 },
    description: 'قوة جاذبية تدمر الخصم وتقلل من قوة هجومه بنسبة عشوائية (5%).',
    effect: 'dmgATK',
    type: 'attack',
    limitUse: 4
  },
  {
    name: 'مون بلان غان',
    dmg: { min: 80, max: 300 },
    description: 'هجوم جسدي عنيف يدمر 5% من دفاع الخصم بشكل دائم.',
    effect: 'dmgDEF',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'جيتسوجا تينشو',
    dmg: { min: 60, max: 200 },
    description: 'ضربة سيف طاقية، فرصة 30% لتكرار الضرر مرة أخرى.',
    effect: 'doubleHit',
    type: 'attack',
    limitUse: 5
  },
  {
    name: 'موجة الهاكين',
    dmg: { min: 50, max: 150 },
    description: 'هجوم قوة إرادة يسبب ضررًا عشوائيًا للمستخدم (ارتداد).',
    effect: 'dmgBack',
    type: 'attack',
    limitUse: 2
  },
  {
    name: 'سيف ناروتو',
    dmg: { min: 150, max: 380 },
    description: 'هجوم لولبي ضخم لا يتأثر بدفاع الخصم. ضرر نقي.',
    effect: 'pureDamage',
    type: 'attack',
    limitUse: 2
  },
  {
    name: 'انفجار شظايا',
    dmg: { min: 10, max: 50 },
    description: 'يصيب الخصم 5 مرات بضرر منخفض لكنه يتجاهل الدفاع تماماً (ضرر نقي).',
    effect: 'multiHit',
    type: 'attack',
    limitUse: 4
  },
  {
    name: 'قنبلة الروح',
    dmg: { min: 1, max: 1 },
    description: 'يسبب ضرراً تراكمياً بناءً على عدد المهارات المتبقية للخصم (50 ضرر لكل مهارة).',
    effect: 'skillCountDmg',
    type: 'attack',
    limitUse: 1
  },
  {
    name: 'هجوم الموت',
    dmg: { min: 200, max: 300 },
    description: 'هجوم عنيف مع فرصة 5% لقتل الخصم فوراً (One-Shot).',
    effect: 'deathAttack',
    type: 'attack',
    limitUse: 1
  },
  {
    name: 'هجوم اللمسة',
    dmg: { min: 1, max: 1 },
    description: 'يسبب ضرراً يتناسب مع الفارق الإيجابي بين هجوم ودفاع الخصم.',
    effect: 'touchDmg',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'الضربة العميقة',
    dmg: { min: 120, max: 160 },
    description: 'هجوم قياسي. إذا كان دفاع الخصم (DEF) منخفضاً، يزداد الضرر بنسبة 25%.',
    effect: 'damageLowDEF',
    type: 'attack',
    limitUse: 0
  },
  {
    name: 'صاعقة الهلاك',
    dmg: { min: 40, max: 80 },
    description: 'يصيب الخصم 3 مرات بضرر متوسط مع فرصة 15% لتطبيق تأثير "النزيف" (50 ضرر إضافي لكل دور).',
    effect: 'tripleHitBleed',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'مطر الاسهم',
    dmg: { min: 20, max: 40 },
    description: 'هجوم متعدد يصيب الخصم عشوائياً بين 4 إلى 7 مرات بضرر منخفض.',
    effect: 'randMultiHit',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'سحق الحواجز',
    dmg: { min: 100, max: 240 },
    description: 'هجوم يتجاهل أي دروع أو حماية نشطة على الخصم.',
    effect: 'bypassShield',
    type: 'attack',
    limitUse: 2
  },
  {
    name: 'ألترا إنستينكت',
    dmg: { min: 0, max: 0 },
    description: 'تحول يزيد جميع إحصائياتك (ATK, DEF, SPEED) بنسبة 15%.',
    effect: 'powerX',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'ختم الرينجان',
    dmg: { min: 0, max: 0 },
    description: 'يوقف الخصم من استخدام أي هجوم في دوره القادم.',
    effect: 'lockAttack',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'العلاج الفوري',
    dmg: { min: 0, max: 0 },
    description: 'تستعيد 100% من نقاط صحتك المفقودة.',
    effect: 'fullHeal',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'بركة الشفاء',
    dmg: { min: 150, max: 0 },
    description: 'يشفي الهدف (صديق أو عدو) بمقدار 150 نقطة HP.',
    effect: 'healTarget',
    type: 'effect',
    limitUse: 3
  },
  {
    name: 'استنزاف التشاكرا',
    dmg: { min: 20, max: 0 },
    description: 'يستنزف 20% من قوة هجوم الخصم (ATK).',
    effect: 'manaDrain',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'درع الصمود',
    dmg: { min: 0, max: 0 },
    description: 'زيادة 30% في نقاط الدفاع لديك لدورين.',
    effect: 'defUP',
    type: 'effect',
    limitUse: 3
  },
  {
    name: 'سرقة الطاقة',
    dmg: { min: 0, max: 5 },
    description: 'يسرق مهارة عشوائية واحدة من الخصم لاستخدامها مرة واحدة.',
    effect: 'stealSkill',
    type: 'attack',
    limitUse: 1
  },
  {
    name: 'تكسير الإرادة',
    dmg: { min: 5, max: 15 },
    description: 'يمنح الهدف "لعنة". ضرر اللعنة يعادل 30% من HP الأقصى للهدف.',
    effect: 'curse',
    type: 'attack',
    limitUse: 3
  },
  {
    name: 'تضحية الاتاك',
    dmg: { min: 0, max: 0 },
    description: 'تخسر 25% من نقاط هجومك الحالية لزيادة دفاعك بنسبة 50%.',
    effect: 'sacATKDEF',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'نسخة الظل',
    dmg: { min: 0, max: 0 },
    description: 'تستنسخ نقاط هجومك (ATK) الحالية، وتضيفها لمرة واحدة على هجومك القادم.',
    effect: 'shadowBoost',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'رؤية المستقبل',
    dmg: { min: 0, max: 0 },
    description: 'تجاهل ضرر الهجوم القادم للخصم لمرة واحدة (1 دور).',
    effect: 'evasion',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'تبديل المراكز',
    dmg: { min: 0, max: 0 },
    description: 'تبادل نقاط هجومك (ATK) مع دفاع الخصم (DEF) بشكل دائم.',
    effect: 'swapStats',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'إبطاء الزمن',
    dmg: { min: 0, max: 0 },
    description: 'تقليل سرعة الخصم (SPEED) بنسبة 50% لـ 3 أدوار.',
    effect: 'slow',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'صنع الدرع',
    dmg: { min: 0, max: 0 },
    description: 'يمنح المستخدم درعاً يمتص 300 ضرر في دور الخصم القادم.',
    effect: 'createShield',
    type: 'effect',
    limitUse: 3
  },
  {
    name: 'نسخ القوة',
    dmg: { min: 0, max: 0 },
    description: 'ينسخ نقاط هجوم الخصم ويضيفها إلى هجومك بشكل دائم.',
    effect: 'copyATK',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'تبادل مصيري',
    dmg: { min: 0, max: 0 },
    description: 'تبدل **جميع** إحصائياتك (HP, ATK, DEF, SPEED) مع الخصم لمدة دورين.',
    effect: 'swapAllStats',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'تعبئة الطاقة',
    dmg: { min: 0, max: 0 },
    description: 'تزيد من نقاط الهجوم (ATK) والسرعة (SPEED) لديك بنسبة 20% لدور واحد.',
    effect: 'boostATKSPEED',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'استراحة المحارب',
    dmg: { min: 0, max: 0 },
    description: 'تستعيد 25% من نقاط صحتك المفقودة (Missing HP).',
    effect: 'restoreMissingHP',
    type: 'effect',
    limitUse: 3
  },
  {
    name: 'تضليل بصري',
    dmg: { min: 0, max: 0 },
    description: 'فرصة 50% لتفادي هجوم الخصم القادم.',
    effect: 'evasion50',
    type: 'effect',
    limitUse: 2
  },
  {
    name: 'تثبيت الهدف',
    dmg: { min: 0, max: 0 },
    description: 'تزيد دقة هجومك القادم بنسبة 100% وتمنع الخصم من تفادي ضربتك.',
    effect: 'guaranteedHit',
    type: 'effect',
    limitUse: 3
  },
  {
    name: 'التضحية الكبرى',
    dmg: { min: 0, max: 0 },
    description: 'تخسر 100% من HP، وهناك فرصة 50% لقتل الخصم فوراً معك.',
    effect: 'megaSacrifice',
    type: 'attack',
    limitUse: 1
  },
  {
    name: 'الطاقة القصوي',
    dmg: { min: 0, max: 0 },
    description : 'ارفع من جميع احصائياتك الأساسية (HP, ATK, DEF, SPEED) بنسبة 50% بشكل دائم خلال هذه المعركة.',
    effect: 'powerXII',
    type: 'effect',
    limitUse: 1
  },
  {
    name: 'زايلي',
    dmg: { min: 0, max: 0 },
    description : 'يخسر الخصم HP قدر نقاط ATK الخاصة بك (ضرر خالص يتجاهل الدفاع تماماً).',
    type: 'attack',
    effect: 'loseATKHP',
    limitUse: 2
  },
  {
    name: 'ضربة القدر',
    dmg: { min: 300, max: 500 },
    description: 'تضرب الخصم بضرر عالٍ جداً، لكنها تقلل من سرعة (SPEED) المهاجم بنسبة 10% لدور واحد.',
    type: 'attack',
    effect: 'highDmgLowSpeed',
    limitUse: 2
  },
  {
    name: 'عدالة القوة',
    dmg: { min: 0, max: 0 },
    description : 'إذا كان الـ HP الخاص بك أقل من 30%، فإن هذا الهجوم يسبب ضرراً إضافياً بنسبة 300% (لتصبح 400% من الضرر الأصلي).',
    type: 'attack',
    effect: 'lowHPDamageBoost',
    limitUse: 3
  },
  {
    name: 'انصهار الابعاد',
    dmg: { min: 500, max: 700 },
    description : 'أقوى ضربة فردية. تتجاهل دفاع الخصم بالكامل ولا يمكن تفاديها.',
    effect: 'ultimatePureDmg',
    type: 'attack',
    limitUse: 1
  },
  {
    name: 'حاجز الامبراطور',
    dmg: { min: 0, max: 0 },
    description : 'تمنحك درعاً يصد 75% من الضرر الوارد في الدور القادم، مع فرصة 20% لزيادة الدفاع الدائم بنسبة 10%.',
    type: 'defense',
    effect: 'shield75AndDefBoost',
    limitUse: 1
  },
  {
    name: 'انعكاس الضرر',
    dmg: { min: 0, max: 0 },
    description : 'يعكس 100% من ضرر الهجوم القادم (هجوم واحد فقط) على المهاجم. لا يمكن إزالة هذا التأثير.',
    type: 'defense/utility',
    effect: 'reflectDamage100',
    limitUse: 1
  },
  {
    name: 'تسارع الابعاد', // 🥇 تم تعديلها (إزالة الدور الإضافي)
    dmg: { min: 0, max: 0 },
    description : 'تزيد من سرعة (SPEED) شخصيتك بنسبة **50%** لمدة 3 أدوار متتالية.',
    type: 'effect',
    effect: 'speedBoost50Percent', // تم تغيير اسم التأثير
    limitUse: 1
  },
  {
    name: 'استنزاف المصير',
    dmg: { min: 0, max: 0 },
    description : 'تستنزف كل نقاط الهجوم (ATK) للخصم لدورين، وتضيف 50% من القيمة المستنزفة إلى هجومك الحالي.',
    type: 'utility',
    effect: 'drainATKtoSelf',
    limitUse: 1
  },
  {
    name: 'امتصاص الروح',
    dmg: { min: 100, max: 200 },
    description : 'تسبب ضرراً متوسطاً وتستعيد 50% من الضرر الذي ألحقته كنقاط صحة (HP).',
    type: 'attack/heal',
    effect: 'lifeSteal50',
    limitUse: 5
  },
  {
    name: 'التطهير المطلق',
    dmg: { min: 0, max: 0 },
    description : 'تزيل جميع التأثيرات السلبية عنك وعن الخصم، وتزيد دفاعك (DEF) بنسبة 20% لدور واحد.',
    type: 'utility',
    effect: 'absoluteCleanse',
    limitUse: 1
  },
  {
    name: 'همسة الضعف',
    dmg: { min: 0, max: 0 },
    description : 'تقلل من دفاع الخصم (DEF) بنسبة 40% لمدة دورين.',
    type: 'utility',
    effect: 'defDown40_2turns',
    limitUse: 3
  },
  {
    name: 'تضحية الابدية',
    dmg: { min: 0, max: 0 },
    description : 'تخسر 50% من نقاط هجومك الحالية بشكل دائم لتزيد دفاعك (DEF) بنسبة 100% لبقية المعركة.',
    type: 'effect',
    effect: 'permanentDEFBoost',
    limitUse: 1
  },
  {
    name: 'سيطرة الجاذبية',
    dmg: { min: 120, max: 180 },
    description : 'هجوم قوي يتسبب في تثبيت الخصم، مما يقلل من دفاعه وسرعته بنسبة 25% لمدة دورين.',
    type: 'attack/utility',
    effect: 'gravityDebuff',
    limitUse: 2
  },
  {
    name: 'تجديد الروح',
    dmg: { min: 0, max: 0 },
    description : 'تستعيد نقاط صحة (HP) تعادل 75% من قيمة هجومك (ATK) الحالية.',
    type: 'heal',
    effect: 'healBasedOnATK',
    limitUse: 2
  },
  {
    name: 'لعنة التضخم',
    dmg: { min: 0, max: 0 },
    description : 'تبدل نقاط HP الحالية للخصم مع نقاط  الحالية DEF.',
    type: 'utility',
    effect: 'swapHPDEFOnce',
    limitUse: 1
  },
  {
    name: 'الابادة اللانهائية',
    dmg: { min: 1, max: 5 },
    description : 'تطبق تأثير "النزيف المتفجر" الذي يستهلك 15% من HP الخصم في نهاية كل دور لمدة 3 أدوار.',
    type: 'attack/dot',
    effect: 'explosiveBleed',
    limitUse: 1
  },
  {
    name: 'ختم الابدية',
    dmg: { min: 0, max: 0 },
    description : 'تجعل HP الخصم الحالي يساوي HP المستخدم الحالي، بغض النظر عن الحد الأقصى لكليهما.',
    type: 'utility',
    effect: 'equalizeHP',
    limitUse: 1
  },
  {
    name: 'هجوم النسبة المئوية',
    dmg: { min: 0, max: 0 },
    description : 'يسبب ضرراً نقياً يعادل 35% من نقاط الصحة القصوى (Max HP) للخصم.',
    type: 'attack',
    effect: 'maxHPPercentDamage',
    limitUse: 2
  },
  {
    name: 'سلسلة القدر',
    dmg: { min: 100, max: 150 },
    description : 'تسبب ضرراً للخصم، وفي المقابل تزيد سرعة المهاجم بنسبة 20% وهجومه بنسبة 10% لدورين.',
    type: 'attack/boost',
    effect: 'chainBoost',
    limitUse: 2
  }
  
  
];

module.exports = skills;
