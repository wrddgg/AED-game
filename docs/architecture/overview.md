# AED 急救互动剧情游戏 - 项目架构说明

> 版本: v0.1.0-framework
> 更新日期: 2026-05-31

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [分层架构](#3-分层架构)
4. [模块关系图](#4-模块关系图)
5. [数据流](#5-数据流)
6. [主流程](#6-主流程)
7. [目录结构](#7-目录结构)
8. [设计决策](#8-设计决策)

---

## 1. 项目概述

AED 急救互动剧情游戏是一个 **强配置驱动** 的互动叙事系统，玩法风格参考《隐形守护者》——视频 + 选择 + 分支 + 多结局。

核心特点：
- **JSON 数据驱动**：所有剧情、选项、条件、跳转由 JSON 配置，不改代码即可扩展
- **接口分离**：模块间通过接口和事件总线通信
- **剧情引擎通用化**：引擎不绑定特定故事，可复用于任何互动叙事场景
- **Python + Kivy**：跨平台移动 App 框架

---

## 2. 技术栈

| 技术 | 用途 | 版本 |
|---|---|---|
| Python | 主语言 | 3.10+ |
| Kivy | UI 框架 | 2.3+ |
| KivyMD | Material Design 组件 | 1.2+ |
| JSON | 配置数据格式 | - |

---

## 3. 分层架构

```
┌─────────────────────────────────────────────┐
│                   UI 层                      │
│  Screens / Widgets / Dialogs / Overlays      │
│  只负责渲染和输入，不写剧情逻辑              │
├─────────────────────────────────────────────┤
│              Story / Rescue / MiniGame 层     │
│  剧情引擎 / 急救流程 / 迷宫小游戏            │
│  业务逻辑核心，不直接操作 UI                  │
├─────────────────────────────────────────────┤
│               Config 配置层                   │
│  JSON 加载 / 校验 / 解析                      │
│  将原始 JSON 转换为内部数据模型               │
├─────────────────────────────────────────────┤
│                Core 核心层                    │
│  EventBus / SceneRouter / ResourceManager    │
│  Timer / Save / Logger / AppContext           │
├─────────────────────────────────────────────┤
│              Models 数据模型层                │
│  dataclass 定义，可序列化                      │
├─────────────────────────────────────────────┤
│              Services 服务层                   │
│  排行榜 / 勋章 / 历史 / 埋点                  │
│  独立于业务逻辑，通过接口调用                  │
└─────────────────────────────────────────────┘
```

### 各层职责

| 层 | 职责 | 关键规则 |
|---|---|---|
| **UI 层** | 渲染界面、收集输入 | 不写逻辑，从引擎拿数据渲染 |
| **Story 层** | 剧情流转、选择、条件、变量 | 不直接操作 UI，通过事件通知 |
| **Rescue 层** | 急救流程、病人状态、规则校验 | 独立于剧情引擎，可单独使用 |
| **MiniGame 层** | 小游戏（迷宫） | 通过统一接口嵌入剧情流 |
| **Config 层** | 加载和解析 JSON 配置 | 校验 + 转换，输出 dataclass |
| **Core 层** | 基础设施 | 被所有上层依赖，不依赖上层 |
| **Models 层** | 数据结构定义 | 无行为，纯数据 |
| **Services 层** | 横切服务 | 通过接口调用，可替换实现 |

---

## 4. 模块关系图

```
                    ┌──────────┐
                    │ AppManager│ (入口)
                    └────┬─────┘
                         │ 初始化
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │EventBus │   │AppContext│   │SceneRouter│
    └────┬────┘   └────┬─────┘   └────┬─────┘
         │             │              │
    ┌────┴─────────────┴──────────────┴────┐
    │            事件驱动通信                │
    └──┬──────┬──────┬──────┬──────┬──────┘
       ▼      ▼      ▼      ▼      ▼
    ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
    │Story││Rescue││Maze ││Config││Svc  │
    │Engine││Flow ││Game ││Loader││ices │
    └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘
       │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼
    ┌──────────────────────────────────┐
    │           Models + Utils          │
    └──────────────────────────────────┘
```

### 关键依赖方向

- **UI → Story/Rescue/Maze**: UI 层订阅事件，获取数据渲染
- **Story → Config**: 引擎从 Config 层获取剧情图
- **Story → Rescue**: 剧情节点可触发急救流程
- **Story → Maze**: minigame 类型节点触发迷宫
- **所有层 → Core**: 所有层都可能使用 EventBus、Timer、Save 等
- **Services 被调用，不调用别人**: 服务层只响应请求

---

## 5. 数据流

### 5.1 剧情播放数据流

```
JSON配置文件
    │
    ▼
ConfigLoader.load_story()
    │
    ▼
StoryConfigParser.parse_story_graph() → StoryGraph
    │
    ▼
StoryEngine.load_story(graph)
    │
    ▼
StoryEngine.start() → goto_node(start_node)
    │
    ├─→ StoryNodeProcessor.enter_node()
    │       │
    │       ├─→ ConditionEvaluator.evaluate()  (检查条件)
    │       ├─→ ActionExecutor.execute()        (执行动作)
    │       └─→ EventBus.publish(StoryNodeEnteredEvent)
    │
    ▼
UI (StoryScreen) 接收事件，渲染节点内容
    │
    ▼ (玩家选择)
UI → StoryEngine.choose(choice_id)
    │
    ├─→ ChoiceSystem.select_choice()
    │       ├─→ ActionExecutor.execute(effects)
    │       └─→ 返回 next_node
    │
    ▼
StoryEngine.goto_node(next_node)
    │
    ▼ (循环，直到 end 节点)
StoryEngine.is_at_end() == True
    │
    ▼
ResultAnalyzer.analyze(record) → 结算数据
```

### 5.2 迷宫小游戏数据流

```
StoryEngine 到达 minigame 节点
    │
    ▼
EventBus.publish(MiniGameStartedEvent)
    │
    ▼
MazeGame.start(maze_config)
    │
    ├─→ MazeDifficulty.get_preset()
    ├─→ MazeGenerator.generate()
    ├─→ MazeController.init()
    └─→ AedTargetSystem.setup()
    │
    ▼
UI (MazeScreen) 接收事件，渲染迷宫
    │
    ▼ (玩家操作方向)
UI → MazeGame.handle_input(direction)
    │
    ├─→ MazeController.move(direction)
    ├─→ AedTargetSystem.check_found()
    └─→ 返回状态更新
    │
    ▼ (找到AED / 超时)
MazeGame.is_completed() / is_failed()
    │
    ▼
EventBus.publish(MiniGameCompletedEvent)
    │
    ▼
StoryEngine 根据结果跳转到 next_node / failure_node
```

### 5.3 急救流程数据流

```
StoryEngine 到达关键节点
    │
    ▼
RescueFlow.start_scenario(scenario_id)
    │
    ├─→ MedicalConfigParser.parse_medical_config()
    ├─→ PatientState(initial_state)
    └─→ MedicalRuleEngine.load_rules()
    │
    ▼ (每个步骤)
RescueFlow.advance_step(step_id)
    │
    ├─→ MedicalRuleEngine.validate_step()
    ├─→ PatientState.apply_recovery() / apply_damage()
    └─→ EventBus.publish(RescueStepAdvancedEvent)
    │
    ▼ (步骤失败)
RescueFlow.fail_step(step_id, reason)
    │
    ├─→ 执行 error_consequence
    └─→ EventBus.publish(RescueStepFailedEvent)
    │
    ▼ (完成)
RescueFlow.finish()
    │
    ▼
ResultAnalyzer.analyze(record)
```

---

## 6. 主流程

### 6.1 应用启动流程

```
app.py → main()
    │
    ▼
AppManager.__init__()
    ├─→ 初始化 Logger
    ├─→ 创建 EventBus
    ├─→ 创建 AppContext
    ├─→ 创建 ResourceManager
    ├─→ 创建 TimerManager
    ├─→ 创建 SaveManager
    ├─→ 创建 SceneRouter
    ├─→ 注册所有服务到 AppContext
    └─→ 创建 ConfigLoader
    │
    ▼
AppManager.run()
    ├─→ 创建 Kivy App
    ├─→ build(): 构建 ScreenManager
    ├─→ ScreenFactory.create() 所有场景
    ├─→ SceneRouter.add_scene() 注册场景
    └─→ SceneRouter.open("boot")
    │
    ▼
BootScreen → 3秒后 → open("main_menu")
```

### 6.2 游戏主循环

```
主菜单 → 选择场景 → 加载剧情 → 剧情播放 → 结算 → 返回主菜单
                                              │
                            ┌─────────────────┘
                            │
                            ├→ 触发迷宫小游戏 → 返回剧情
                            ├→ 急救流程推进
                            └→ 结局分析 → 保存记录
```

### 6.3 节点处理流程

```
进入节点
    │
    ├─ 检查 conditions → 不满足 → 跳转 failure_node
    │
    ├─ 执行 actions (进入动作)
    │
    ├─ 根据 type 渲染:
    │   ├─ video → 播放视频 → 结束后 → next_node
    │   ├─ text → 显示文本 → 等待点击 → next_node
    │   ├─ choice → 显示选项 → 等待选择 → 选择的 next_node
    │   ├─ minigame → 启动迷宫 → 等待结果 → success/failure_node
    │   ├─ branch → 评估 branch_conditions → 命中条件的 next_node
    │   └─ end → 显示结局 → 进入结算
    │
    ├─ 如有 duration → 启动倒计时
    │   └─ 超时 → 跳转 failure_node 或执行超时逻辑
    │
    └─ 执行 exit_actions (退出动作)
```

---

## 7. 目录结构

```
project/
├── app.py                      # 应用入口
├── requirements.txt            # Python 依赖
├── README.md                   # 项目说明
│
├── assets/                     # 资源文件
│   ├── images/                 # 图片
│   ├── icons/                  # 图标
│   ├── characters/             # 角色素材
│   ├── backgrounds/            # 背景
│   ├── ui/                     # UI 素材
│   ├── animations/             # 动画
│   ├── videos/                 # 视频
│   ├── audio/                  # 音频
│   └── fonts/                  # 字体
│
├── configs/                    # 配置文件
│   ├── scenarios/              # 场景配置 (subway.json, park.json)
│   ├── stories/                # 剧情图配置 (subway_story.json)
│   ├── medical/                # 医疗流程配置 (standard_aed.json)
│   ├── difficulty/             # 迷宫难度配置 (subway_maze.json)
│   ├── ui/                     # UI 布局配置
│   ├── rewards/                # 勋章奖励 (rewards.json)
│   ├── help/                   # 帮助文档 (help_topics.json)
│   └── examples/               # 配置示例
│
├── data/                       # 运行时数据
│   ├── saves/                  # 存档
│   ├── history/                # 历史记录
│   └── cache/                  # 缓存
│
├── docs/                       # 文档
│   ├── api/                    # 接口说明 (interface_spec.md)
│   ├── config_schema/          # 配置说明 (story_schema.md)
│   ├── architecture/           # 架构说明 (overview.md)
│   └── usage/                  # 使用指南
│
└── src/                        # 源代码
    ├── core/                   # 核心层 (8文件)
    ├── config/                 # 配置层 (6文件)
    ├── story/                  # 剧情层 (7文件)
    ├── rescue/                 # 急救层 (5文件)
    ├── minigames/maze/         # 迷宫层 (5文件)
    ├── ui/                     # UI 层
    │   ├── screens/            #   9个场景
    │   ├── widgets/            #   4个组件
    │   ├── dialogs/            #   3个弹窗
    │   ├── overlays/           #   2个遮罩
    │   └── loaders/            #   1个工厂
    ├── services/               # 服务层 (4文件)
    ├── models/                 # 数据模型 (5文件)
    └── utils/                  # 工具类 (5文件)
```

**总计**: 65 个 Python 文件 + 6 个 JSON 配置 + 3 份文档

---

## 8. 设计决策

### 8.1 为什么用 Kivy 而不是 Unity？

| 维度 | Kivy (Python) | Unity (C#) |
|---|---|---|
| 配置驱动 | 天然适合，Python JSON 处理极强 | 需要额外反序列化层 |
| 快速迭代 | 改 JSON 即生效 | 需要重新编译 |
| 部署 | Buildozer 打包 APK | 更成熟的移动端支持 |
| 团队门槛 | Python 门槛低 | C# + Unity 学习曲线陡 |
| 游戏类型 | 互动叙事类足够 | 更适合 3D/物理类 |

本项目是**互动剧情 + 轻量小游戏**，不需要 3D 渲染和物理引擎，Kivy 足够且更契合配置驱动的理念。

### 8.2 为什么事件驱动而不是直接调用？

- **解耦**：UI 不需要知道 StoryEngine 的存在
- **可测试**：可以独立测试每个模块，不依赖 UI
- **可扩展**：新模块只需订阅事件，不需要修改现有代码
- **调试友好**：可以在 EventBus 上追踪所有通信

### 8.3 为什么 Condition 支持递归嵌套？

- 现实中的急救决策常常是复合条件
- 例如："如果已经做了CPR **且** (打了120 **或** 找到了AED)"
- 嵌套条件让 JSON 配置可以表达任意复杂的逻辑
- 避免在 Python 代码中硬编码判断

### 8.4 变量系统为什么要独立？

- 变量是条件判断和分支的基础
- 独立出来便于序列化（存档/读档）
- 便于调试（可以查看所有变量状态）
- 便于测试（可以手动设置变量验证条件逻辑）

---

## 附录：模块文件清单

| 模块 | 文件 | 行数(约) |
|---|---|---|
| Core | 8 | 1200 |
| Config | 6 | 800 |
| Story | 7 | 1000 |
| Rescue | 5 | 700 |
| MiniGame | 5 | 600 |
| UI Screens | 9 | 1500 |
| UI Widgets | 4 | 400 |
| UI Dialogs | 3 | 300 |
| UI Overlays | 2 | 200 |
| UI Loaders | 1 | 100 |
| Services | 4 | 400 |
| Models | 5 | 600 |
| Utils | 5 | 400 |
| **合计** | **65** | **~8200** |
