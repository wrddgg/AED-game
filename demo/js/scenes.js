/* ============================================================
   scenes.js — 《生命守护者》数据驱动场景系统 v3
   每个节点可配置 images/videos/sounds 各2个槽位
   url 使用 assets 下的无扩展名基路径，运行时自动补全扩展名
   ============================================================ */

/* ========== 素材槽位模板 ==========
   每个节点：
     assets.images[]  — 图片槽，建议写成 assets/images/<sceneId>/main
     assets.videos[]  — 视频槽，建议写成 assets/videos/<sceneId>/main
     assets.sounds[]  — 声音槽，建议写成 assets/audio/<type>/... 基路径
     speed            — CSS变量覆盖 { media, text, hold }
   ============================================================ */

const SCENES = {

  // ==================== 序幕标题卡 ====================

  prologue_title: {
    id: "prologue_title",
    chapter: "",
    title: "",
    stage: "",
    mode: "titlecard",
    titleText: "序 幕",
    reviewTags: ["序幕"],
    assets: null,
    speed: null,
    lines: [],
    next: "prologue_factory"
  },

  // ==================== 序幕 ====================

  prologue_factory: {
    id: "prologue_factory",
    chapter: "序幕",
    title: "抹不掉的浓烟",
    stage: "factory_fire",
    mode: "narration",
    reviewTags: ["序幕"],
    assets: {
      images: [
        { url: "assets/images/prologue_factory/main", cssClass: "bg-main",     startTime: 0, endTime: 0 },
        { url: "assets/images/prologue_factory/detail", cssClass: "bg-overlay",  startTime: 0, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/prologue_factory/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/prologue_factory/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/bgm/prologue_factory__bgm_1", type: "bgm",   startTime: 0, endTime: 0, volume: 0.6 },
        { url: "assets/audio/sfx/prologue_factory__sfx_1", type: "sfx",   startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "三年前，他在另一场火里退后了一步。", hl: ["三年前", "退后了一步"] },
      { text: "那个人的脸，他到现在还记得。", hl: ["到现在还记得"] },
      { text: "保安拦着他说：", hl: ["保安拦着"] },
      { text: "\"小伙子别逞能，进去了连你也出不来！\"", hl: ["进去了连你也出不来"] },
      { text: "他听了劝，退回去了。", hl: ["退回去了"] },
      { text: "结果，里面的人没出来。", hl: ["没出来"] },
      { text: "这件事他从没对任何人提起，", hl: ["从没对任何人提起"] },
      { text: "但它变成了焊在心里的铁钉。", hl: ["焊在心里的铁钉"] }
    ],
    next: "prologue_hands"
  },

  prologue_hands: {
    id: "prologue_hands",
    chapter: "序幕",
    title: "雨夜的油门",
    stage: "rain_road",
    mode: "narration",
    rain: true,
    reviewTags: ["序幕"],
    assets: {
      images: [
        { url: "assets/images/prologue_hands/main", cssClass: "bg-main",    startTime: 0, endTime: 0 },
        { url: "assets/images/prologue_hands/detail", cssClass: "bg-detail",  startTime: 0, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/prologue_hands/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/prologue_hands/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/bgm/prologue_hands__bgm_1", type: "bgm",   startTime: 0, endTime: 0, volume: 0.6 },
        { url: "assets/audio/ambient/prologue_hands__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.4 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "后来他换了很多工作，也换了城市。", hl: ["换了很多工作", "换了城市"] },
      { text: "来临江三年，送外卖是第7份工作。", hl: ["第7份工作"] },
      { text: "但他没换掉一个习惯——", hl: ["没换掉"] },
      { text: "每次路过医院，他都会多看一眼急诊科的灯。", hl: ["急诊科的灯"] },
      { text: "他不是英雄，", hl: ["不是英雄"] },
      { text: "他只是一个背负着\"上次没蹲下去\"的记忆、", hl: ["上次没蹲下去"] },
      { text: "这次想要不一样的人。", hl: ["想要不一样"] }
    ],
    next: "prologue_phone"
  },

  prologue_phone: {
    id: "prologue_phone",
    chapter: "序幕",
    title: "剧本的选择",
    stage: "rain_road",
    mode: "narration",
    rain: true,
    reviewTags: ["序幕"],
    assets: {
      images: [
        { url: "assets/images/prologue_phone/main", cssClass: "bg-split-left",  startTime: 0, endTime: 0 },
        { url: "assets/images/prologue_phone/detail", cssClass: "bg-split-right", startTime: 0, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/prologue_phone/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/prologue_phone/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/bgm/prologue_phone__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/prologue_phone__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 1.0 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "今天，他只是一个想把最后一份外卖准时送到、", hl: ["准时送到"] },
      { text: "不被扣钱的普通人。", hl: ["普通人"] },
      { text: "但城市给每个人的剧本，有时候不止一份。", hl: ["不止一份"] }
    ],
    next: "prologue_rain"
  },

  prologue_rain: {
    id: "prologue_rain",
    chapter: "序幕",
    title: "雨夜的圆圈",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["序幕"],
    assets: {
      images: [
        { url: "assets/images/prologue_rain/main", cssClass: "bg-wide",   startTime: 0, endTime: 0 },
        { url: "assets/images/prologue_rain/detail", cssClass: "bg-detail", startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/prologue_rain/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/prologue_rain/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/prologue_rain__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/prologue_rain__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "21:17，台风银杏登陆第三个小时。", hl: ["21:17", "台风银杏"] },
      { text: "临江市120接警量超过平时的3倍。", hl: ["120", "3倍"] },
      { text: "倒计时，开始。", hl: ["倒计时"] }
    ],
    nextLines: [
      { mode: "narration", text: "人群外侧，地铁保安马志国正张开手臂往后退外围", hl: ["张开手臂"] },
      { mode: "narration", text: "\"退一步，留出空间，别挤\"", hl: ["退一步"] },
      { mode: "narration", text: "他缺了一截的左手无名指在灯光下格外显眼", hl: ["缺了一截", "无名指"] },
      { mode: "narration", text: "退伍兵的习惯让他先把秩序管起来", hl: ["退伍兵"] },
      { mode: "narration", text: "但他还没敢走到圆心", hl: ["没敢走到圆心"] },
      { mode: "narration", text: "人群前排，护理实习生林小雨已蹲下来透过人缝看老人的脸色", hl: ["护理实习生"] },
      { mode: "narration", text: "她的嘴唇动了动，但导师那句\"院外别乱动\"像一道锁扣在喉咙上", hl: ["院外别乱动"] },
      { mode: "narration", text: "她的手伸进包里，摸到了手机", hl: ["手机"] },
      { mode: "narration", text: "她其实已经输了120，只是还没按下拨出键", hl: ["输了120", "还没按下"] }
    ],
    next: "choice_1"
  },

  // ==================== 第一章 · 选择点1 ====================

  choice_1: {
    id: "choice_1",
    chapter: "第一章",
    title: "面对眼前的圆圈，第一反应是？",
    stage: "rain_road",
    mode: "choice",
    rain: true,
    reviewTags: ["选择点1"],
    assets: {
      images: [
        { url: "assets/images/choice_1/main", cssClass: "bg-main",   startTime: 0, endTime: 0 },
        { url: "assets/images/choice_1/detail", cssClass: "bg-circle", startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/choice_1/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/choice_1/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/choice_1__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/choice_1__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远猛地捏死刹车，电动车在湿滑的地面上甩尾停下。", hl: ["猛地捏死刹车"] },
      { text: "他看着那个围成圆圈的人群，", hl: ["围成圆圈"] },
      { text: "三年前那场大火的浓烟仿佛又在眼前升起。", hl: ["又在眼前升起"] }
    ],
    choices: [
      { key: "A", label: "挤进圆心",   desc: "更快接近患者，延误较少。",               risk: null,               next: "enter_circle", effects: { press_start_delay: 5,  witness_credibility: 1, _pathLabel: "choice_1:A" } },
      { key: "B", label: "举起手机",   desc: "留下证据，但会增加延误与传播风险。",     risk: "延误+12秒，舆论扩散+2", next: "film_first",   effects: { press_start_delay: 12, public_spread: 2,       _pathLabel: "choice_1:B" } }
    ]
  },

  // ==================== 分支A · enter_circle ====================

  enter_circle: {
    id: "enter_circle",
    chapter: "第一章",
    title: "拨开人群",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    speaker: "王远",
    reviewTags: ["第一阶段"],
    assets: {
      images: [
        { url: "assets/images/enter_circle/main", cssClass: "bg-kneel",   startTime: 0, endTime: 0 },
        { url: "assets/images/enter_circle/detail", cssClass: "bg-face",    startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/enter_circle/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/enter_circle/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/enter_circle__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/enter_circle__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "让让！别堵着！给他留出空间，别挡急救！", hl: ["留出空间"] }
    ],
    nextLines: [
      { mode: "narration", text: "他先扫过车流、水面和裸露电线：圆心在雨棚内侧，可以靠近。", hl: ["车流", "水面", "裸露电线", "可以靠近"], important: true },
      { mode: "narration", text: "王远顾不上锁车，甚至没摘头盔，一把推开外围打伞的围观者，冲进雨棚内侧。膝盖一软，重重地跪在湿滑的防滑地砖上。", hl: ["膝盖一软", "跪在湿滑的防滑地砖上"] },
      { mode: "narration", text: "老人的脸灰白，嘴唇已经开始发绀、发紫。他没有搬动老人，只是在肩旁蹲下，先确认反应和呼吸。", hl: ["灰白", "发绀发紫"] },
      { mode: "dialogue", speaker: "王远", text: "上次在火里，我听了话，退了。这次，我的膝盖先着地。", hl: ["膝盖先着地"] }
    ],
    next: "check_response",
    onEnter: {}
  },

  // ==================== 分支B · film_first ====================

  film_first: {
    id: "film_first",
    chapter: "第一章",
    title: "先固定现场证据",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第一阶段"],
    assets: {
      images: [
        { url: "assets/images/film_first/main", cssClass: "bg-phone",   startTime: 0, endTime: 0 },
        { url: "assets/images/film_first/detail", cssClass: "bg-kneel",   startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/film_first/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/film_first/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/film_first__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/film_first__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远掏出手机，快速打开录像，压低镜头对准雨棚入口和外侧街道的交界处——不拍人脸，只拍环境位置和围观范围。", hl: ["压低镜头", "不拍人脸", "只拍环境"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "旁观者", text: "拍下来也好，至少把时间线留住，省得一会儿谁都说不清。", hl: ["时间线留住"] },
      { mode: "narration", text: "我不是在拍什么证据。我是怕……怕自己又变成三年前那个站在门外看的人。留个客观记录，我就退不回去了。", hl: ["客观记录", "退不回去"] }
    ],
    next: "check_response"
  },

  // ==================== 汇合 · check_response ====================

  check_response: {
    id: "check_response",
    chapter: "第一章",
    title: "死神的叹息",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第二阶段"],
    assets: {
      images: [
        { url: "assets/images/check_response/main", cssClass: "bg-check",   startTime: 0, endTime: 0 },
        { url: "assets/images/check_response/detail", cssClass: "bg-breath",  startTime: 4, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/check_response/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/check_response/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/check_response__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/check_response__sfx_1", type: "sfx",     startTime: 4, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "圆心在雨棚内侧，远离车流和深水；他跪到老人肩侧，轻拍双肩：\"大爷，能听到我吗？\"", hl: ["雨棚内侧", "车流", "深水", "轻拍双肩"], important: true },
      { text: "没有反应。王远没有去摸脉搏，只盯住胸廓和鼻口。", hl: ["没有反应", "没有去摸脉搏", "胸廓"], important: true },
      { text: "十秒还没到，胸口没有规律起伏。", hl: ["十秒", "没有规律起伏"], important: true },
      { text: "老人的下颌突然古怪地开合了一下，", hl: ["古怪地开合"] },
      { text: "发出一声像叹气一样的抽动——随后一片死寂。", hl: ["叹气一样的抽动", "死寂"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "濒死叹息……应该按压。", hl: ["濒死叹息"], note: "声音小到连她自己都不太敢听见，瞬间被暴雨吞没。" }
    ],
    choices: [
      { key: "A", label: "当成骤停",   desc: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理。", risk: "承担误判压力",     next: "start_cpr",   effects: { _pathLabel: "choice_2:A" } },
      { key: "B", label: "再等一口气", desc: "也许那一下抽动是呼吸。",                           risk: "延误约22秒",       next: "wait_breath", effects: { false_wait_penalty: 22, _pathLabel: "choice_2:B" } }
    ]
  },

  // ==================== 分支A · start_cpr ====================

  start_cpr: {
    id: "start_cpr",
    chapter: "第一章",
    title: "果断行动",
    stage: "cpr_closeup",
    mode: "narration",
    rain: true,
    speaker: "王远",
    reviewTags: ["第二阶段"],
    assets: {
      images: [
        { url: "assets/images/start_cpr/main", cssClass: "bg-cpr-find",  startTime: 0, endTime: 0 },
        { url: "assets/images/start_cpr/detail", cssClass: "bg-cpr-hands", startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/start_cpr/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/start_cpr/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/start_cpr__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/start_cpr__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理。", hl: ["没有正常呼吸", "濒死叹息", "心脏骤停"], important: true }
    ],
    nextLines: [
      { mode: "narration", text: "王远眼神一狠——不再犹豫，不再等。他朝老人迈出一步，双膝即将着地。", hl: ["不再犹豫", "即将着地"] },
      { mode: "narration", text: "林小雨在人群里惊呼一声——\"对！应该按压！他看出来了！\"但她依然没有勇气拨开人群。", hl: ["没有勇气拨开人群"] }
    ],
    next: "kneel_down"
  },

  // ==================== 分支B · wait_breath ====================

  wait_breath: {
    id: "wait_breath",
    chapter: "第一章",
    title: "错失的22秒",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第二阶段"],
    assets: {
      images: [
        { url: "assets/images/wait_breath/main", cssClass: "bg-wait",    startTime: 0, endTime: 0 },
        { url: "assets/images/wait_breath/detail", cssClass: "bg-lips",    startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/wait_breath/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/wait_breath/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/wait_breath__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/wait_breath__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.5 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远犹豫了。万一人家只是顺了口气呢？", hl: ["犹豫"] },
      { text: "自己一掌拍下去把人按坏了怎么办？", hl: ["把人按坏了"] },
      { text: "他死死盯着老人，又等了二十多秒。", hl: ["又等了二十多秒"] },
      { text: "然而老人的抽动彻底消失，嘴唇的乌紫色像墨汁一样晕开。", hl: ["乌紫色", "墨汁一样晕开"] },
      { text: "22秒。对一颗停跳的心，它不是一小段时间，是血氧从大脑退潮的声音。", hl: ["22秒", "血氧从大脑退潮"] }
    ],
    nextLines: [
      { mode: "narration", text: "林小雨急得直跺脚，眼泪差点流出来。她知道宝贵的\"黄金四分钟\"正在被无情蚕食，但她那双脚就像灌了铅。", hl: ["黄金四分钟"] }
    ],
    next: "kneel_down"
  },

  // ==================== 汇合 · kneel_down ====================

  kneel_down: {
    id: "kneel_down",
    chapter: "第一章",
    title: "跪下",
    stage: "cpr_closeup",
    mode: "narration",
    rain: true,
    reviewTags: ["第三阶段"],
    assets: {
      images: [
        { url: "assets/images/kneel_down/main", cssClass: "bg-kneel",    startTime: 0, endTime: 0 },
        { url: "assets/images/kneel_down/detail", cssClass: "bg-kneel-hands", startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/kneel_down/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/kneel_down/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/kneel_down__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/kneel_down__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远双膝一沉，跪在老人身侧的湿滑地砖上。", hl: ["双膝一沉", "跪在"] },
      { text: "裤腿被地面潮气浸透，但他顾不上冷——双手拉开外套拉链，隔着湿冷的毛衣摸索胸骨的位置。", hl: ["摸索胸骨"] },
      { text: "雨水从屋檐斜打在背上，他的手掌悬停在老人胸口上方。", hl: ["手掌悬停"] },
      { text: "三年前那扇推不开的门，和眼前这具需要按压的胸口，在这一刻重叠了。", hl: ["重叠"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "对……应该按压！", hl: ["应该按压"], note: "声音终于有了些力气，但她的脚还没迈出去。" }
    ],
    next: "cpr_first_push"
  },

  // ==================== 核心 · cpr_first_push ====================

  cpr_first_push: {
    id: "cpr_first_push",
    chapter: "第一章",
    title: "第一下",
    stage: "cpr_closeup",
    mode: "narration",
    rain: true,
    cprFlash: true,
    reviewTags: ["第三阶段"],
    assets: {
      images: [
        { url: "assets/images/cpr_first_push/main", cssClass: "bg-push",     startTime: 0, endTime: 0 },
        { url: "assets/images/cpr_first_push/detail", cssClass: "bg-push-close", startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/cpr_first_push/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/cpr_first_push/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/cpr_first_push__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_first_push__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "掌根找准胸部中央、胸骨下半部的位置，全身力量轰然下压。", hl: ["胸部中央", "胸骨下半部", "轰然下压"], important: true },
      { text: "成人按压深度约5-6厘米；压下去，也要让胸廓完全回弹。", hl: ["5-6厘米", "完全回弹"], important: true },
      { text: "掌下的手感不是医院的模拟橡胶人——而是夹杂着骨骼抵抗的、沉重而脆弱的肉体。", hl: ["不是模拟橡胶人", "沉重而脆弱"] },
      { text: "那篇文章他只看了十七秒，可这十七秒，此刻像一根绳子，拽着他的手不要停。", hl: ["只看了十七秒", "不要停"] }
    ],
    next: "scam_whisper"
  },

  // ==================== 汇合 · scam_whisper ====================

  scam_whisper: {
    id: "scam_whisper",
    chapter: "第一章",
    title: "冰冷的窃窃私语",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第三阶段"],
    assets: {
      images: [
        { url: "assets/images/scam_whisper/main", cssClass: "bg-whisper",  startTime: 0, endTime: 0 },
        { url: "assets/images/scam_whisper/detail", cssClass: "bg-crowd",    startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/scam_whisper/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/scam_whisper/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/scam_whisper__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/scam_whisper__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "第一下按压已经下去了。雨越下越大。", hl: ["第一下按压已经下去"] },
      { text: "周围的窃窃私语像潮水一样涌来：", hl: ["窃窃私语"] },
      { text: "\"这小哥要干嘛？\"", hl: ["要干嘛"] },
      { text: "\"别碰啊，万一死你手里，倾家荡产！\"", hl: ["倾家荡产"] },
      { text: "这些话像针一样扎在王远背上。", hl: ["像针一样扎"] }
    ],
    choices: [
      { key: "A", label: "点名那几个人",     desc: "将围观者拉入分工，建立信任同盟。",   risk: null,             next: "name_witness", effects: { resource_activation: "witness", witness_credibility: 2, _pathLabel: "choice_3:A" } },
      { key: "B", label: "让手机记录一切",   desc: "留下时间线证据，但可能滑向传播围观。", risk: "舆论扩散+2",     next: "crowd_film",   effects: { resource_activation: "record",  public_spread: 2,        _pathLabel: "choice_3:B" } }
    ]
  },

  // ==================== 分支A · name_witness ====================

  name_witness: {
    id: "name_witness",
    chapter: "第一章",
    title: "打破冷漠的箭",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    interaction: "assign",
    reviewTags: ["第三阶段", "点名分工"],
    assets: {
      images: [
        { url: "assets/images/name_witness/main", cssClass: "bg-point",    startTime: 0, endTime: 0 },
        { url: "assets/images/name_witness/detail", cssClass: "bg-alliance", startTime: 5, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/name_witness/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/name_witness/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/name_witness__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/name_witness__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "灰西装先生！就是你，请你帮个忙，立刻打120，开免提！", hl: ["灰西装先生", "打120", "开免提"] }
    ],
    nextLines: [
      { mode: "narration", text: "他又转向人群——保安师傅、白衬衫姑娘……三个陌生人，三双躲闪的眼睛。点名是打破冷漠的第一箭。", hl: ["点名", "打破冷漠的第一箭"] }
    ],
    next: "cpr_rhythm",
    onEnter: { assignMode: true, effects: { aed_arrival_timing: "early", witness_credibility: 2 } }
  },

  // ==================== 分支B · crowd_film ====================

  crowd_film: {
    id: "crowd_film",
    chapter: "第一章",
    title: "碎掉的星星",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    reviewTags: ["第三阶段", "路人录像"],
    assets: {
      images: [
        { url: "assets/images/crowd_film/main", cssClass: "bg-phones",   startTime: 0, endTime: 0 },
        { url: "assets/images/crowd_film/detail", cssClass: "bg-stars",    startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/crowd_film/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/crowd_film/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/crowd_film__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/crowd_film__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "有没有人帮我留个全景！把倒地经过、谁在现场都拍清楚——不要拍患者的脸！", hl: ["留个全景", "不要拍患者的脸"] }
    ],
    nextLines: [
      { mode: "narration", text: "林小雨终于不再僵着——她一边掏出手机拨120，一边回头对人群喊：\"有没有人去过站厅？AED柜在安检口左边！\"马志国像是被电了一下，猛转身冲进站内。", hl: ["拨120", "AED柜", "安检口左边"] },
      { mode: "narration", text: "\"这外卖小哥演的吧？\"\"真的假的，临江暴雨大秀吗？\"\"万一被讹上就搞笑了，支持小哥留证。\"", hl: ["演的吧", "大秀", "留证"] },
      { mode: "narration", text: "留证本是为了固定时间线，但一旦有人推向公开传播，现场就从\"互相证明\"滑向\"集体围观\"。", hl: ["互相证明", "集体围观"] }
    ],
    next: "cpr_rhythm",
    onEnter: { effects: { aed_arrival_timing: "mid", witness_credibility: 0, public_spread: 3 } }
  },

  // ==================== 核心 · cpr_rhythm ====================

  cpr_rhythm: {
    id: "cpr_rhythm",
    chapter: "第一章",
    title: "节奏的牢笼",
    stage: "cpr_closeup",
    mode: "narration",
    rain: true,
    cprFlash: true,
    interaction: "cpr",
    reviewTags: ["第四阶段", "CPR"],
    assets: {
      images: [
        { url: "assets/images/cpr_rhythm/main", cssClass: "bg-rhythm-1",  startTime: 0, endTime: 0 },
        { url: "assets/images/cpr_rhythm/detail", cssClass: "bg-rhythm-2",  startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/cpr_rhythm/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/cpr_rhythm/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/cpr_rhythm__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_rhythm__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "01帧：咬紧牙关、汗水与雨水混合的脸。", hl: ["咬紧牙关"] },
      { text: "02帧：手背上暴起的青筋。", hl: ["暴起的青筋"] },
      { text: "03帧：老人随着按压无意识张开的嘴。", hl: ["无意识张开"] },
      { text: "04帧：围观者的鞋子，有人在悄悄后退。", hl: ["悄悄后退"] },
      { text: "05帧：高架桥下那条空荡荡的马路，120还没来。", hl: ["空荡荡", "120还没来"] }
    ],
    next: "cpr_fatigue",
    onEnter: { cprMode: true }
  },

  // ==================== 核心 · cpr_fatigue ====================

  cpr_fatigue: {
    id: "cpr_fatigue",
    chapter: "第一章",
    title: "崩溃边缘",
    stage: "cpr_closeup",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    vignette: true,
    reviewTags: ["第四阶段"],
    assets: {
      images: [
        { url: "assets/images/cpr_fatigue/main", cssClass: "bg-fatigue",   startTime: 0, endTime: 0 },
        { url: "assets/images/cpr_fatigue/detail", cssClass: "bg-exhaust",   startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/cpr_fatigue/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/cpr_fatigue/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/cpr_fatigue__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_fatigue__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "我快撑不住了……", hl: ["撑不住了"] },
      { text: "不是因为什么高尚的英雄主义，", hl: ["不是英雄主义"] },
      { text: "是因为我不知道，如果我现在松手停下了，这个圈子里，还有谁愿意蹲下来接替我？", hl: ["松手停下", "还有谁愿意蹲下来"] }
    ],
    choices: [
      { key: "A", label: "把手交出去", desc: "交托信任，按压质量更稳。",         risk: "需完成交接操作",       next: "let_others", effects: { _pathLabel: "choice_4:A" } },
      { key: "B", label: "咬牙硬撑",   desc: "维持掌控感，但更容易疲劳失准。",   risk: "按压质量持续下降",     next: "keep_going", effects: { compression_quality: -10, wangyuan_burden: 1, _pathLabel: "choice_4:B" } }
    ]
  },

  // ==================== 分支A · let_others ====================

  let_others: {
    id: "let_others",
    chapter: "第一章",
    title: "把手交出去",
    stage: "cpr_closeup",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    interaction: "takeover",
    reviewTags: ["第四阶段", "换人"],
    assets: {
      images: [
        { url: "assets/images/let_others/main", cssClass: "bg-handoff",   startTime: 0, endTime: 0 },
        { url: "assets/images/let_others/detail", cssClass: "bg-together",  startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/let_others/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/let_others/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/let_others__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/let_others__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "兄弟！来帮一把！我数到三，我一撤，你立刻压下去，别停！", hl: ["帮一把", "数到三", "别停"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "王远", text: "肩膀压上来，手臂打直，垂直往下压！别停，跟着我的数！", hl: ["手臂打直", "垂直往下压"] },
      { mode: "dialogue", speaker: "林小雨", text: "别抢，跟他的数。手臂别弯。", hl: ["别抢", "手臂别弯"], note: "终于往前半步，盯着年轻路人的肩膀" },
      { mode: "narration", text: "伸手不只是自己蹲下去。有时候，是把别人拉过来，教他们怎么一起蹲下去。", hl: ["把别人拉过来", "一起蹲下去"] }
    ],
    next: "family_accuse_handoff",
    onEnter: { takeoverMode: true }
  },

  // ==================== 分支B · keep_going ====================

  keep_going: {
    id: "keep_going",
    chapter: "第一章",
    title: "孤独的硬撑",
    stage: "cpr_closeup",
    mode: "narration",
    rain: true,
    vignette: true,
    reviewTags: ["第四阶段", "硬撑"],
    assets: {
      images: [
        { url: "assets/images/keep_going/main", cssClass: "bg-alone",     startTime: 0, endTime: 0 },
        { url: "assets/images/keep_going/detail", cssClass: "bg-bend-arm",  startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/keep_going/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/keep_going/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/keep_going__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/keep_going__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远摇了摇头，拒绝了旁人的询问。", hl: ["拒绝"] },
      { text: "他咬碎了牙，将全身的重量死死砸在老人的胸口上。", hl: ["咬碎了牙"] },
      { text: "由于体力透支，双臂开始弯曲，按压频率慢了下来，深度也无法维持。", hl: ["体力透支", "双臂弯曲"] }
    ],
    nextLines: [
      { mode: "narration", text: "林小雨看出他的按压在变慢，手臂开始弯。她没有喊停，只把计时的声音放大了：\"二十秒……三十秒……四十秒……\"像是在替他数，也像是在替自己数。", hl: ["替他数", "替自己数"] },
      { mode: "narration", text: "勇气有时候也是一种陷阱。盲目的坚守不一定是负责，也可能是一种无法放手信任他人的傲慢。", hl: ["无法放手信任"] }
    ],
    next: "family_accuse",
    onEnter: { effects: { compression_quality: -15, wangyuan_burden: 2 } }
  },

  // ==================== 汇合 · family_accuse ====================

  family_accuse: {
    id: "family_accuse",
    chapter: "第一章",
    title: "恐惧扭曲的面孔",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "赵雪梅",
    shake: true,
    reviewTags: ["第五阶段", "家属冲突"],
    assets: {
      images: [
        { url: "assets/images/family_accuse/main", cssClass: "bg-rush-in",   startTime: 0, endTime: 0 },
        { url: "assets/images/family_accuse/detail", cssClass: "bg-red-rope",  startTime: 4, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/family_accuse/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/family_accuse/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/family_accuse__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/family_accuse__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "让开！让开！那是我爸——", hl: ["那是我爸"] },
      { text: "你在干什么？！你是谁？！", hl: ["你是谁"] }
    ],
    nextLines: [
      { mode: "narration", text: "赵雪梅冲进来时先看到了雨棚外歪倒的电动车", hl: ["电动车"] },
      { mode: "narration", text: "黄色外卖箱翻在积水里", hl: ["外卖箱"] },
      { mode: "dialogue", speaker: "围观女人", text: "你是不是家属？有个送外卖的在你爸身边蹲着，不知道是不是撞倒的", style: "character" },
      { mode: "narration", text: "赵雪梅的脸瞬间白了", hl: ["脸瞬间白了"] },
      { text: "你把我爸怎么了？！是不是你撞的他？！", mode: "dialogue", speaker: "赵雪梅", hl: ["是不是你撞的"] },
      { mode: "narration", text: "王远余光扫到老人左手腕上的红绳", hl: ["红绳"] },
      { mode: "narration", text: "赵雪梅腕上也有一根一模一样的", hl: ["一模一样"] },
      { mode: "narration", text: "他突然明白，拉扯他的不是恶意", hl: ["不是恶意"] },
      { mode: "narration", text: "是一个女儿快要失去父亲时的恐惧", hl: ["失去父亲时的恐惧"] }
    ],
    choices: [
      { key: "A", label: "不停手",     desc: "保住按压连续性，依靠已建立的信任网络。",   risk: null,                     next: "kept_working", effects: { compression_interrupt_time: 0,  family_trust: 1,  _pathLabel: "choice_5:A" } },
      { key: "B", label: "停下解释",   desc: "争取澄清误会，但会造成致命中断。",         risk: "按压中断+24秒，心理负担+3", next: "stop_explain",  effects: { compression_interrupt_time: 24, wangyuan_burden: 3, family_trust: -1, _pathLabel: "choice_5:B" } }
    ]
  },

  // ==================== 家属冲突 · 已交接版本 ====================

  family_accuse_handoff: {
    id: "family_accuse_handoff",
    chapter: "第一章",
    title: "恐惧扭曲的面孔",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "赵雪梅",
    shake: true,
    reviewTags: ["第五阶段", "家属冲突", "已交接"],
    assets: {
      images: [
        { url: "assets/images/family_accuse_handoff/main", cssClass: "bg-rush-in",   startTime: 0, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/detail", cssClass: "bg-red-rope",  startTime: 4, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/family_accuse_handoff/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/family_accuse_handoff/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/family_accuse_handoff__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/family_accuse_handoff__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "让开！让开！那是我爸——", hl: ["那是我爸"] },
      { text: "你们在干什么？！你们是谁？！", hl: ["你们是谁"] }
    ],
    nextLines: [
      { mode: "narration", text: "赵雪梅冲进来时先看到了雨棚外歪倒的电动车", hl: ["电动车"] },
      { mode: "dialogue", speaker: "围观女人", text: "你是不是家属？有个送外卖的在你爸身边蹲着", style: "character" },
      { mode: "narration", text: "赵雪梅的脸瞬间白了，她拨开人群", hl: ["拨开人群"] },
      { mode: "narration", text: "一个年轻人正拼命按压父亲的胸口，节奏急促但稳定", hl: ["节奏急促"] },
      { mode: "narration", text: "旁边站着一个穿外卖雨衣的男人——王远——正弯腰盯着年轻人的手", hl: ["盯着年轻人的手"] },
      { mode: "narration", text: "老人家左手腕的红绳和赵雪梅腕上的那根一模一样", hl: ["红绳"] },
      { text: "你把我爸怎么了？！是不是你撞的他？！", mode: "dialogue", speaker: "赵雪梅", hl: ["是不是你撞的"] },
      { mode: "narration", text: "年轻路人的手没有停，但肩膀被叫骂声震得开始发抖", hl: ["肩膀发抖"] },
      { mode: "narration", text: "王远没有退开，站到路人背后压低声音稳住节奏", hl: ["稳住节奏"] }
    ],
    choices: [
      { key: "A", label: "让路人继续按", desc: "不让按压中断，你去拦住家属解释。",       risk: null,                     next: "kept_working", effects: { compression_interrupt_time: 0,  family_trust: 1,  _pathLabel: "choice_5:A" } },
      { key: "B", label: "叫路人也停手", desc: "先停手澄清误会，但按压中断是最坏的后果。", risk: "按压中断+24秒，心理负担+3", next: "stop_explain",  effects: { compression_interrupt_time: 24, wangyuan_burden: 3, family_trust: -1, _pathLabel: "choice_5:B" } }
    ]
  },

  // ==================== 分支A · kept_working ====================

  kept_working: {
    id: "kept_working",
    chapter: "第一章",
    title: "比亲人更想让他活下去",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    reviewTags: ["第五阶段", "继续按压"],
    assets: {
      images: [
        { url: "assets/images/kept_working/main", cssClass: "bg-keep-cpr",  startTime: 0, endTime: 0 },
        { url: "assets/images/kept_working/detail", cssClass: "bg-witnesses", startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/kept_working/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/kept_working/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/kept_working__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/kept_working__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "大姐！别碰！我们在救他的命！", hl: ["别碰", "救他的命"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "大姐！我是护理实习生，我学过急救！我从刚开始就一直看着，这位大哥是路过救人的！你爸现在像是心脏骤停，最怕的就是按压断掉！", hl: ["护理实习生", "心脏骤停", "按压断掉"] },
      { mode: "dialogue", speaker: "孙建国", text: "对！120全程在听着呢，是我报的警！", hl: ["120全程在听"] },
      { mode: "narration", text: "赵雪梅僵在原地，手缓缓松开。她看着这个浑身湿透的外卖员，和那个被他教会按压的年轻人——在这个冰冷的雨夜，这几个陌生人可能比她更想让她父亲活下去。", hl: ["这几个陌生人可能比她更想让她父亲活下去"] }
    ],
    next: "aed_protocol_start",
    onEnter: { effects: { wangyuan_burden: -1, family_trust: 2 } }
  },

  // ==================== 分支B · stop_explain ====================

  stop_explain: {
    id: "stop_explain",
    chapter: "第一章",
    title: "致命的24秒",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    reviewTags: ["第五阶段", "停止按压"],
    assets: {
      images: [
        { url: "assets/images/stop_explain/main", cssClass: "bg-stop",      startTime: 0, endTime: 0 },
        { url: "assets/images/stop_explain/detail", cssClass: "bg-still",     startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/stop_explain/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/stop_explain/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/stop_explain__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/stop_explain__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "大姐，你冷静点！我不是肇事的人，", hl: ["冷静点"] },
      { text: "我只是个送外卖的，路过看到他倒地才过来帮忙的……", hl: ["送外卖的", "过来帮忙"] }
    ],
    nextLines: [
      { mode: "narration", text: "赵雪梅死死盯着王远", hl: ["死死盯着"] },
      { mode: "narration", text: "他停下了——他为什么心虚", hl: ["为什么心虚"] },
      { mode: "narration", text: "赵雪梅哭得更加撕心裂肺", hl: ["撕心裂肺"] },
      { mode: "narration", text: "在这争吵、解释的24秒里，老人的胸口一片死寂", hl: ["24秒", "一片死寂"] },
      { mode: "narration", text: "没有一个人去按压，那是生命流逝的声音", hl: ["生命流逝"] },
      { mode: "narration", text: "王远猛然回过神来，重新跪下去", hl: ["重新跪下去"] },
      { mode: "narration", text: "\"继续按！别停！\"", hl: ["别停"] },
      { mode: "narration", text: "中断的24秒不会回来，但抢救不能就此停下", hl: ["不能就此停下"] },
      { mode: "narration", text: "就在这僵持的缝隙里，马志国抱着AED黄色箱子冲回雨棚下", hl: ["AED黄色箱子"] },
      { mode: "narration", text: "他看到对峙的两拨人和刚恢复的按压，把箱子放在台阶边", hl: ["放在台阶边"] },
      { mode: "dialogue", speaker: "马志国", text: "AED拿来了！这到底怎么回事？", hl: ["AED拿来了"] },
      { mode: "narration", text: "AED的出现像一盆冷水，浇停了争吵", hl: ["浇停了争吵"] }
    ],
    next: "aed_protocol_start",
    condition(state) {
      if (state.false_wait_penalty > 0 && state.compression_interrupt_time >= 24) return "bad_ending";
      return null;
    }
  },

  // ==================== 坏结局 · bad_ending ====================

  bad_ending: {
    id: "bad_ending",
    chapter: "第一章",
    title: "迟到的代价",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    vignette: true,
    reviewTags: ["结局", "坏结局"],
    assets: {
      images: [
        { url: "assets/images/bad_ending/main", cssClass: "bg-late",      startTime: 0, endTime: 0 },
        { url: "assets/images/bad_ending/detail", cssClass: "bg-shoe",      startTime: 4, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/bad_ending/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/bad_ending/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/bad_ending__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/bad_ending__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "救护车终于赶到时，老人已经错过了最佳抢救窗口。", hl: ["错过了最佳抢救窗口"], important: true },
      { text: "一开始的22秒犹豫。后来的24秒中断。", hl: ["22秒", "24秒"], important: true },
      { text: "加起来不到一分钟——但对一颗停跳的心，这不是时间，这是氧气从大脑退潮的声音。", hl: ["氧气从大脑退潮"] }
    ],
    nextLines: [
      { mode: "narration", text: "陈默医生什么都没说。他只是默默评估了瞳孔，然后合上了本子。王远站在雨棚边缘，电动车还歪倒在那里，外卖箱的盖子掀开着，雨水打在那条已经凉了半小时的订单上。", hl: ["合上了本子", "凉了半小时"] },
      { mode: "narration", text: "他没有被讹。赵雪梅瘫坐在台阶上，抱着那只掉了一只的黑布鞋。她甚至没有看王远一眼。也许她后来会知道，这个外卖员是来救人的。也许不会。但在这一刻，她的世界已经塌了。", hl: ["世界已经塌了"] }
    ],
    next: "aed_map"
  },

  // ==================== AED流程 ====================

  aed_protocol_start: {
    id: "aed_protocol_start",
    chapter: "第一章",
    title: "机器接手前的几秒",
    stage: "aed_protocol",
    mode: "narration",
    rain: true,
    interaction: "aed",
    reviewTags: ["第六阶段", "AED"],
    assets: {
      images: [
        { url: "assets/images/aed_protocol_start/main", cssClass: "bg-aed-box",   startTime: 0, endTime: 0 },
        { url: "assets/images/aed_protocol_start/detail", cssClass: "bg-aed-place", startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/aed_protocol_start/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/aed_protocol_start/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_protocol_start__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_protocol_start__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "AED到了。王远把它放到雨棚内侧相对干燥的台阶边。", hl: ["AED", "相对干燥"] }
    ],
    nextLines: [
      { mode: "narration", text: "孙建国继续举着免提，林小雨帮忙把周边人和杂物清开", hl: ["免提", "杂物清开"] },
      { mode: "narration", text: "AED会自动分析心律，人只负责开机、贴片、清场，并按语音提示执行。", hl: ["自动分析心律", "开机", "贴片", "清场"], important: true },
      { mode: "dialogue", speaker: "120调度员", text: "不要搬动他，保持平躺，就地按压。周围人散开。", hl: ["就地按压", "散开"], style: "dispatcher" }
    ],
    next: "aed_clear_space",
    onEnter: { aedMode: true, step: 1 }
  },

  aed_clear_space: {
    id: "aed_clear_space",
    chapter: "第一章",
    title: "擦干·贴片·清场",
    stage: "aed_protocol",
    mode: "narration",
    rain: true,
    interaction: "aed",
    reviewTags: ["第六阶段", "AED"],
    assets: {
      images: [
        { url: "assets/images/aed_clear_space/main", cssClass: "bg-aed-wipe",  startTime: 0, endTime: 0 },
        { url: "assets/images/aed_clear_space/detail", cssClass: "bg-aed-pads",  startTime: 2, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/aed_clear_space/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/aed_clear_space/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_clear_space__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_clear_space__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远按调度员和AED语音提示拉开胸前衣物，林小雨快速擦干贴片要接触的区域。", hl: ["擦干贴片区域"], important: true },
      { text: "右上胸，左下胸；大家只为贴片动作让出最短空档。", hl: ["右上胸", "左下胸", "最短空档"], important: true }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "AED", text: "分析心律中，请勿接触患者。", hl: ["请勿接触患者"], style: "aed-voice" }
    ],
    next: "aed_execute",
    onEnter: { aedMode: true, step: 3 }
  },

  aed_execute: {
    id: "aed_execute",
    chapter: "第一章",
    title: "按提示执行",
    stage: "aed_protocol",
    mode: "narration",
    rain: true,
    interaction: "aed",
    reviewTags: ["第六阶段", "AED"],
    assets: {
      images: [
        { url: "assets/images/aed_execute/main", cssClass: "bg-aed-analyze", startTime: 0, endTime: 0 },
        { url: "assets/images/aed_execute/detail", cssClass: "bg-aed-shock",   startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/aed_execute/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/aed_execute/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_execute__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_execute__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "所有人后退。AED分析完成。", hl: ["所有人后退", "分析完成"], important: true }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "AED", text: "建议电击。请确保无人接触患者。", hl: ["建议电击", "无人接触"], style: "aed-voice" },
      { mode: "narration", text: "电击后立刻继续按压；如果不建议电击，也继续按压，等下一次分析或专业人员接手。", hl: ["电击后立刻继续按压", "不建议电击", "继续按压"], important: true },
      { mode: "narration", text: "这一段不是\"机器来替代人\"，而是现场第一次把零散的善意收束成准确的操作。", hl: ["零散的善意", "收束成准确的操作"] }
    ],
    next: "ambulance",
    onEnter: { aedMode: true, step: 5 }
  },

  // ==================== 救护车 ====================

  ambulance: {
    id: "ambulance",
    chapter: "第一章",
    title: "救护车到来",
    stage: "rain_road",
    mode: "narration",
    rain: true,
    reviewTags: ["第六阶段", "尾声"],
    assets: {
      images: [
        { url: "assets/images/ambulance/main", cssClass: "bg-ambulance", startTime: 0, endTime: 0 },
        { url: "assets/images/ambulance/detail", cssClass: "bg-stand",     startTime: 4, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/ambulance/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/ambulance/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/ambulance__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/ambulance__sfx_1", type: "sfx",     startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "120救护车刺耳的警笛声终于撕开雨幕。", hl: ["撕开雨幕"] },
      { text: "陈默医生带着护士抬着担架冲进雨棚，迅速接管了现场。", hl: ["接管现场"] },
      { text: "陈默医生先接收时间线，评估AED状态，接续按压；若判断需要除颤，立即执行。", hl: ["评估AED状态", "接续按压"] },
      { text: "王远一个人站在雨棚边缘，外卖雨衣上的水顺着衣摆往下淌。", hl: ["一个人站在雨棚边缘"] },
      { text: "他扶起倒在地上的电动车，看了看手机——外卖订单已经彻底超时，系统亮起了红色的扣款提示。", hl: ["彻底超时", "扣款提示"] }
    ],
    next: "aed_map"
  },

  // ==================== AED地图 ====================

  aed_map: {
    id: "aed_map",
    chapter: "第一章",
    title: "城市AED地图",
    stage: "aed_map",
    mode: "narration",
    aedMap: true,
    reviewTags: ["第六阶段", "结算"],
    assets: {
      images: [
        { url: "assets/images/aed_map/main", cssClass: "bg-map-city",  startTime: 0, endTime: 0 },
        { url: "assets/images/aed_map/detail", cssClass: "bg-map-dot",   startTime: 3, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/aed_map/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/aed_map/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/bgm/aed_map__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.4 },
        { url: "assets/audio/sfx/aed_map__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.5 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "画面从冰冷的雨夜街景渐渐抽离，", hl: ["渐渐抽离"] },
      { text: "变成一幅极简风格的、散发着科技感蓝光的\"临江市城市AED地图\"。", hl: ["城市AED地图"] },
      { text: "一个光点亮了。", hl: ["光点"] },
      { text: "但在这座城市的地图上，还有整整十七个灰色空白区。", hl: ["十七个"] },
      { text: "在那些地方，最近的AED需要跑8分钟以上。", hl: ["8分钟"] }
    ],
    next: "chapter_review"
  },

  // ==================== 章节复盘 ====================

  chapter_review: {
    id: "chapter_review",
    chapter: "第一章",
    title: "章节复盘",
    stage: "aed_map",
    mode: "review",
    aedMap: true,
    reviewTags: ["复盘"],
    assets: {
      images: [
        { url: "assets/images/chapter_review/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/images/chapter_review/detail", cssClass: "", startTime: 0, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/chapter_review/main", cssClass: "", startTime: 0, endTime: 0 },
        { url: "assets/videos/chapter_review/alt", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/bgm/chapter_review__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.4 },
        { url: "assets/audio/sfx/chapter_review__sfx_1", type: "sfx",    startTime: 0, endTime: 0, volume: 1.0 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [],
    next: null
  }

};
