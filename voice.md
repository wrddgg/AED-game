# 《生命守护者》角色音色设定

> 本文档是面向 **AI 语音合成 + 后期混音** 的生产版音色圣经，不只描述“像谁”，而是尽量把“该怎么生成、怎么稳住、哪些地方绝不能翻车”说清楚。  
> 当前默认主工作流以 **ElevenLabs 中文配音** 为优先目标；若后续更换供应商，也可以把这里的“角色目标”和“参数逻辑”平移过去。

---

## 一、全局原则

### 1. 整体声音美学

- 全片的声音目标不是“配音腔”，而是 **写实、可近听、带雨夜湿感的电影对白**。
- 不追求播音式圆润，不追求广告片般“好听”，而追求：
  - 真实呼吸
  - 说话时略微卡顿
  - 情绪上来时的轻微破音边缘
  - 句尾不刻意托音
- 所有角色都应当是 **普通话可懂度优先**，允许口语感，但不要做重方言音变。

### 2. 不要做成什么样

- 不要“热血动漫男主腔”
- 不要“新闻播音员腔”
- 不要“网文有声书夸张演播腔”
- 不要“短视频鸡汤旁白腔”
- 不要明显模仿具体明星
- 不要把女性角色做成过甜、过嫩、过媚
- 不要把赵雪梅做成“恶毒医闹反派”

### 3. 推荐模型策略

#### 主模型

- **首选：`eleven_multilingual_v2`**
  - 理由：中文稳定性更高，情绪足够，适合整章统一声线。

#### 补充模型

- **可选：`eleven_v3`**
  - 用途：短句、高情绪、爆发型补录。
  - 只建议用于：
    - 赵雪梅尖叫段
    - 王远高压指挥段
    - 林小雨突破喊话段
  - 不建议整章混用，否则同一角色前后音色容易漂。

### 4. ElevenLabs 参数总则

> 官方文档建议：`stability` 常见起点约 50，`similarity` 常见起点约 75，`style exaggeration` 通常先从 0 开始；`speaker boost` 对部分模型可用，但 `v3` 不支持。  
> 这里给你的不是死数值，而是可直接试跑的“安全起点 + 场景覆盖”。

> **重要**：以下 `stability`、`similarity_boost`、`style_exaggeration` 默认按 **API 的 0-1 标度** 书写。  
> 例如：`0.62` 等于网页滑杆大约 **62** 的位置。

#### 通用起点

- `stability`: **0.48-0.65**
  - 中文主线角色建议优先从 `0.50` 左右起跑
  - 低于 `0.45` 只用于极短句、极端情绪的试探版
  - 越高越稳，但越容易僵
- `similarity_boost`: **0.72-0.80**
  - 保角色统一，不要开太满
- `style_exaggeration`: **0.00-0.08**
  - 本项目整体建议低值，常用区间仍以 `0.00-0.06` 为主
  - 只有个别爆发句才试探到 `0.08`
  - 不要靠猛拉 style 来做情绪
- `speaker_boost`: **按角色 A/B 测试**
  - 旁白优先从 `off` 起试
  - 指令型、清晰度优先的角色可从 `on` 起试
  - `eleven_v3` 不适用
- `speed`: **0.92-1.08**
  - 主要通过文本节奏控制，不要只靠 speed

### 5. 文本写法原则

- 情绪主要靠：
  - 断句
  - 标点
  - 省略号
  - 重复词
  - 句子长短
- 不要在每句前都堆提示词，例如：
  - “悲伤地、绝望地、愤怒地、哭着说……”
- 更好的写法是直接改文本节奏，例如：
  - “你是谁？！你把我爸怎么了？！”
  - 比
  - “愤怒而绝望地说：你是谁，你把我爸怎么了”
  - 更适合 TTS 出情绪。
