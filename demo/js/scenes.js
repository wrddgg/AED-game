/* ============================================================
   scenes.js — 《生命守护者》数据驱动场景系统 v4
   基于 台词.md 全面重构，一句一图，动态场景配视频
   ============================================================ */

/* ========== 素材槽位模板 ==========
   每个节点：
     assets.images[]  — 图片槽，一句一匹配，img_01 / img_02 / ...
     assets.videos[]  — 视频槽（动态场景15秒）
     assets.sounds[]  — 声音槽
     speed            — CSS变量覆盖 { media, text, hold }
   ============================================================ */

function _imgs(nodeId, count, startInterval) {
  const interval = startInterval || 3.5;
  const result = [];
  for (let i = 1; i <= count; i++) {
    result.push({
      url: `assets/images/${nodeId}/img_${String(i).padStart(2,'0')}`,
      cssClass: "bg-main",
      startTime: (i - 1) * interval,
      endTime: 0
    });
  }
  return result;
}

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
    title: "抹不掉的沉默",
    stage: "bus_stop",
    mode: "narration",
    reviewTags: ["序幕"],
    assets: {
      images: _imgs("prologue_factory", 10),
      sounds: [
        { url: "assets/audio/bgm/prologue_factory__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.6 },
        { url: "assets/audio/sfx/prologue_factory__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "两年前，他在一个公交站台见过一个人倒下", hl: ["两年前", "公交站台", "见过一个人倒下"] },
      { text: "那个人的脸，他到现在还记得", hl: ["到现在还记得"] },
      { text: "人群围成圈，有人喊打120，有人掏出手机拍", hl: ["围成圈", "打120", "手机拍"] },
      { text: "他也往前挤了——但到了最里面一圈，", hl: ["挤了"] },
      { text: "他蹲不下去。他不会。", hl: ["蹲不下去", "不会"] },
      { text: "旁边有人说\"别乱动，等专业的来\"", hl: ["别乱动", "等专业的来"] },
      { text: "他听了，退回人群里", hl: ["退回去了", "人群里"] },
      { text: "后来救护车来了，把人抬走了", hl: ["救护车来了", "抬走了"] },
      { text: "他到现在都不知道那个人是死是活", hl: ["不知道", "是死是活"] },
      { text: "这件事他从没对任何人提起", hl: ["从没对任何人提起"] },
      { text: "但它变成了焊在心里的铁钉", hl: ["焊在心里的铁钉"] }
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
      images: _imgs("prologue_hands", 8),
      sounds: [
        { url: "assets/audio/bgm/prologue_hands__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.6 },
        { url: "assets/audio/ambient/prologue_hands__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.4 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "后来他换了很多工作，也换了城市", hl: ["换了很多工作", "换了城市"] },
      { text: "来临江三年，送外卖是第5份工作", hl: ["第5份工作"] },
      { text: "但他没换掉几个习惯——", hl: ["没换掉"] },
      { text: "每次路过医院，他都会多看一眼急诊科的灯", hl: ["急诊科的灯"] },
      { text: "手机里收藏着几条急救科普", hl: ["急救科普" ]},
      { text: "但每次点开都只看几十秒就划走",  },
      { text: "他不是什么英雄", hl: ["不是英雄"] },
      { text: "只是一个背着\"上次没蹲下去\"这段记忆、", hl: ["上次没蹲下去"] },
      { text: "这次不想再退后的人", hl: ["不想再退后"] }
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
      images: _imgs("prologue_phone", 3),
      sounds: [
        { url: "assets/audio/bgm/prologue_phone__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/prologue_phone__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 1.0 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "今天"},
      { text: "他只是一个想把最后一份外卖准时送到", hl: ["准时送到"] },
      { text: "不被扣钱的普通人", hl: ["普通人"] },
      { text: "但城市给每个人的剧本，有时候不止一份", hl: ["不止一份"] }
    ],
    next: "prologue_rain",
    playOpeningVideo: true
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
      images: _imgs("prologue_rain", 13),
      videos: [
        { url: "assets/videos/prologue_rain/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/prologue_rain__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/prologue_rain__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "21:17，台风银杏登陆第三个小时", hl: ["21:17", "台风银杏"] },
      { text: "临江市120接警量超过平时的3倍", hl: ["120", "3倍"] },
      { text: "倒计时，开始", hl: ["倒计时"] }
    ],
    nextLines: [
      { mode: "narration", text: "人群外侧"},
      { mode: "narration", text: "地铁保安马志国正张开手臂往后退外围", hl: ["张开手臂"] },
      { mode: "narration", text: "\"退一步，留出空间，别挤\"", hl: ["退一步"] },
      { mode: "narration", text: "他缺了一截的左手无名指在灯光下格外显眼", hl: ["缺了一截", "无名指"] },
      { mode: "narration", text: "退伍兵的习惯让他先把秩序管起来", hl: ["退伍兵"] },
      { mode: "narration", text: "人群前排"},
      { mode: "narration", text: "护理实习生林小雨已蹲下来透过人缝看老人的脸色", hl: ["护理实习生"] },
      { mode: "narration", text: "她的嘴唇动了动"},
      { mode: "narration", text: "但导师那句\"院外别乱动\"像一道锁扣，卡在喉咙口", hl: ["院外别乱动"] },
      { mode: "narration", text: "她拿出手机拨打了120", hl: ["拨打了120"] }
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
      images: _imgs("choice_1", 3),
      sounds: [
        { url: "assets/audio/ambient/choice_1__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/choice_1__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远猛地捏死刹车，电动车在湿滑的地面上甩尾停下", hl: ["猛地捏死刹车"] },
      { text: "他看着那个围成圆圈的人群", hl: ["围成圆圈"] },
      { text: "两年前，他也是这样站在一道人墙外面。", hl: ["两年前", "人墙外面"] },
      { text: "那次，他退回去了。", hl: ["退回去了"] }
    ],
    choices: [
      { key: "A", label: "拨开人群", desc: "更快接近患者，延误较少。", risk: null, next: "enter_circle", effects: { press_start_delay: 5, _pathLabel: "choice_1:A" } },
      { key: "B", label: "举起手机", desc: "留下证据，但会增加延误与传播风险。", risk: "延误+12秒，舆论扩散+2", next: "film_first", effects: { press_start_delay: 12, public_spread: 2, _pathLabel: "choice_1:B" } }
    ]
  },

  // ==================== 分支A · enter_circle ====================
  enter_circle: {
    id: "enter_circle",
    chapter: "第一章",
    title: "拨开人群",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    reviewTags: ["第一阶段"],
    assets: {
      images: _imgs("enter_circle", 5),
      sounds: [
        { url: "assets/audio/ambient/enter_circle__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/enter_circle__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "让让！别堵着！给他留出空间！", hl: ["留出空间"] }
    ],
    nextLines: [
      { mode: "narration",text: "王远顾不上锁车，甚至没摘头盔"},
      { mode: "narration", text: "一把推开外围打伞的围观者，冲进地铁口"},
      { mode: "narration", text: "老人的脸灰白，嘴唇已经开始发绀", hl: ["灰白", "发绀"] },
      { mode: "narration", text: "上次，他站在圈外，听着\"等专业的来\"，退了。", hl: ["蹲了下去"] },
      { mode: "narration",text: "这次，他毅然蹲了下去。"}
    ],
    next: "check_response"
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
      images: _imgs("film_first", 4),
      sounds: [
        { url: "assets/audio/ambient/film_first__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/film_first__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远掏出手机，打开录像，压低镜头，", hl: ["打开录像", "压低镜头"] },
      { text: "对准雨棚入口和外侧街道的交界处。" }
    ],
    nextLines: [
      { mode: "narration", text: "他避开人脸，只拍环境位置和围观范围。", hl: ["避开人脸", "只拍环境"] },
      { mode: "narration", text: "证据先留住。镜头还开着，", hl: ["攥在手里"] },
      { mode: "narration", text: "他把手机攥在手里，往人群里走。", hl: ["往人群里走"] }
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
      images: _imgs("check_response", 6),
      sounds: [
        { url: "assets/audio/ambient/check_response__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/check_response__sfx_1", type: "sfx", startTime: 4, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "老人倒在雨棚内侧，离车流和深水都有一段距离。", hl: ["雨棚内侧", "轻拍双肩"] },
      { text: "王远跪到他肩侧，轻拍双肩，大声喊"},
      { text: "\"大爷，能听到我吗？\""},
      { text: "没有反应。王远没有去摸脉搏"},
      { text: "只看胸廓有没有起伏，听口鼻有没有正常呼吸。", hl: ["没有反应", "没有去摸脉搏", "胸廓"], important: true },
      { text: "不到十秒，他已经判断出来：胸口没有规律起伏。", hl: ["不到十秒", "没有规律起伏"], important: true },
      { text: "老人的下颌忽然古怪地开合了一下"},
      { text: "喉咙里挤出一声像叹气一样的抽动——"},
      { text: "随后，一片死寂。", hl: ["一片死寂"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "这是濒死叹息……应该马上按压", hl: ["濒死叹息"], note: "声音小到连她自己都不太敢听见，瞬间被暴雨吞没。" }
    ],
    choices: [
      { key: "A", label: "当成骤停", desc: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理。", risk: "承担误判压力", next: "start_cpr", effects: { _pathLabel: "choice_2:A" } },
      { key: "B", label: "再等一口气", desc: "也许那一下抽动是呼吸。", risk: "延误约22秒", next: "wait_breath", effects: { false_wait_penalty: 22, _pathLabel: "choice_2:B" } }
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
    reviewTags: ["第二阶段"],
    assets: {
      images: _imgs("start_cpr", 4),
      sounds: [
        { url: "assets/audio/ambient/start_cpr__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/start_cpr__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "没有正常呼吸，或只有濒死叹息，就按心脏骤停处理", hl: ["没有正常呼吸", "心脏骤停"], important: true }
    ],
    nextLines: [
      { mode: "narration", text: "王远的眼神沉了一下——不再犹豫，不再等", hl: ["不再犹豫"] },
      { mode: "narration", text: "他朝老人胸侧挪近，手已经伸向胸骨的位置", hl: ["胸骨的位置"] },
      { mode:"narration",text:"林小雨在人群里惊呼一声——"},
      { mode: "narration", text: "\"对！应该按压！他看出来了！\""},
      { mode:"narration",text:"但她依然没有勇气拨开人群"}
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
      images: _imgs("wait_breath", 6),
      sounds: [
        { url: "assets/audio/ambient/wait_breath__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/wait_breath__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.5 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远犹豫了。万一人家只是缓过一口气呢？", hl: ["犹豫"] },
      { text: "万一自己这一按，反倒把人按坏了怎么办？", hl: ["把人按坏了"] },
      { text: "他死死盯着老人，又等了二十多秒。", hl: ["又等了二十多秒"] },
      { text: "可那一下抽动之后，老人再也没有动静，", hl: ["乌紫色", "一点点加深"] },
      { text: "嘴唇的乌紫色一点点加深。"},
      { text: "22秒。对一颗停跳的心来说，"},
      { text: "这不是一小段时间。是大脑正在一点点失去氧气。", important: true }
    ],
    nextLines: [
      { mode: "narration", text: "林小雨急得攥紧了手机，脚尖往前挪了一下，又缩回来。", hl: ["黄金四分钟"] },
      { mode: "narration", text: "她知道宝贵的\"黄金四分钟\"正在一秒一秒流走。", hl: ["迈不出去"] },
      { mode: "narration", text: "可她还是迈不出去。" }
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
      images: _imgs("kneel_down", 5),
      sounds: [
        { url: "assets/audio/ambient/kneel_down__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/kneel_down__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远双膝一沉，跪在老人身侧的湿滑地砖上", hl: ["双膝一沉"] },
      { text: "裤腿被地面潮气浸透，但他顾不上冷——", hl: ["摸索胸骨"] },
      { text: "双手拉开外套拉链，隔着湿冷的毛衣摸索胸骨的位置" },
      { text: "雨水从屋檐斜打在背上，他的手掌悬停在老人胸口上方", hl: ["手掌悬停"] },
      { text: "两年前那道迈不过去的人墙，", hl: ["重叠"] },
      { text: "和眼前这具需要按压的胸口，在这一刻重叠了" }
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
      images: _imgs("cpr_first_push", 4),
      videos: [
        { url: "assets/videos/cpr_first_push/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/cpr_first_push__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_first_push__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "掌根压在胸部中央、胸骨下半部的位置，", hl: ["胸部中央", "胸骨下半部"], important: true },
      { text: "借上半身的重量垂直向下。", important: true },
      { text: "成人按压深度约5至6厘米；", hl: ["5至6厘米", "完全回弹"], important: true },
      { text: "每一次压下去之后，都要让胸廓完全回弹。", important: true },
      { text: "掌下不是训练用的模拟人——", hl: ["不是模拟人", "真实的胸骨"] },
      { text: "是真实的胸骨、衣料下的体温，和一点让人心惊的抵抗感。" },
      { text: "他不知道自己做得够不够好，只知道现在不能停。", hl: ["不能停"] }
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
      images: _imgs("scam_whisper", 5),
      sounds: [
        { url: "assets/audio/ambient/scam_whisper__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/scam_whisper__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "第一下按压已经下去了。雨越下越大", hl: ["第一下按压已经下去"] },
      { text: "周围的窃窃私语像潮水一样涌来：", hl: ["窃窃私语"] },
      { text: "\"这小哥要干嘛？\"", hl: ["要干嘛"] },
      { text: "\"别碰啊，万一出事赖你身上怎么办？\"", hl: ["赖你身上"] },
      { text: "这些话像针一样扎在王远背上", hl: ["像针一样扎"] }
    ],
    choices: [
      { key: "A", label: "点名那几个人", desc: "将围观者拉入分工，建立信任同盟。", risk: null, next: "name_witness", effects: { resource_activation: "witness", witness_credibility: 2, _pathLabel: "choice_3:A" } },
      { key: "B", label: "让手机记录一切", desc: "留下时间线证据，但可能滑向传播围观。", risk: "舆论扩散+2", next: "crowd_film", effects: { resource_activation: "record", public_spread: 2, _pathLabel: "choice_3:B" } }
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
        { url: "assets/images/name_witness/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/name_witness/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/name_witness/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/name_witness/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/name_witness/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/name_witness/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
        { url: "assets/images/name_witness/img_07", cssClass: "bg-main", startTime: 18, endTime: 0 },
        { url: "assets/images/name_witness/img_08", cssClass: "bg-main", startTime: 21, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/name_witness/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/name_witness__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/name_witness__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "你！你！就是你，请你帮个忙，立刻打120，开免提！", hl: ["打120", "开免提"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "我打通了！手机在这——", hl: ["我打通了"] },
      { mode: "narration", text: "林小雨像是被这句话推了一下，终于从人群里挤出来", hl: ["挤出来"] },
      { mode: "narration", text: "屏幕上，120的通话计时还在跳", hl: ["通话计时"] },
      { mode: "narration", text: "孙建国愣了半秒，接过手机，按下免提", hl: ["按下免提"] },
      { mode: "narration", text: "调度员的声音从雨声里露出来", hl: ["调度员的声音"] },
      { mode: "narration", text: "王远没有停手，只抬头又喊了一句：", hl: ["没有停手"] }
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
        { url: "assets/images/crowd_film/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/crowd_film/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/crowd_film/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/crowd_film/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/crowd_film/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/crowd_film/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
        { url: "assets/images/crowd_film/img_07", cssClass: "bg-main", startTime: 18, endTime: 0 },
        { url: "assets/images/crowd_film/img_08", cssClass: "bg-main", startTime: 21, endTime: 0 },
        { url: "assets/images/crowd_film/img_09", cssClass: "bg-main", startTime: 24, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/crowd_film__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/crowd_film__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "有没有人帮我拍个全景！", hl: ["拍个全景"] }
    ],
    nextLines: [
      { mode: "narration", text: "有人举起了手机，也有人皱起眉", hl: ["举起了手机"] },
      { mode: "narration", text: "\"这种时候还拍？\"", hl: ["还拍"] },
      { mode: "narration", text: "\"真的假的，作秀吧？\"", hl: ["作秀"] },
      { mode: "narration", text: "\"万一被讹上呢？留个证据也好\"", hl: ["留个证据"] },
      { mode: "narration", text: "王远没有解释。他只盯着老人胸口，继续按压", hl: ["继续按压"] }
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
      images: _imgs("cpr_rhythm", 5),
      videos: [
        { url: "assets/videos/cpr_rhythm/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/cpr_rhythm__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_rhythm__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "免提里，120调度员的声音断断续续传来。", hl: ["120调度员", "冲进站厅"] },
      { text: "远处，马志国已经冲进站厅。王远没有抬头。" },
      { text: "现在他能做的，只剩下一件事——按下去，回弹，再按下去", hl: ["按下去", "回弹", "再按下去"] },
      { text: "【01帧】咬紧牙关、汗水与雨水混合的脸", hl: ["咬紧牙关"] },
      { text: "【02帧】手背上暴起的青筋", hl: ["暴起的青筋"] },
      { text: "【03帧】老人随着按压无意识张开的嘴", hl: ["无意识张开"] },
      { text: "【04帧】围观者的鞋子，有人在悄悄后退", hl: ["悄悄后退"] },
      { text: "【05帧】高架桥下那条空荡荡的马路，120还没来", hl: ["空荡荡", "120还没来"] }
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
      images: _imgs("cpr_fatigue", 3),
      sounds: [
        { url: "assets/audio/ambient/cpr_fatigue__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/cpr_fatigue__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "几分钟过去了，王远的呼吸已经乱了。", hl: ["呼吸已经乱了"] },
      { text: "他每一下都还在往下压，", hl: ["肩膀发沉", "手臂有点抖"] },
      { text: "可肩膀开始发沉，手臂也有点抖。" }
    ],
    choices: [
      { key: "A", label: "把手交出去", desc: "交托信任，按压质量更稳。", risk: "需完成交接操作", next: "let_others", effects: { _pathLabel: "choice_4:A" } },
      { key: "B", label: "咬牙硬撑", desc: "维持掌控感，但更容易疲劳失准。", risk: "按压质量持续下降", next: "keep_going", effects: { compression_quality: -10, wangyuan_burden: 1, _pathLabel: "choice_4:B" } }
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
        { url: "assets/images/let_others/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/let_others/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/let_others/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/let_others/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/let_others/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/let_others/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/let_others__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/let_others__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "兄弟！来帮一把！我数到三，我一撤，你立刻压下去，别停！", hl: ["帮一把", "别停"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "王远", text: "肩膀压上来，手臂打直，垂直往下压！", hl: ["手臂打直", "垂直往下压"] },
      { mode: "dialogue", speaker: "王远", text: "别停，跟着我的数！" },
      { mode: "dialogue", speaker: "林小雨", text: "别抢，跟他的数。手臂别弯", hl: ["别抢", "手臂别弯"], note: "终于往前半步，盯着年轻路人的肩膀" },
      { mode: "narration", text: "救人不只是自己蹲下去。", hl: ["把别人拉过来", "一起接住"] },
      { mode: "narration", text: "有时候，是把别人拉过来，让大家一起接住这件事" }
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
        { url: "assets/images/keep_going/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/keep_going/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/keep_going/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/keep_going/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/keep_going/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/keep_going/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
        { url: "assets/images/keep_going/img_07", cssClass: "bg-main", startTime: 18, endTime: 0 },
        { url: "assets/images/keep_going/img_08", cssClass: "bg-main", startTime: 21, endTime: 0 },
        { url: "assets/images/keep_going/img_09", cssClass: "bg-main", startTime: 24, endTime: 0 },
        { url: "assets/images/keep_going/img_10", cssClass: "bg-main", startTime: 27, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/keep_going__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/keep_going__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远咬紧了牙，一下接一下压下去", hl: ["咬紧了牙"] },
      { text: "他的动作还没停，", hl: ["呼吸越来越重"] },
      { text: "只是呼吸越来越重，额角的水顺着下巴往下滴" },
      { text: "林小雨看见他的手臂有些发紧，立刻往前挤了一步", hl: ["手臂发紧"] },
      { text: "她没有叫他停，只对旁边的人喊：", hl: ["没有叫他停"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "准备接替！别让按压断掉！", hl: ["准备接替"] },
      { mode: "narration", text: "王远听见了，却还是撑着这一轮，继续往下压", hl: ["继续往下压"] },
      { mode: "narration", text: "隔了一段时间——", hl: [""] },
      { mode: "dialogue", speaker: "王远", text: "我数到三，我一撤，你立刻压下去，别停！", hl: ["数到三", "别停"] },
      { mode: "dialogue", speaker: "王远", text: "肩膀压上来，手臂打直，垂直往下压！", hl: ["垂直往下压"] },
      { mode: "dialogue", speaker: "王远", text: "别停，跟着我的数！" },
      { mode: "dialogue", speaker: "林小雨", text: "别抢，跟他的数。手臂别弯", hl: ["别抢", "手臂别弯"], note: "终于往前半步，盯着年轻路人的肩膀" },
      { mode: "narration", text: "救人不只是自己蹲下去。", hl: ["一起接住"] },
      { mode: "narration", text: "有时候，也需要大家一起接住这件事" }
    ],
    next: "family_accuse_handoff"
  },

  // ==================== 汇合 · family_accuse_handoff ====================
  family_accuse_handoff: {
    id: "family_accuse_handoff",
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
        { url: "assets/images/family_accuse_handoff/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_07", cssClass: "bg-main", startTime: 18, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_08", cssClass: "bg-main", startTime: 21, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_09", cssClass: "bg-main", startTime: 24, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_10", cssClass: "bg-main", startTime: 27, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_11", cssClass: "bg-main", startTime: 30, endTime: 0 },
        { url: "assets/images/family_accuse_handoff/img_12", cssClass: "bg-main", startTime: 33, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/family_accuse_handoff__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/family_accuse_handoff__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "让一下……麻烦让一下！", hl: ["让一下"] }
    ],
    nextLines: [
      { mode: "narration", text: "赵雪梅挤到人群边缘时，先看见了雨棚外歪倒的电动车", hl: ["电动车"] },
      { mode: "narration", text: "黄色外卖箱翻在积水边。她心里猛地沉了一下", hl: ["外卖箱", "沉了一下"] },
      { mode: "narration", text: "赵雪梅拨开人群，终于看清了倒在地上的老人。", hl: ["脸色全白了"] },
      { mode: "narration", text: "那一瞬间，她的脸色全白了" },
      { mode: "narration", text: "一个年轻人正跪在父亲身边按压。", hl: ["跪在父亲身边", "盯着他的手"] },
      { mode: "narration", text: "王远站在年轻人身后，弯着腰，盯着他的手，低声提醒节奏" },
      { mode: "narration", text: "老人左手腕的红绳和赵雪梅腕上的那根一模一样", hl: ["红绳", "一模一样"] },
      { mode: "dialogue", speaker: "赵雪梅", text: "爸！你们到底在干什么？！", hl: ["是不是你撞的"] },
      { mode: "dialogue", speaker: "赵雪梅", text: "是不是你撞的他？！是不是你？！" },
      { mode: "narration", text: "年轻路人的手没有停，却被这一声吓得肩膀一抖", hl: ["肩膀一抖"] },
      { mode: "narration", text: "王远没有退开，只压低声音说：", hl: ["没有退开"] }
    ],
    next: "kept_working"
  },

  // ==================== kept_working ====================
  kept_working: {
    id: "kept_working",
    chapter: "第一章",
    title: "和亲人一样想让他活下去",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "王远",
    reviewTags: ["第五阶段", "继续按压"],
    assets: {
      images: _imgs("kept_working", 6),
      sounds: [
        { url: "assets/audio/ambient/kept_working__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/kept_working__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "大姐！别碰！我们在救他的命！", hl: ["别碰", "救他的命"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "大姐！我是护理实习生，我学过急救！", hl: ["护理实习生", "心脏骤停", "按压中断"] },
      { mode: "dialogue", speaker: "林小雨", text: "我从刚开始就一直看着，这位大哥是路过救人的！" },
      { mode: "dialogue", speaker: "林小雨", text: "你爸现在很像心脏骤停，最怕的就是按压中断！" },
      { mode: "dialogue", speaker: "孙建国", text: "对！120早就打通了，全程在听着呢！", hl: ["120早就打通了"] },
      { mode: "narration", text: "赵雪梅僵在原地，手缓缓松开。", hl: ["想把她父亲留住"] },
      { mode: "narration", text: "她看着这个浑身湿透的外卖员，和那个年轻人——" },
      { mode: "narration", text: "在这个冰冷的雨夜，这几个陌生人" },
      { mode: "narration", text: "正和她一样，想把她父亲留住。" }
    ],
    next: "outcome_roll",
    onEnter: { effects: { wangyuan_burden: -1, family_trust: 2 } }
  },

  // ==================== 随机 · outcome_roll ====================
  outcome_roll: {
    id: "outcome_roll",
    chapter: "第一章",
    title: "黄色箱子的两种结果",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    reviewTags: ["第五阶段", "随机"],
    assets: {
      images: _imgs("outcome_roll", 2),
      sounds: [
        { url: "assets/audio/ambient/outcome_roll__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "雨棚下，按压没有停", hl: ["按压没有停"] },
      { text: "马志国冲向站厅以后，", hl: ["等那个AED"] },
      { text: "所有人都在等那个AED的回来" }
    ],
    condition(state) {
      // 50%随机：AED及时到达 / AED迟迟未到
      return Math.random() < 0.5 ? "aed_found_success" : "aed_delay_bad";
    }
  },

  // ==================== 随机A · aed_found_success ====================
  aed_found_success: {
    id: "aed_found_success",
    chapter: "第一章",
    title: "黄色箱子及时回来",
    stage: "subway_canopy",
    mode: "dialogue",
    rain: true,
    speaker: "马志国",
    reviewTags: ["第五阶段", "AED"],
    assets: {
      images: _imgs("aed_found_success", 5),
      videos: [
        { url: "assets/videos/aed_found_success/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_found_success__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_found_success__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "AED拿来了！让一下！", hl: ["AED拿来了"] }
    ],
    nextLines: [
      { mode: "narration", text: "马志国抱着AED冲回雨棚下，箱子外壳上全是雨水", hl: ["冲回雨棚", "全是雨水"] },
      { mode: "narration", text: "王远把它放到台阶边相对干燥的位置", hl: ["干燥的位置"] },
      { mode: "narration", text: "孙建国举着开了免提的手机，", hl: ["免提", "杂物清开"] },
      { mode: "narration", text: "林小雨帮忙把周边人和杂物清开" }
    ],
    next: "aed_clear_space",
    onEnter: { effects: { aed_arrival_timing: "early" } }
  },

  // ==================== 随机A · aed_clear_space ====================
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
      images: _imgs("aed_clear_space", 3),
      sounds: [
        { url: "assets/audio/ambient/aed_clear_space__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_clear_space__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "王远按调度员和AED语音提示拉开胸前衣物，", hl: ["擦干贴片区域"], important: true },
      { text: "林小雨快速擦干贴片要接触的区域", important: true },
      { text: "右上胸、左下胸；大家只为贴片动作让出最短空档", hl: ["右上胸", "左下胸"], important: true }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "120调度员", text: "不要搬动他，继续按压。AED到了就开机，按语音提示做", hl: ["开机", "语音提示"], style: "dispatcher" }
    ],
    next: "aed_execute",
    onEnter: { aedMode: true, step: 1 }
  },

  // ==================== 随机A · aed_execute ====================
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
        { url: "assets/images/aed_execute/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/aed_execute/img_02", cssClass: "bg-main", startTime: 3, endTime: 0 },
        { url: "assets/images/aed_execute/img_03", cssClass: "bg-main", startTime: 6, endTime: 0 },
        { url: "assets/images/aed_execute/img_04", cssClass: "bg-main", startTime: 9, endTime: 0 },
        { url: "assets/images/aed_execute/img_05", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/aed_execute/img_06", cssClass: "bg-main", startTime: 15, endTime: 0 },
        { url: "assets/images/aed_execute/img_07", cssClass: "bg-main", startTime: 18, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/aed_execute/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_execute__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_execute__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "所有人后退。AED分析完成", hl: ["所有人后退", "分析完成"], important: true }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "AED", text: "分析心律中，请勿接触患者", hl: ["请勿接触患者"], style: "aed-voice" },
      { mode: "dialogue", speaker: "AED", text: "建议电击。请确保无人接触患者", hl: ["建议电击", "无人接触"], style: "aed-voice" },
      { mode: "dialogue", speaker: "王远", text: "都离开！不要碰他！", hl: ["都离开"] },
      { mode: "narration", text: "电击键按下去，老人的身体短短一震。没有人欢呼。", hl: ["短短一震"] },
      { mode: "dialogue", speaker: "AED", text: "电击完成。继续心肺复苏", hl: ["继续心肺复苏"], style: "aed-voice" },
      { mode: "narration", text: "年轻路人重新压上去，王远在旁边盯着他的手臂。", hl: ["按下去", "回弹", "再按下去"] },
      { mode: "narration", text: "按下去，回弹，再按下去。" }
    ],
    next: "heartbeat_return",
    onEnter: { aedMode: true, step: 3 }
  },

  // ==================== 随机A · heartbeat_return ====================
  heartbeat_return: {
    id: "heartbeat_return",
    chapter: "第一章",
    title: "微弱的心跳",
    stage: "rain_road",
    mode: "narration",
    rain: true,
    reviewTags: ["第六阶段", "尾声"],
    assets: {
      images: [
        { url: "assets/images/heartbeat_return/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_02", cssClass: "bg-main", startTime: 4, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_03", cssClass: "bg-main", startTime: 8, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_04", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_05", cssClass: "bg-main", startTime: 16, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_06", cssClass: "bg-main", startTime: 20, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_07", cssClass: "bg-main", startTime: 24, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_08", cssClass: "bg-main", startTime: 28, endTime: 0 },
        { url: "assets/images/heartbeat_return/img_09", cssClass: "bg-main", startTime: 32, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/heartbeat_return/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/heartbeat_return__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/heartbeat_return__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.8 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "120救护车刺耳的警笛声终于撕开雨幕", hl: ["撕开雨幕"] },
      { text: "陈默医生和护士抬着担架冲进雨棚，迅速接管了现场", hl: ["接管现场"] },
      { text: "监护仪接上，陈默医生盯着波形，又俯身确认了一次", hl: ["监护仪", "盯着波形"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "陈默医生", text: "有微弱自主循环。准备转运，继续监护", hl: ["微弱自主循环"], style: "character" },
      { mode: "narration", text: "赵雪梅的哭声一下子断住，又更低地颤起来", hl: ["哭声断住"] },
      { mode: "narration", text: "王远退到雨棚边缘，才发现自己的手一直在抖", hl: ["手一直在抖"] },
      { mode: "narration", text: "外卖订单已经彻底超时，屏幕亮着红色提示", hl: ["彻底超时"] },
      { mode: "narration", text: "可这一刻，他没有立刻去看", hl: ["没有立刻去看"] }
    ],
    next: "aed_map"
  },

  // ==================== 随机B · aed_delay_bad ====================
  aed_delay_bad: {
    id: "aed_delay_bad",
    chapter: "第一章",
    title: "迟迟没有回来的AED",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    vignette: true,
    reviewTags: ["第五阶段", "AED延迟"],
    assets: {
      images: [
        { url: "assets/images/aed_delay_bad/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_02", cssClass: "bg-main", startTime: 4, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_03", cssClass: "bg-main", startTime: 8, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_04", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_05", cssClass: "bg-main", startTime: 16, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_06", cssClass: "bg-main", startTime: 20, endTime: 0 },
        { url: "assets/images/aed_delay_bad/img_07", cssClass: "bg-main", startTime: 24, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/aed_delay_bad__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/aed_delay_bad__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.6 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "马志国还没回来", hl: ["还没回来"] },
      { text: "有人探头往站厅里看，只看见来往的人影和湿漉漉的地面", hl: ["人影", "湿漉漉"] },
      { text: "站厅里的声音被雨声切碎，", hl: ["继续按压", "不要中断"] },
      { text: "免提里只剩调度员一遍一遍提醒：继续按压，不要中断" },
      { text: "王远没有抬头，年轻路人的手也没有停", hl: ["没有抬头"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "林小雨", text: "继续按！别等机器，先别停！", hl: ["别等机器"] },
      { mode: "narration", text: "时间被雨水拖得很长。", hl: ["时间被雨水拖得很长"] },
      { mode: "narration", text: "一轮按压换下一轮按压，马志国还是没有回来。" }
    ],
    next: "bad_ending",
    onEnter: { effects: { aed_arrival_timing: "late" } }
  },

  // ==================== 随机B · bad_ending ====================
  bad_ending: {
    id: "bad_ending",
    chapter: "第一章",
    title: "危急转运",
    stage: "subway_canopy",
    mode: "narration",
    rain: true,
    vignette: true,
    reviewTags: ["结局", "坏结局"],
    assets: {
      images: [
        { url: "assets/images/bad_ending/img_01", cssClass: "bg-main", startTime: 0, endTime: 0 },
        { url: "assets/images/bad_ending/img_02", cssClass: "bg-main", startTime: 4, endTime: 0 },
        { url: "assets/images/bad_ending/img_03", cssClass: "bg-main", startTime: 8, endTime: 0 },
        { url: "assets/images/bad_ending/img_04", cssClass: "bg-main", startTime: 12, endTime: 0 },
        { url: "assets/images/bad_ending/img_05", cssClass: "bg-main", startTime: 16, endTime: 0 },
        { url: "assets/images/bad_ending/img_06", cssClass: "bg-main", startTime: 20, endTime: 0 },
        { url: "assets/images/bad_ending/img_07", cssClass: "bg-main", startTime: 24, endTime: 0 },
      ],
      videos: [
        { url: "assets/videos/bad_ending/main", cssClass: "", startTime: 0, endTime: 0 },
      ],
      sounds: [
        { url: "assets/audio/ambient/bad_ending__ambient_1", type: "ambient", startTime: 0, endTime: 0, volume: 0.5 },
        { url: "assets/audio/sfx/bad_ending__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.7 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "救护车终于赶到时，陈默医生和护士迅速接管现场", hl: ["接管现场"] },
      { text: "监护仪接上，按压没有停", hl: ["按压没有停"] }
    ],
    nextLines: [
      { mode: "dialogue", speaker: "陈默医生", text: "继续按压，准备转运。路上继续抢救", hl: ["准备转运", "继续抢救"], style: "character" },
      { mode: "narration", text: "老人被抬上担架时，仍然没有恢复自主循环", hl: ["没有恢复自主循环"] },
      { mode: "narration", text: "赵雪梅跟着担架往雨里跑，手里死死攥着那根红绳", hl: ["死死攥着", "红绳"] },
      { mode: "narration", text: "王远站在雨棚边缘，外卖雨衣上的水顺着衣摆往下淌", hl: ["雨衣上的水"] },
      { mode: "narration", text: "他的电动车还歪倒在积水里，", hl: ["彻底超时"] },
      { mode: "narration", text: "手机屏幕上，订单已经彻底超时" },
      { mode: "narration", text: "他们没有停手。", hl: ["黄色箱子", "晚了一步"] },
      { mode: "narration", text: "只是那个最该及时出现的黄色箱子，终究晚了一步。" }
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
      images: _imgs("aed_map", 5),
      sounds: [
        { url: "assets/audio/bgm/aed_map__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.4 },
        { url: "assets/audio/sfx/aed_map__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 0.5 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [
      { text: "画面从冰冷的雨夜街景渐渐抽离", hl: ["渐渐抽离"] },
      { text: "变成一幅极简的、泛着冷蓝光的\"临江市城市AED地图\"", hl: ["城市AED地图"] },
      { text: "一个光点亮了", hl: ["光点"] },
      { text: "但在这座城市的地图上，还有整整十七个灰色空白区", hl: ["十七个"] },
      { text: "在那些地方，最近的AED需要跑8分钟以上", hl: ["8分钟"] }
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
      ],
      sounds: [
        { url: "assets/audio/bgm/chapter_review__bgm_1", type: "bgm", startTime: 0, endTime: 0, volume: 0.4 },
        { url: "assets/audio/sfx/chapter_review__sfx_1", type: "sfx", startTime: 0, endTime: 0, volume: 1.0 },
      ],
    },
    speed: { media: 1.0, text: 1.0, hold: 1.0 },
    lines: [],
    next: null
  }

};
