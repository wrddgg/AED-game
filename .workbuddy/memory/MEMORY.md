# AED急救游戏项目 - 长期记忆

## 项目概况
- **名称**: AED急救剧情互动游戏
- **仓库**: https://github.com/wrddgg/AED-game
- **技术栈**: Python + Kivy + KivyMD，强配置驱动 + 事件总线 + 接口解耦架构
- **当前阶段**: 框架搭建完成（v0.1.0-framework），可开始填充内容
- **玩法风格**: 参考《隐形守护者》——视频+选择+分支+多结局

## 框架结构（65个Python文件）
- **Core层** (8文件): AppManager, EventBus, AppContext, SceneRouter, ResourceManager, TimerManager, SaveManager, Logger
- **Config层** (6文件): ConfigLoader, ConfigValidator, StoryConfigParser, ScenarioConfigParser, MedicalConfigParser, ConfigModels
- **Story层** (7文件): StoryEngine, VariableStore, ConditionEvaluator, ActionExecutor, ChoiceSystem, StoryNodeProcessor, StoryPlayer
- **Rescue层** (5文件): RescueFlow, PatientState, MedicalRuleEngine, ResultAnalyzer, HelpService
- **MiniGame层** (5文件): MazeGame, MazeGenerator, MazeController, MazeDifficulty, AedTargetSystem
- **Models层** (5文件): Events, GameContext, ScenarioData, StoryData, RecordData
- **Services层** (4文件): LeaderboardService, MedalService, HistoryService, AnalyticsService
- **UI层** (19文件): 9 Screens + 4 Widgets + 3 Dialogs + 2 Overlays + 1 Factory
- **Utils层** (5文件): FileUtils, JsonUtils, PathUtils, TimeUtils, DebugUtils

## JSON配置示例（7个）
- configs/scenarios/subway.json, park.json
- configs/stories/subway_story.json（12节点+3结局完整剧情图）
- configs/medical/standard_aed.json（8步AED急救流程）
- configs/difficulty/subway_maze.json
- configs/rewards/rewards.json
- configs/help/help_topics.json

## 核心设计
- **强配置驱动**: 所有剧情/选项/条件/跳转由JSON配置，不改代码即可扩展
- **节点类型**: video/text/choice/minigame/branch/end
- **条件系统**: 支持AND/OR/NOT递归嵌套
- **动作系统**: set_var/add_var/sub_var/set_flag/remove_flag/play_audio/navigate等
- **变量系统**: 独立VariableStore，可序列化
- **事件总线**: 15种事件类型，线程安全

## 文档
- docs/api/interface_spec.md — 接口说明
- docs/config_schema/story_schema.md — JSON配置格式说明
- docs/architecture/overview.md — 架构说明

## 技术变更记录
- 2026-05-31: 从Unity+C#完全重写为Python+Kivy，保留数据驱动和事件总线架构
- 原因: 更契合配置驱动理念，Python JSON处理更强，团队门槛更低
- Git push已验证可用（https方式）

## 命名规范
- Python包: src/core, src/config, src/story, src/rescue, src/minigames, src/ui, src/services, src/models, src/utils
- JSON key: snake_case
- 资源引用: 通过ResourceManager key映射，不硬编码路径

## 中文字体配置
- **字体文件**: assets/fonts/simhei.ttf（黑体，默认）/ msyh.ttc（微软雅黑，备用）
- **配置方式**: app.py 在 Kivy 初始化前通过 `Config.set("kivy", "default_font", ["SimHei", path...])` 设置
- **字体模块**: src/ui/fonts.py（FONT_REGISTRY字典、FontSize规范常量）
- **二次确认**: app_manager.py 的 `_register_chinese_fonts()` 确保LabelBase已注册
- **关键**: Kivy对TTC字体支持不稳定，优先使用TTF格式；Config.set必须在创建Widget前执行