- 如果仅靠断句和标点仍推不动情绪切换，允许在**少数高难单句**前加极简英文括号指令，例如：
  - `[urgent, restrained] 灰西装先生！请你立刻打120，开免提！`
  - `[quiet, breaking] 爸……爸……`
- 这类指令只作为补录工具使用：
  - 每条控制在 `1-3` 个词
  - 只给单句或短句
  - 不作为整章默认写法

### 6. 生成策略

- **P0 角色关键句统一出 3 个版本**
  - `A版`：稳，给主线
  - `B版`：情绪更强，给高潮
  - `C版`：更克制，给剪辑兜底
- 每个角色不要一次性把全章都生完。
- 锁声阶段一次只改 **1 个主参数**，不要同时改 `stability + similarity + style`，否则无法判断哪一步真正起作用。
- 高风险句尽量 **一条一句单独生成**：
  - 王远高压指挥句
  - 赵雪梅爆发句
  - 林小雨突破句
- 正确顺序：
  1. 定音色
  2. 先跑 6-10 句关键句
  3. 锁定参数
  4. 再批量生成全章

### 7. 调参优先级

- **情绪不够，但音色已经对了**：
  1. 先降 `similarity_boost` `0.02-0.04`
  2. 再加 `style_exaggeration` `0.01-0.02`
  3. 最后才小幅下调 `stability`
- **声音开始飘、断、电子感明显**：
  1. 先把 `stability` 拉回 `+0.02-0.04`
  2. 再把 `style_exaggeration` 回收 `0.01-0.02`
  3. 同时把长句拆短，重新单句生成
- **情绪有了，但不像同一个人了**：
  - 优先补回 `similarity_boost`，不要直接把 `stability` 拉高过头
- **字头太硬、太亮、太“数码”**：
  - 先关 `speaker_boost`，再看是否需要回收一点 `style_exaggeration`

---

## 二、角色总表

| 角色 | 声音任务 | 风险点 | 优先级 |
| --- | --- | --- | --- |
| 旁白 | 奠定叙事基调，串联主题 | 太像纪录片配音或太像鸡汤文 | P0 |
| 王远 | 主角，承载行动与崩溃边缘 | 做成“英雄腔”或方言过重 | P0 |
| 赵雪梅 | 第一章最大情绪爆点 | 做成泼妇、尖到刺耳 | P0 |
| 林小雨 | 从沉默到突破的弧光 | 太甜、太软、太像偶像剧 | P1 |
| 马志国 | 围观者转参与者的关键节点 | 做成脸谱化老兵 | P1 |
| 孙建国 | 普通路人视角的社会阻力 | 过于滑稽或过于官腔 | P2 |
| 陈默 | 专业接管与秩序恢复 | 过冷、过硬、像机器人 | P2 |
| 围观群杂 | 压迫感、传播感、杂音感 | 每句都太清楚，抢主对白 | P3 |

---

## 三、旁白（Narrator）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 男声，38-45岁 |
| **核心定位** | 不是“主持人”，而是一个见过这座城市很多夜晚的人，在几天后把这件事慢慢讲给你听。 |
| **音色描述** | 低中频厚，轻微砂感，近讲、贴耳，不虚张声势。 |
| **咬字要求** | 普通话标准，但拒绝播音腔。每个字都清楚，但不修得太圆。 |
| **语速** | 0.92-0.96 |
| **情绪基调** | 克制、冷静、有重量，不替角色哭，也不替观众激动。 |
| **禁忌** | 不要悬疑片腔，不要鸡汤腔，不要“深沉过头”。 |

### Voice Design Prompt

```text
Mandarin-speaking male narrator, age 38 to 45, warm low baritone, slightly husky, intimate close-mic tone, restrained documentary realism, emotionally controlled, natural breathing, no broadcaster polish, no theatrical delivery, reflective but unsentimental.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.62`
  - `similarity_boost=0.78`
  - `style_exaggeration=0.00`
  - `speaker_boost=off`
  - `speed=0.94`

### 场景覆盖

