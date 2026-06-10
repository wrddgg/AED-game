/* ============================================================
   scenes.js — 《生命守护者》数据驱动场景系统
   剧情顺序严格按 场景故事线.md + 第一章互动系统表.md
   所有跳转由 next / choices / condition 驱动
   ============================================================ */

/* ========== 资源表（素材替换只需改这里） ========== */
const ASSETS = {
  prologue_factory:    { image: "assets/images/prologue_factory.jpg",    fallback: "factory_fire" },
  prologue_hands:      { image: "assets/images/prologue_hands.jpg",      fallback: "rain_road" },
  prologue_phone:      { image: "assets/images/prologue_phone.jpg",      fallback: "rain_road" },
  prologue_rain:       { image: "assets/images/prologue_rain.jpg",       fallback: "subway_canopy" },
  choice_1:            { image: "assets/images/choice_1.jpg",            fallback: "rain_road" },
  enter_circle:        { image: "assets/images/enter_circle.jpg",        fallback: "subway_canopy" },
  film_first:          { image: "assets/images/film_first.jpg",          fallback: "subway_canopy" },
  check_response:      { image: "assets/images/check_response.jpg",      fallback: "subway_canopy" },
  start_cpr:           { image: "assets/images/start_cpr.jpg",           fallback: "cpr_closeup" },
  wait_breath:         { image: "assets/images/wait_breath.jpg",         fallback: "subway_canopy" },
  scam_whisper:        { image: "assets/images/scam_whisper.jpg",        fallback: "subway_canopy" },
  name_witness:        { image: "assets/images/name_witness.jpg",        fallback: "subway_canopy" },
  crowd_film:          { image: "assets/images/crowd_film.jpg",          fallback: "subway_canopy" },
  cpr_first_push:      { image: "assets/images/cpr_first_push.jpg",      fallback: "cpr_closeup" },
  cpr_rhythm:          { image: "assets/images/cpr_rhythm.jpg",          fallback: "cpr_closeup" },
  cpr_fatigue:         { image: "assets/images/cpr_fatigue.jpg",         fallback: "cpr_closeup" },
  let_others:          { image: "assets/images/let_others.jpg",          fallback: "cpr_closeup" },
  keep_going:          { image: "assets/images/keep_going.jpg",          fallback: "cpr_closeup" },
  family_accuse:       { image: "assets/images/family_accuse.jpg",       fallback: "subway_canopy" },
  kept_working:        { image: "assets/images/kept_working.jpg",        fallback: "subway_canopy" },
  stop_explain:        { image: "assets/images/stop_explain.jpg",        fallback: "subway_canopy" },
  aed_arrival:         { image: "assets/images/aed_arrival.jpg",         fallback: "aed_protocol" },
  aed_protocol_start:  { image: "assets/images/aed_protocol_start.jpg",  fallback: "aed_protocol" },
  aed_clear_space:     { image: "assets/images/aed_clear_space.jpg",     fallback: "aed_protocol" },
  aed_execute:         { image: "assets/images/aed_execute.jpg",         fallback: "aed_protocol" },
  ambulance:           { image: "assets/images/ambulance.jpg",           fallback: "rain_road" },
  aed_map:             { image: "assets/images/aed_map.jpg",             fallback: "aed_map" },
  chapter_review:      { image: null,                                    fallback: "aed_map" }
};