- **序幕/工厂回忆**：
  - `stability=0.60`
  - 句尾略留气，不多解释
- **第一按压/22秒等节点**：
  - `stability=0.56`
  - 允许更明显的停顿
- **AED地图结尾**：
  - `stability=0.64`
  - 冷一点，像结算说明，不煽情

### 额外执行提示

- 旁白建议单独做一轮 `speaker_boost=off / on` A/B 对比：
  - 如果 `off` 已经足够清楚，就保留更厚、更贴耳的版本
  - 只有当齿音和字头明显发糊时，再切 `on`

---

## 四、王远 Wang Yuan（主角，外卖骑手）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 男声，27-30岁 |
| **核心定位** | 一个被生活磨过、平时不太多话的人；不是天生会发号施令，但真到那一刻，声音会自己长出锋利感。 |
| **音色描述** | 中低音区，略粗，喉部有轻微摩擦感，不能太亮，不能太顺。 |
| **咬字要求** | 普通话为主，只保留轻微口语化和生活感，不做明确地域口音。 |
| **语速** | 平时 0.97-1.00；急救指挥 1.02-1.06；疲劳段 0.94-0.98 |
| **情绪基调** | 外冷内热，压着说，真急的时候会像刀一样切出来。 |
| **禁忌** | 不要配成“热血英雄主角”；不要太油；不要像网约车广告男声。 |

### Voice Design Prompt

```text
Mandarin-speaking Chinese male, late 20s, slightly rough and weathered voice, everyday working-class realism, restrained, quiet intensity, low-mid register, not polished, not heroic, strong command presence under pressure, natural breath and fatigue, subtle throat texture.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.54`
  - `similarity_boost=0.78`
  - `style_exaggeration=0.02`
  - `speaker_boost=on`
  - `speed=0.99`

### 场景覆盖

- **独白/压着说**：
  - `stability=0.54`
  - `style_exaggeration=0.02`
  - `speed=0.96`
  - 句子更短，少重音
- **点名分工 / 喊120 / 找AED**：
  - `stability=0.46-0.50`
  - `similarity_boost=0.74-0.76`
  - `style_exaggeration=0.06`
  - `speed=1.04`
  - 不能像喊口号，要像“必须有人现在去做”
- **体力透支 / 咬牙按压**：
  - `stability=0.46`
  - `style_exaggeration=0.03`
  - `speed=0.97`
  - 文本里保留喘息点，不要后期全切干净

### 关键句基准

- “灰西装先生！就是你，请你立刻打120，开免提！”
  - 目标：快、准、压人，不怒吼
- “保安师傅！麻烦你马上去站里找AED！”
  - 目标：音头硬，尾巴别飘
- “大姐！别碰我！我在救他的命！”
  - 目标：不是骂人，是顶住

---

## 五、林小雨 Lin Xiaoyu（护理系大四实习生）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 女声，21-23岁 |
| **核心定位** | 她的声音弧光不是“从弱变强”，而是“从缩在喉咙里，到终于敢把专业说出口”。 |
| **音色描述** | 清透、细、年轻，但不能甜。前期声带开口小，后期共鸣变实。 |
| **咬字要求** | 普通话清楚，医学词要尤其清楚，例如“濒死叹息”“按压”“别停”。 |
| **语速** | 前期 0.93-0.96；后期 1.01-1.05 |
| **情绪基调** | 犹豫、自责、心里明白但不敢往前；突破后变得干净、利落。 |
| **禁忌** | 不要偶像剧女主腔；不要太甜；不要太像未成年。 |

### Voice Design Prompt

```text
Mandarin-speaking young Chinese woman, early 20s, clear and intelligent voice, slightly soft and restrained at first, student-like but not childish, emotionally hesitant, later becoming bright, firm, and precise, natural realism, no sugary sweetness.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.56`
  - `similarity_boost=0.76`
  - `style_exaggeration=0.01`
  - `speaker_boost=on`
  - `speed=0.97`

### 场景覆盖

- **前期小声判断**：
  - `stability=0.62`
  - `style_exaggeration=0.01`
  - `speed=0.94`
  - 让字往里收
- **纠正按压动作**：
  - `stability=0.50`
  - `style_exaggeration=0.02`
  - `speed=1.01`
  - 专业词干净，不拖
- **挡住赵雪梅时的突破**：
  - `stability=0.46-0.50`
  - `style_exaggeration=0.04`
  - `speed=1.04`
  - 不是尖叫，是第一次站直

### 关键句基准

- “濒死叹息……应该按压。”
  - 前半句几乎像自言自语
- “别抢，跟他的数。手臂别弯。”
  - 这里第一次出现职业感
- “大姐！我是护理实习生，我学过急救！”
  - 音色要亮，但不能飘

---

## 六、赵雪梅 Zhao Xuemei（老人女儿）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 女声，42-48岁 |
| **核心定位** | 她不是坏人，她只是已经碎了。声音里所有攻击性都必须长在恐惧上。 |
| **音色描述** | 中高频尖起来时有撕裂边缘，但底子仍然是普通中年女性，不妖、不恶。 |
| **咬字要求** | 情绪乱时允许字头咬碎一点，但关键词必须清楚，例如“你是谁”“我爸”“别碰”。 |
| **语速** | 爆发段 1.08-1.16；回落段 0.92-0.97 |
| **情绪基调** | 冲进来时是失控，听明白以后是塌下去。 |
| **禁忌** | 不要做成“泼妇骂街”；不要整段都拉满尖叫；不要失真破音到不可用。 |

### Voice Design Prompt

```text
Mandarin-speaking middle-aged Chinese woman, mid to late 40s, emotionally overwhelmed, grief-stricken, normally ordinary and warm but now pushed into panic, cracked urgency, unstable breathing, sharp edges under fear, realistic crying tension, not villainous, not theatrical melodrama.
```

### ElevenLabs 建议

- **主模型**：`eleven_multilingual_v2`
- **爆发补录可选**：`eleven_v3`
- **基准参数**：
  - `stability=0.50`
  - `similarity_boost=0.75`
  - `style_exaggeration=0.02`
  - `speaker_boost=on`
  - `speed=1.10`

### 场景覆盖

- **冲入现场 / 尖叫质问**：
  - `stability=0.42-0.46`
  - `similarity_boost=0.72-0.74`
  - `style_exaggeration=0.06`
  - `speed=1.12`
  - 短句分开发，不要一整段一次生成
- **被解释后哽住**：
  - `stability=0.50`
  - `style_exaggeration=0.02`
  - `speed=0.95`
  - 留更多呼吸和抽泣空档

### 关键句基准

- “你是谁？！你把我爸怎么了？！”
  - 不是连续输出，而是被恐惧顶断
- “是不是你撞的他？！”
  - 重音在“你”
- 回落后不一定要说完整句
  - 抽泣、吸气、半句，比完整台词更真

---

## 七、孙建国 Sun Jianguo（灰西装路人）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 男声，45-52岁 |
| **核心定位** | 很普通的中年路人，不是反派，也不是可靠队友；他就是那种平时会下意识往后缩的人。 |
| **音色描述** | 中音区，稍干，略疲，带办公室久坐感。 |
| **咬字要求** | 清楚，但句子中间有轻微犹豫。 |
| **语速** | 0.95-0.98 |
| **情绪基调** | 被点名之前是躲，被点名之后是慌，再之后是勉强稳住。 |
| **禁忌** | 不要做成滑稽喜剧；不要过度官腔。 |

### Voice Design Prompt

```text
Mandarin-speaking middle-aged Chinese man, ordinary office-worker tone, mildly dry and tense voice, cautious, slightly hesitant, not charismatic, realistic urban bystander, becomes nervous when suddenly asked to act, later steadier but still not fully confident.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.60`
  - `similarity_boost=0.74`
  - `style_exaggeration=0.00`
  - `speaker_boost=on`
  - `speed=0.96`