/* ========== 场景数据 ========== */
const SCENES = {

  // ==================== 序幕 ====================

  prologue_factory: {
    id: "prologue_factory",
    chapter: "序幕",
    title: "抹不掉的浓烟",
    stage: "factory_fire",
    mode: "narration",
    audio: { ambience: "silence" },
    reviewTags: ["序幕"],
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
    audio: { ambience: "rain_heavy" },
    reviewTags: ["序幕"],
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
    audio: { ambience: "rain_heavy" },
    reviewTags: ["序幕"],
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
    audio: { ambience: "rain_heavy", sfx: ["crowd_murmur"] },
    reviewTags: ["序幕"],
    lines: [
      { text: "21:17，台风银杏登陆第三个小时。", hl: ["21:17", "台风银杏"] },
      { text: "临江市120接警量超过平时的3倍。", hl: ["120", "3倍"] },
      { text: "倒计时，开始。", hl: ["倒计时"] }
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
    audio: { ambience: "rain_heavy", sfx: ["brake"] },
    reviewTags: ["选择点1"],
    lines: [
      { text: "王远猛地捏死刹车，电动车在湿滑的地面上甩尾停下。", hl: ["猛地捏死刹车"] },
      { text: "他看着那个围成圆圈的人群，", hl: ["围成圆圈"] },
      { text: "三年前那场大火的浓烟仿佛又在眼前升起。", hl: ["又在眼前升起"] }
    ],
    choices: [
      {
        key: "A",
        label: "挤进圆心",
        desc: "更快接近患者，延误较少。",
        risk: null,
        next: "enter_circle",
        effects: { press_start_delay: 5, witness_credibility: 1, _pathLabel: "choice_1:A" }
      },
      {
        key: "B",
        label: "举起手机",
        desc: "留下证据，但会增加延误与传播风险。",
        risk: "延误+12秒，舆论扩散+2",
        next: "film_first",
        effects: { press_start_delay: 12, public_spread: 2, _pathLabel: "choice_1:B" }
      }
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
    title: "先打开手机录像",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第一阶段"],
    lines: [
      { text: "王远心里一惊，下意识地掏出手机，拉开录像功能，高举过头顶。他一边拍，一边往里挤。", hl: ["高举过头顶"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "旁观者", text: "拍下来也好，至少把时间线留住，省得一会儿谁都说不清。", hl: ["时间线留住"] },
      { mode: "narration", text: "我不是在拍什么证据。我是怕……怕自己又变成三年前那个站在门外看的人。有个镜头顶着，我就退不回去了。", hl: ["退不回去"] }
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
      {
        key: "A",
        label: "当成骤停",
        desc: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理。",
        risk: "承担误判压力",
        next: "start_cpr",
        effects: { _pathLabel: "choice_2:A" }
      },
      {
        key: "B",
        label: "再等一口气",
        desc: "也许那一下抽动是呼吸。",
        risk: "延误约22秒",
        next: "wait_breath",
        effects: { false_wait_penalty: 22, _pathLabel: "choice_2:B" }
      }
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
    lines: [
      { text: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理。", hl: ["没有正常呼吸", "濒死叹息", "心脏骤停"], important: true }
    ],
    nextLines: [
      { mode: "narration", text: "王远眼神一狠，拉开老人的外衣，隔着湿冷的毛衣快速找到胸部中央、胸骨下半部的位置。", hl: ["拉开外衣", "隔着湿冷毛衣", "胸骨下半部"] },
      { mode: "narration", text: "林小雨在人群里惊呼一声——\"对！应该按压！他看出来了！\"但她依然没有勇气拨开人群。", hl: ["没有勇气拨开人群"] }
    ],
    next: "cpr_first_push"
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
    audio: { ambience: "rain_heavy" },
    reviewTags: ["第三阶段"],
    lines: [
      { text: "掌根找准胸部中央、胸骨下半部的位置，全身力量轰然下压。", hl: ["胸部中央", "胸骨下半部", "轰然下压"], important: true },
      { text: "成人按压深度约5-6厘米；压下去，也要让胸廓完全回弹。", hl: ["5-6厘米", "完全回弹"], important: true },
      { text: "而是夹杂着骨骼抵抗的、沉重而脆弱的肉体。", hl: ["骨骼抵抗", "沉重而脆弱"] },
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
    lines: [
      { text: "第一下按压已经下去了。雨越下越大。", hl: ["第一下按压已经下去"] },
      { text: "周围的窃窃私语像潮水一样涌来：", hl: ["窃窃私语"] },
      { text: "\"这小哥要干嘛？\"", hl: ["要干嘛"] },
      { text: "\"别碰啊，万一死你手里，倾家荡产！\"", hl: ["倾家荡产"] },
      { text: "这些话像针一样扎在王远背上。", hl: ["像针一样扎"] }
    ],
    choices: [
      {
        key: "A",
        label: "点名那几个人",
        desc: "将围观者拉入分工，建立信任同盟。",
        risk: null,
        next: "name_witness",
        effects: { resource_activation: "witness", witness_credibility: 2, _pathLabel: "choice_3:A" }
      },
      {
        key: "B",
        label: "让手机记录一切",
        desc: "留下时间线证据，但可能滑向传播围观。",
        risk: "舆论扩散+2",
        next: "crowd_film",
        effects: { resource_activation: "record", public_spread: 2, _pathLabel: "choice_3:B" }
      }
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
    reviewTags: ["第三阶段", "点名分工"],
    interaction: "assign",
    lines: [
      { text: "灰西装先生！就是你，请你帮个忙，立刻打120，开免提！", hl: ["灰西装先生", "打120", "开免提"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "孙建国", text: "啊？我？", hl: ["啊？"], note: "手一抖，被当众点名，身体比脑子快，颤抖着掏出手机。" },
      { mode: "dialogue", speaker: "王远", text: "保安师傅！麻烦你马上去站里找AED，有就立刻拿过来！救命的！", hl: ["AED", "立刻拿过来"] },
      { mode: "narration", text: "马志国咬牙——\"好！我这就去！\"退伍军人的本能被唤醒，转身穿过雨棚边缘，直冲站内安检口。", hl: ["退伍军人", "直冲站内安检口"] },
      { mode: "dialogue", speaker: "王远", text: "白衬衫姑娘，请你帮我看着时间，也请你替我作证，我是路过救人！", hl: ["替我作证", "路过救人"] },
      { mode: "narration", text: "王远用一根无形的线，把围观的\"看客\"强行拉成了\"同盟\"。", hl: ["看客", "同盟"] }
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
    lines: [
      { text: "有没有人帮我留个全景！把倒地经过、谁在现场都拍清楚！", hl: ["留个全景", "拍清楚"] }
    ],
    nextLines: [
      { mode: "narration", text: "围观者中立刻举起了五六部手机。有人对准老人倒地位置，也有人顺手推成直播。闪光灯在黑夜里像碎掉的星星。", hl: ["碎掉的星星"] },
      { mode: "narration", text: "\"这外卖小哥演的吧？\"\"真的假的，临江暴雨大秀吗？\"\"万一被讹上就搞笑了，支持小哥留证。\"", hl: ["演的吧", "大秀", "留证"] },
      { mode: "narration", text: "留证本是为了固定时间线，但一旦有人推向公开传播，现场就从\"互相证明\"滑向\"集体围观\"。", hl: ["互相证明", "集体围观"] }
    ],
    next: "cpr_rhythm"
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
    lines: [
      { text: "我快撑不住了……", hl: ["撑不住了"] },
      { text: "不是因为什么高尚的英雄主义，", hl: ["不是英雄主义"] },
      { text: "是因为我不知道，如果我现在松手停下了，这个圈子里，还有谁愿意蹲下来接替我？", hl: ["松手停下", "还有谁愿意蹲下来"] }
    ],
    choices: [
      {
        key: "A",
        label: "把手交出去",
        desc: "交托信任，按压质量更稳。",
        risk: "需完成交接操作",
        next: "let_others",
        effects: { _pathLabel: "choice_4:A" }
      },
      {
        key: "B",
        label: "咬牙硬撑",
        desc: "维持掌控感，但更容易疲劳失准。",
        risk: "按压质量持续下降",
        next: "keep_going",
        effects: { compression_quality: -10, wangyuan_burden: 1, _pathLabel: "choice_4:B" }
      }
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
    lines: [
      { text: "兄弟！来帮一把！我数到三，我一撤，你立刻压下去，别停！", hl: ["帮一把", "数到三", "别停"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "王远", text: "肩膀压上来，手臂打直，垂直往下压！别停，跟着我的数！", hl: ["手臂打直", "垂直往下压"] },
      { mode: "dialogue", speaker: "林小雨", text: "别抢，跟他的数。手臂别弯。", hl: ["别抢", "手臂别弯"], note: "终于往前半步，盯着年轻路人的肩膀" },
      { mode: "narration", text: "伸手不只是自己蹲下去。有时候，是把别人拉过来，教他们怎么一起蹲下去。", hl: ["把别人拉过来", "一起蹲下去"] }
    ],
    next: "family_accuse",
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
    audio: { ambience: "rain_heavy", sfx: ["scream", "brake"] },
    lines: [
      { text: "你在干什么？！你是谁？！", hl: ["你是谁"] },
      { text: "你把我爸怎么了？！是不是你撞的他？！", hl: ["是不是你撞的"] }
    ],
    nextLines: [
      { mode: "narration", text: "王远余光扫到老人左手腕上的红绳——赵雪梅腕上也有一根一样的。他突然明白，拉扯他的不是恶意，是一个女儿快要失去父亲时的恐惧。", hl: ["红绳", "快要失去父亲时的恐惧"] }
    ],
    choices: [
      {
        key: "A",
        label: "不停手",
        desc: "保住按压连续性，依靠已建立的信任网络。",
        risk: null,
        next: "kept_working",
        effects: { compression_interrupt_time: 0, family_trust: 1, _pathLabel: "choice_5:A" }
      },
      {
        key: "B",
        label: "停下解释",
        desc: "争取澄清误会，但会造成致命中断。",
        risk: "按压中断+24秒，心理负担+3",
        next: "stop_explain",
        effects: { compression_interrupt_time: 24, wangyuan_burden: 3, family_trust: -1, _pathLabel: "choice_5:B" }
      }
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
    lines: [
      { text: "大姐！别碰我！我在救他的命！", hl: ["别碰我", "救他的命"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "大姐！我是护理实习生，我学过急救！我从刚开始就一直看着，这位大哥是路过救人的！你爸现在像是心脏骤停，最怕的就是按压断掉！", hl: ["护理实习生", "心脏骤停", "按压断掉"] },
      { mode: "dialogue", speaker: "孙建国", text: "对！120全程在听着呢，是我报的警！", hl: ["120全程在听"] },
      { mode: "narration", text: "赵雪梅僵在原地，手缓缓松开。她看着这个浑身湿透、拼命按压的陌生外卖员——在这个冰冷的雨夜，这个陌生人可能比她更想让她父亲活下去。", hl: ["这个陌生人可能比她更想让她父亲活下去"] }
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
    lines: [
      { text: "大姐，你冷静点！我不是肇事的人，", hl: ["冷静点"] },
      { text: "我只是个送外卖的，路过看到他倒地才过来帮忙的……", hl: ["送外卖的", "过来帮忙"] }
    ],
    nextLines: [
      { mode: "narration", text: "赵雪梅死死盯着王远。他停下了——他为什么心虚？赵雪梅哭得更加撕心裂肺。", hl: ["他停下了", "为什么心虚"] },
      { mode: "narration", text: "在他们争吵、解释的这24秒里，老人的胸口一片死寂，没有一个人去按压。那是生命流逝的声音。", hl: ["24秒", "一片死寂", "生命流逝的声音"] }
    ],
    next: "aed_protocol_start"
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
    audio: { ambience: "rain_heavy" },
    lines: [
      { text: "马志国抱着AED从站内冲回雨棚下。", hl: ["AED"] }
    ],
    nextLines: [
      { mode: "narration", text: "王远把AED放到雨棚内侧相对干燥的台阶边。孙建国继续举着免提，林小雨帮忙把周边人和杂物清开。", hl: ["相对干燥"] },
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
    audio: { ambience: "rain_heavy", sfx: ["ambulance_siren"] },
    reviewTags: ["第六阶段", "尾声"],
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
    rain: false,
    aedMap: true,
    reviewTags: ["第六阶段", "结算"],
    lines: [
      { text: "画面从冰冷的雨夜街景渐渐抽离，", hl: ["渐渐抽离"] },
      { text: "变成一幅极简风格的、散发着科技感蓝光的\"临江市城市AED地图\"。", hl: ["城市AED地图"] },
      { text: "一个光点亮了。", hl: ["光点亮了"] },
      { text: "但在这座城市的地图上，还有整整十七个灰色空白区。", hl: ["十七个灰色空白区"] },
      { text: "在那些地方，最近的AED需要跑8分钟以上。", hl: ["8分钟以上"] }
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
    rain: false,
    reviewTags: ["复盘"],
    aedMap: true,
    lines: [],
    next: null  // 复盘后进入第二章预告
  }

};