### 场景覆盖

- **“啊？我？”**
  - `stability=0.52`
  - 让句中发紧
- **替王远作证**
  - `stability=0.58`
  - 慌还在，但已经能把话说顺

---

## 八、马志国 Ma Zhiguo（地铁保安，退伍军人）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 男声，52-58岁 |
| **核心定位** | 这个角色不是“老兵传奇”，而是一个本来沉默的保安，被一句“AED”重新叫回动作状态。 |
| **音色描述** | 低中音粗粝，嗓子略哑，但气口干脆，字短、硬。 |
| **咬字要求** | 能省则省，不拖尾，不解释。 |
| **语速** | 平时 0.95；应声 1.03-1.06 |
| **情绪基调** | 沉默、犹豫、被唤醒。 |
| **禁忌** | 不要做成“将军式威严腔”；不要过多沧桑表演。 |

### Voice Design Prompt

```text
Mandarin-speaking older Chinese man, early to mid 50s, former soldier energy buried under years of ordinary work, rough but controlled voice, concise, practical, slightly hoarse, responds with sudden clipped decisiveness under pressure, no theatrical military swagger.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.58`
  - `similarity_boost=0.78`
  - `style_exaggeration=0.00`
  - `speaker_boost=on`
  - `speed=0.98`

### 场景覆盖

- **平时不出声 / 环境反应**
  - 尽量少句
- **“好！我这就去！”**
  - `stability=0.46`
  - `style_exaggeration=0.02`
  - `speed=1.05`
  - 要短促、发力、无废话

---

## 九、陈默 Chen Mo（120急救医生）

| 属性 | 设定 |
| --- | --- |
| **性别/年龄感** | 男声，38-43岁 |
| **核心定位** | 不是感动人，而是稳住局面；他的声音一进来，现场秩序就回来一半。 |
| **音色描述** | 中低音清晰、干净，不温吞，不冷漠。 |
| **咬字要求** | 指令词必须锐利，信息密度高，但不抢。 |
| **语速** | 1.02-1.06 |
| **情绪基调** | 专业、可靠、低情绪波动。 |
| **禁忌** | 不要过像机器人；不要摆“权威架子”。 |

### Voice Design Prompt

```text
Mandarin-speaking male emergency doctor, around 40, calm, efficient, precise, grounded professional tone, fast but controlled phrasing, no panic, no melodrama, trustworthy and humane, sounds like someone used to making urgent decisions clearly.
```

### ElevenLabs 建议

- **模型**：`eleven_multilingual_v2`
- **基准参数**：
  - `stability=0.62`
  - `similarity_boost=0.76`
  - `style_exaggeration=0.02`
  - `speaker_boost=on`
  - `speed=1.04`

### 场景覆盖

- **接管现场**
  - `stability=0.60`
  - `style_exaggeration=0.02`
  - 稳、快、准
- **问时间线**
  - `stability=0.62`
  - `style_exaggeration=0.01`
  - 不要像审问
  - 要像快速建立信息图

---

## 调度员 / AED语音（专项补充）

### 调度员

- **核心任务**：只负责把现场拉回标准流程，不负责替作品说主题。
- **声音要求**：
  - 清楚
  - 稳定
  - 节奏感强
  - 没有煽情
  - 优先可懂度
- **执行原则**：
  - 动作词要比情绪词更清楚
  - 句子宁可短，不要拖
  - 不做“安慰腔”，更不要做“广播腔”
- **典型句**：
  - “不要搬动他，保持平躺，就地按压。”
  - “双手重叠，垂直往下压，不要停。”
  - “贴片区域擦干，所有人离开患者。”

### AED语音

- **核心任务**：机器提示必须像规则本身，不带人格表演。
- **声音要求**：
  - 中性
  - 清晰
  - 稳定
  - 信息密度高
  - 不要任何温度化表演
- **执行原则**：
  - 以“听懂第一遍”为优先
  - 不追求科幻感
  - 不追求品牌感
  - 句与句之间保留足够执行空档

---

## 十、围观路人 / 直播弹幕群声

| 属性 | 设定 |
| --- | --- |
| **核心定位** | 不是“对白角色”，而是心理压力、社会杂音、传播噪音。 |
| **声音目标** | 让主角被围住，而不是让观众听清每个路人的完整立场。 |

### 分层建议

#### A层：近处可辨识关键词

- 建议 4-6 条单独生成
- 关键词：
  - “别碰”
  - “说不清”
  - “拍下来”
  - “演的吧”
  - “打120了吗”

#### B层：中景模糊碎语

- 男 3 条，女 3 条
- 内容不要完整，只要半句、碎句、重复词
- 不要直接复用主角色 `voice_id`，避免观众在群杂里“听见主角分身”

#### C层：远处人群嗡鸣

- 2-3 条长底噪式群声
- 不求可懂度，只求拥挤感

### 混音建议

- 主对白外的群杂统一做：
  - 高通 `100-140Hz`
  - 轻微低通 `6-8kHz`
  - 短混响
  - 左右声像分散
- 同一条群杂建议至少准备 `2-3` 个不同距离版本，避免循环感
- 关键路人词只在需要时浮出 **2-4dB**
- 群杂永远不能压过王远、林小雨、赵雪梅
- 雨声必须压住环境底噪和群杂，但不能盖住医学指令
- **优先级从高到低**：调度员 / AED语音 / 王远现场指挥句 > 关键角色对白 > 围观群杂 > 环境雨声
- 调度员与AED语音建议预留独立频段和轻微动态控制，避免被雨声吞字

### 直播弹幕声

- 不建议做成“每条弹幕都有人念出来”
- 最多只保留极少数平台化提示音、转发音、点赞音
- 第二章如果要做“传播失真”，再考虑选几条做机械化或远距化处理

---

## 十一、首轮试音台词

> 先别全量跑，先用这些句子定音色。

### 旁白

1. “三年前，他在另一场火里退后了一步。”
2. “一个光点亮了。但这座城市，还有十七个灰色空白区。”

### 王远

1. “让让！别堵着！给他留出空间！”
2. “灰西装先生！请你立刻打120，开免提！”
3. “大姐！别碰我！我在救他的命！”

### 林小雨

1. “濒死叹息……应该按压。”
2. “别抢，跟他的数。手臂别弯。”
3. “大姐！我是护理实习生，我学过急救！”

### 赵雪梅

1. “你是谁？！你把我爸怎么了？！”
2. “是不是你撞的他？！”
3. “爸……爸……”

### 孙建国

1. “啊？我？”
2. “对，120全程在听着呢，是我报的警。”

### 马志国

1. “好！我这就去！”

### 陈默

1. “谁最清楚时间线？倒地多久，什么时候开始按压，AED电击几次？”
2. “交给我们，你先缓一下。”

---

## 十二、最终建议结论

### 最值得先锁死的不是“台词”，而是这 4 个声音方向

1. **旁白要压住，不许煽。**
2. **王远要粗，但不能像英雄配音。**
3. **赵雪梅要崩，但不能像反派。**
4. **林小雨要从“含着话”变成“站出来”。**

### 最容易翻车的 4 个点

1. 王远做得太帅
2. 旁白做得太播
3. 林小雨做得太甜
4. 赵雪梅做得太吵

---

> **技术备注**：所有角色请单独生成干声轨，保留自然呼吸与停顿。不要在生成阶段重压降噪、混响、压缩和环境声。雨夜空间感、现场嘈杂和“湿感”统一后期完成。  
> **执行备注**：P0 角色建议先做 15-20 句试音包，锁定后再批量生成全章，避免整章返工。
