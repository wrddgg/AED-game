# AED 急救互动剧情游戏 - 接口说明文档

> 版本: v0.1.0-framework
> 更新日期: 2026-05-31

---

## 目录

1. [概述](#1-概述)
2. [接口总览](#2-接口总览)
3. [Core 核心层接口](#3-core-核心层接口)
4. [Config 配置层接口](#4-config-配置层接口)
5. [Story 剧情层接口](#5-story-剧情层接口)
6. [Rescue 急救层接口](#6-rescue-急救层接口)
7. [MiniGame 小游戏层接口](#7-minigame-小游戏层接口)
8. [Services 服务层接口](#8-services-服务层接口)
9. [UI 层接口](#9-ui-层接口)
10. [事件系统](#10-事件系统)
11. [数据模型](#11-数据模型)
12. [依赖关系图](#12-依赖关系图)

---

## 1. 概述

本项目采用 **接口分离 + 事件驱动 + 数据配置** 的架构。所有模块之间通过接口和事件总线通信，不直接依赖具体实现。剧情逻辑完全由 JSON 配置驱动，Python 代码不硬编码任何剧情内容。

### 设计原则
- **接口化**：每个核心能力定义接口，实现可替换
- **事件驱动**：模块间通过 EventBus 解耦
- **数据驱动**：所有剧情、规则、配置从 JSON 加载
- **分层清晰**：Core → Config → Story/Rescue/MiniGame → UI

---

## 2. 接口总览

| 层 | 接口类 | 文件路径 | 职责 |
|---|---|---|---|
| Core | `EventBus` | `src/core/event_bus.py` | 事件发布/订阅 |
| Core | `AppContext` | `src/core/app_context.py` | 全局上下文与服务容器 |
| Core | `SceneRouter` | `src/core/scene_router.py` | 场景切换管理 |
| Core | `ResourceManager` | `src/core/resource_manager.py` | 统一资源加载 |
| Core | `TimerManager` | `src/core/timer_manager.py` | 计时器管理 |
| Core | `SaveManager` | `src/core/save_manager.py` | 存档管理 |
| Config | `ConfigLoader` | `src/config/config_loader.py` | JSON 配置加载 |
| Config | `ConfigValidator` | `src/config/config_validator.py` | 配置校验 |
| Config | `StoryConfigParser` | `src/config/story_config_parser.py` | 剧情配置解析 |
| Config | `ScenarioConfigParser` | `src/config/scenario_config_parser.py` | 场景配置解析 |
| Config | `MedicalConfigParser` | `src/config/medical_config_parser.py` | 医疗配置解析 |
| Story | `StoryEngine` | `src/story/story_engine.py` | 剧情引擎核心 |
| Story | `VariableStore` | `src/story/variable_system.py` | 变量系统 |
| Story | `ConditionEvaluator` | `src/story/condition_system.py` | 条件判断 |
| Story | `ActionExecutor` | `src/story/action_system.py` | 动作执行 |
| Story | `ChoiceSystem` | `src/story/choice_system.py` | 选择系统 |
| Story | `StoryNodeProcessor` | `src/story/story_node.py` | 节点处理器 |
| Story | `StoryPlayer` | `src/story/story_player.py` | 剧情播放控制器 |
| Rescue | `RescueFlow` | `src/rescue/rescue_flow.py` | 急救流程控制 |
| Rescue | `PatientState` | `src/rescue/patient_state.py` | 病人状态管理 |
| Rescue | `MedicalRuleEngine` | `src/rescue/medical_rule_engine.py` | 医疗规则引擎 |
| Rescue | `ResultAnalyzer` | `src/rescue/result_analyzer.py` | 结果分析 |
| Rescue | `HelpService` | `src/rescue/help_system.py` | 帮助系统 |
| MiniGame | `MazeGame` | `src/minigames/maze/maze_game.py` | 迷宫小游戏 |
| MiniGame | `MazeGenerator` | `src/minigames/maze/maze_generator.py` | 迷宫生成 |
| MiniGame | `MazeController` | `src/minigames/maze/maze_controller.py` | 迷宫控制 |
| MiniGame | `MazeDifficulty` | `src/minigames/maze/maze_difficulty.py` | 难度管理 |
| MiniGame | `AedTargetSystem` | `src/minigames/maze/aed_target_system.py` | AED目标系统 |
| Services | `LeaderboardService` | `src/services/leaderboard_service.py` | 排行榜 |
| Services | `MedalService` | `src/services/medal_service.py` | 勋章系统 |
| Services | `HistoryService` | `src/services/history_service.py` | 历史记录 |
| Services | `AnalyticsService` | `src/services/analytics_service.py` | 数据埋点 |

---

## 3. Core 核心层接口

### 3.1 EventBus

事件总线，实现发布/订阅模式，线程安全。

```python
class EventBus:
    def subscribe(self, event_type: type, callback: Callable) -> None
    def unsubscribe(self, event_type: type, callback: Callable) -> None
    def publish(self, event_type: type, **kwargs) -> None
    def clear(self) -> None
```

| 方法 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `subscribe` | `event_type`: 事件类型类, `callback`: 回调函数 | None | 订阅事件 |
| `unsubscribe` | `event_type`: 事件类型类, `callback`: 回调函数 | None | 取消订阅 |
| `publish` | `event_type`: 事件类型类, `**kwargs`: 事件数据 | None | 发布事件 |
| `clear` | - | None | 清空所有订阅 |

### 3.2 AppContext

全局应用上下文，服务容器。

```python
class AppContext:
    def register_service(self, name: str, service: Any) -> None
    def get_service(self, name: str) -> Any
    def to_dict(self) -> dict
    @classmethod
    def from_dict(cls, d: dict) -> "AppContext"
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `current_scenario_id` | str | 当前场景ID |
| `current_node_id` | str | 当前节点ID |
| `game_running` | bool | 游戏是否运行 |
| `paused` | bool | 是否暂停 |

### 3.3 SceneRouter

场景切换管理器。

```python
class SceneRouter:
    def add_scene(self, scene_id: str, screen_class: type) -> None
    def open(self, scene_id: str, params: dict = None) -> None
    def go_back(self) -> None
    def get_current(self) -> str
```

| 方法 | 说明 |
|---|---|
| `add_scene` | 注册场景 |
| `open` | 切换到指定场景，可传参 |
| `go_back` | 返回上一场景 |
| `get_current` | 获取当前场景ID |

### 3.4 ResourceManager

统一资源加载。

```python
class ResourceManager:
    def load_image(self, key: str) -> Any
    def load_audio(self, key: str) -> Any
    def load_video(self, key: str) -> Any
    def load_animation(self, key: str) -> Any
    def load_font(self, key: str) -> Any
    def set_base_path(self, path: str) -> None
```

- 内置 LRU 缓存（最大100项）
- 资源加载失败返回占位资源并记录警告
- 资源路径映射可由 JSON 配置覆盖

### 3.5 TimerManager

计时器管理。

```python
class TimerManager:
    def start(self, duration: float, on_timeout: Callable = None, repeat: bool = False) -> str
    def cancel(self, timer_id: str) -> None
    def pause(self, timer_id: str) -> None
    def resume(self, timer_id: str) -> None
    def get_remaining(self, timer_id: str) -> float
    def tick(self, delta_time: float) -> None
```

### 3.6 SaveManager

存档管理。

```python
class SaveManager:
    def save(self, slot_name: str, data: dict) -> None
    def load(self, slot_name: str) -> dict | None
    def list_saves(self) -> list[str]
    def delete(self, slot_name: str) -> None
    def auto_save(self, data: dict) -> None
```

- 存档位置: `data/saves/{slot_name}.json`

---

## 4. Config 配置层接口

### 4.1 ConfigLoader

JSON 配置加载器，内置缓存。

```python
class ConfigLoader:
    def load_json(self, path: str) -> dict
    def load_scenario(self, scenario_id: str) -> dict
    def load_story(self, story_id: str) -> dict
    def load_medical(self, config_id: str) -> dict
    def load_maze(self, config_id: str) -> dict
    def load_help(self, topic_id: str) -> dict
    def load_rewards(self) -> dict
    def reload(self, path: str) -> dict
```

### 4.2 ConfigValidator

配置校验器。

```python
class ConfigValidator:
    def validate_scenario(self, data: dict) -> tuple[bool, list[str]]
    def validate_story_graph(self, data: dict) -> tuple[bool, list[str]]
    def validate_node(self, data: dict) -> tuple[bool, list[str]]
    def validate_choice(self, data: dict) -> tuple[bool, list[str]]
    def validate_condition(self, data: dict) -> tuple[bool, list[str]]
    def validate_action(self, data: dict) -> tuple[bool, list[str]]
    def validate_medical(self, data: dict) -> tuple[bool, list[str]]
    def validate_maze(self, data: dict) -> tuple[bool, list[str]]
```

返回值: `(是否通过, 错误信息列表)`

### 4.3 StoryConfigParser

剧情配置解析器。

```python
class StoryConfigParser:
    def parse_story_graph(self, data: dict) -> StoryGraph
    def parse_node(self, node_data: dict) -> StoryNode
    def parse_choice(self, choice_data: dict) -> ChoiceData
    def parse_condition(self, cond_data: dict) -> ConditionData
    def parse_action(self, action_data: dict) -> ActionData
    def validate_graph(self, graph: StoryGraph) -> tuple[bool, list[str]]
```

---

## 5. Story 剧情层接口

### 5.1 StoryEngine

剧情引擎核心，控制剧情流转。

```python
class StoryEngine:
    def load_story(self, graph: StoryGraph) -> None
    def start(self, story_id: str = None) -> None
    def goto_node(self, node_id: str) -> None
    def choose(self, choice_id: str) -> None
    def pause(self) -> None
    def resume(self) -> None
    def stop(self) -> None
    def get_current_node(self) -> StoryNode | None
    def get_available_choices(self) -> list[ChoiceData]
    def is_at_end(self) -> bool
```

**调用流程**:
1. `load_story(graph)` 加载剧情图
2. `start()` 从起始节点开始
3. `goto_node(node_id)` 跳转节点（自动/手动）
4. `choose(choice_id)` 玩家选择分支
5. 到达 end 类型节点时 `is_at_end()` 返回 True

### 5.2 VariableStore

变量存储系统。

```python
class VariableStore:
    def get(self, key: str, default=None) -> Any
    def set(self, key: str, value) -> None
    def add(self, key: str, delta) -> None
    def sub(self, key: str, delta) -> None
    def has(self, key: str) -> bool
    def remove(self, key: str) -> None
    def get_all(self) -> dict
    def reset(self, initial_vars: dict = None) -> None
    def to_dict(self) -> dict
    @classmethod
    def from_dict(cls, d) -> "VariableStore"
```

### 5.3 ConditionEvaluator

条件判断系统，支持递归嵌套。

```python
class ConditionEvaluator:
    def evaluate(self, conditions: list[dict], context: GameContext) -> bool
```

支持的条件类型:
| type | 说明 | 必需字段 |
|---|---|---|
| `var_compare` | 变量比较 | key, operator, value |
| `flag_set` | 标记已设置 | key |
| `flag_not_set` | 标记未设置 | key |
| `time_exceeded` | 时间超限 | value |
| `step_completed` | 步骤已完成 | key |

逻辑组合: AND(默认列表), OR(`or_conditions`), NOT(`not_condition`)

### 5.4 ActionExecutor

动作执行系统。

```python
class ActionExecutor:
    def execute(self, actions: list[dict], context: GameContext) -> None
```

支持的动作类型:
| type | 说明 | 必需字段 |
|---|---|---|
| `set_var` | 设置变量 | key, value |
| `add_var` | 增加变量 | key, value |
| `sub_var` | 减少变量 | key, value |
| `set_flag` | 设置标记 | key, value |
| `remove_flag` | 移除标记 | key, value |
| `play_audio` | 播放音频 | key |
| `play_video` | 播放视频 | key |
| `navigate` | 场景跳转 | key |
| `trigger_minigame` | 触发小游戏 | key, params |
| `write_record` | 写入记录 | key, value |
| `modify_patient` | 修改病人状态 | key, value |

### 5.5 ChoiceSystem

选择系统。

```python
class ChoiceSystem:
    def evaluate_choices(self, choices: list[ChoiceData], context: GameContext) -> list[ChoiceData]
    def select_choice(self, choice: ChoiceData, context: GameContext) -> str
```

- `evaluate_choices`: 过滤出满足条件的选项
- `select_choice`: 执行选择效果，返回 next_node

---

## 6. Rescue 急救层接口

### 6.1 RescueFlow

急救流程控制。

```python
class RescueFlow:
    def start_scenario(self, scenario_id: str) -> None
    def advance_step(self, step_id: str) -> None
    def fail_step(self, step_id: str, reason: str) -> None
    def skip_step(self, step_id: str) -> None
    def finish(self) -> None
    def get_current_step(self) -> dict | None
    def get_progress(self) -> dict
```

### 6.2 PatientState

病人状态管理。

```python
class PatientState:
    def get_state(self) -> dict
    def apply_damage(self, amount: float) -> None
    def apply_recovery(self, amount: float) -> None
    def set_state(self, state: dict) -> None
    def is_dead(self) -> bool
    def is_stable(self) -> bool
    def get_condition_score(self) -> float
    def decay(self, delta_time: float) -> None
    def to_dict(self) -> dict
    @classmethod
    def from_dict(cls, d) -> "PatientState"
```

### 6.3 MedicalRuleEngine

医疗规则引擎。

```python
class MedicalRuleEngine:
    def load_rules(self, config: dict) -> None
    def validate_step(self, step_id: str, patient_state: dict, context: dict) -> tuple[bool, str]
    def get_consequence(self, step_id: str, error_type: str) -> dict
    def check_success_condition(self, patient_state: dict, context: dict) -> bool
    def check_failure_condition(self, patient_state: dict, context: dict) -> bool
```

### 6.4 ResultAnalyzer

结果分析器。

```python
class ResultAnalyzer:
    def analyze(self, record: dict) -> dict
```

返回值字段:
- `overall_rating`: S/A/B/C/D
- `time_score`: 时间评分
- `accuracy_score`: 准确率评分
- `mistakes_summary`: 错误摘要
- `correct_steps`: 正确步骤
- `missed_steps`: 遗漏步骤
- `patient_outcome`: 病人结局
- `tips`: 改进建议
- `ending_type`: 结局类型

### 6.5 HelpService

帮助系统。

```python
class HelpService:
    def get_help(self, topic_id: str) -> str
    def show_help(self, topic_id: str) -> None
    def list_topics(self) -> list[dict]
    def load_topics(self) -> None
```

---

## 7. MiniGame 小游戏层接口

### 7.1 MazeGame

迷宫小游戏，实现 IMiniGame 接口。

```python
class MazeGame:
    def start(self, config: dict, callback: Callable = None) -> None
    def stop(self) -> None
    def is_completed(self) -> bool
    def is_failed(self) -> bool
    def handle_input(self, direction: str) -> dict
    def get_render_data(self) -> dict
```

### 7.2 MazeGenerator

迷宫生成器。

```python
class MazeGenerator:
    def generate(self, difficulty: dict, targets: list = None) -> dict
```

返回值: `{grid, start, end, targets, size}`
- grid: 二维列表 (0=通路, 1=墙壁, 2=AED目标)

### 7.3 MazeController

迷宫控制器。

```python
class MazeController:
    def init(self, maze_data: dict) -> None
    def move(self, direction: str) -> bool
    def get_player_position(self) -> tuple
    def is_at_target(self) -> bool
    def is_at_exit(self) -> bool
    def get_state(self) -> dict
    def reset(self) -> None
```

### 7.4 MazeDifficulty

难度预设管理。

```python
class MazeDifficulty:
    PRESETS = {
        "easy": {size: (7,7), obstacle_ratio: 0.1, time_limit: 60, targets: 1},
        "normal": {size: (11,11), obstacle_ratio: 0.15, time_limit: 45, targets: 1},
        "hard": {size: (15,15), obstacle_ratio: 0.2, time_limit: 30, targets: 2}
    }
    def get_preset(self, difficulty: str) -> dict
    def create_custom(self, size, obstacle_ratio, time_limit, targets) -> dict
```

### 7.5 AedTargetSystem

AED目标追踪。

```python
class AedTargetSystem:
    def setup(self, targets: list) -> None
    def check_found(self, position: tuple) -> bool
    def all_found(self) -> bool
    def get_progress(self) -> dict
```

---

## 8. Services 服务层接口

### 8.1 LeaderboardService

```python
class LeaderboardService:
    def submit_score(self, entry: dict) -> None
    def fetch_top_list(self, count: int = 10) -> list[dict]
```

### 8.2 MedalService

```python
class MedalService:
    def unlock(self, medal_id: str) -> None
    def has(self, medal_id: str) -> bool
    def list_unlocked(self) -> list[str]
    def check_unlocks(self, context: dict) -> list[str]
```

### 8.3 HistoryService

```python
class HistoryService:
    def record(self, record: dict) -> None
    def list_records(self) -> list[dict]
    def get_record(self, record_id: str) -> dict | None
    def delete_record(self, record_id: str) -> None
```

### 8.4 AnalyticsService

```python
class AnalyticsService:
    def track_event(self, event_name: str, data: dict = None) -> None
    def get_events(self, event_name: str = None) -> list[dict]
    def flush(self) -> None
```

---

## 9. UI 层接口

### 9.1 BaseScreen

所有场景基类。

```python
class BaseScreen:
    scene_id: str  # 类属性
    def on_enter(self) -> None
    def on_leave(self) -> None
    def update(self, data: dict) -> None
    def show_loading(self) -> None
    def hide_loading(self) -> None
    def show_error(self, message: str) -> None
```

### 9.2 Screen 列表

| Screen | scene_id | 文件 |
|---|---|---|
| BootScreen | boot | `screens/boot_screen.py` |
| MainMenuScreen | main_menu | `screens/main_menu_screen.py` |
| ScenarioSelectScreen | scenario_select | `screens/scenario_select_screen.py` |
| StoryScreen | story | `screens/story_screen.py` |
| MazeScreen | maze | `screens/maze_screen.py` |
| ResultScreen | result | `screens/result_screen.py` |
| HistoryScreen | history | `screens/history_screen.py` |
| LeaderboardScreen | leaderboard | `screens/leaderboard_screen.py` |
| SettingsScreen | settings | `screens/settings_screen.py` |

### 9.3 ScreenFactory

场景工厂。

```python
class ScreenFactory:
    SCREEN_REGISTRY: dict  # scene_id -> Screen类
    def create(self, screen_id: str) -> BaseScreen
    def register(self, screen_id: str, screen_class: type) -> None
```

---

## 10. 事件系统

所有事件类型定义在 `src/models/events.py`。

| 事件类 | 触发时机 | 关键字段 |
|---|---|---|
| `GameStartedEvent` | 游戏启动 | - |
| `GamePausedEvent` | 游戏暂停 | - |
| `GameResumedEvent` | 游戏恢复 | - |
| `SceneChangedEvent` | 场景切换 | scene_id, params |
| `StoryNodeEnteredEvent` | 进入剧情节点 | node_id, node_type |
| `StoryChoiceSelectedEvent` | 玩家选择 | choice_id, node_id |
| `VariableChangedEvent` | 变量变化 | key, old_value, new_value |
| `MiniGameStartedEvent` | 小游戏开始 | game_type, config |
| `MiniGameCompletedEvent` | 小游戏完成 | game_type, success, score |
| `TimerTimeoutEvent` | 计时器超时 | timer_id |
| `PatientStateChangedEvent` | 病人状态变化 | attribute, old_value, new_value |
| `ScenarioCompletedEvent` | 场景完成 | scenario_id, result |
| `RecordSavedEvent` | 记录保存 | record_id |
| `RescueStepAdvancedEvent` | 急救步骤推进 | step_id |
| `RescueStepFailedEvent` | 急救步骤失败 | step_id, reason |

---

## 11. 数据模型

所有模型使用 `@dataclass` 定义，支持 `to_dict()` / `from_dict()` 序列化。

| 模型 | 文件 | 说明 |
|---|---|---|
| `GameContext` | `models/game_context.py` | 全局游戏上下文 |
| `ScenarioData` | `models/scenario_data.py` | 场景配置数据 |
| `StoryGraph` | `models/story_data.py` | 剧情图 |
| `StoryNode` | `models/story_data.py` | 剧情节点 |
| `ChoiceData` | `models/story_data.py` | 选项数据 |
| `ConditionData` | `models/story_data.py` | 条件数据 |
| `ActionData` | `models/story_data.py` | 动作数据 |
| `GameRecord` | `models/record_data.py` | 游戏记录 |
| `RewardData` | `models/record_data.py` | 奖励数据 |
| `LeaderboardEntry` | `models/record_data.py` | 排行榜条目 |
| `MazeConfig` | `config/config_models.py` | 迷宫配置 |
| `MedicalStep` | `config/config_models.py` | 医疗步骤 |
| `HelpTopic` | `config/config_models.py` | 帮助主题 |

---

## 12. 依赖关系图

```
AppManager (入口)
  ├── EventBus
  ├── AppContext ←── 所有服务注册于此
  ├── SceneRouter ←── ScreenManager
  ├── ResourceManager
  ├── TimerManager
  ├── SaveManager
  │
  ├── StoryPlayer (协调器)
  │   └── StoryEngine
  │       ├── VariableStore
  │       ├── ConditionEvaluator
  │       ├── ActionExecutor ←── EventBus, VariableStore
  │       ├── ChoiceSystem ←── ConditionEvaluator, ActionExecutor
  │       └── StoryNodeProcessor ←── ConditionEvaluator, ActionExecutor, VariableStore
  │
  ├── RescueFlow
  │   ├── PatientState
  │   ├── MedicalRuleEngine
  │   └── ResultAnalyzer
  │
  ├── MazeGame
  │   ├── MazeGenerator
  │   ├── MazeController
  │   ├── MazeDifficulty
  │   └── AedTargetSystem
  │
  ├── ConfigLoader → ConfigValidator
  │   ├── StoryConfigParser → StoryGraph, StoryNode, ChoiceData...
  │   ├── ScenarioConfigParser → ScenarioData
  │   └── MedicalConfigParser → MedicalStep...
  │
  └── Services
      ├── LeaderboardService
      ├── MedalService
      ├── HistoryService
      └── AnalyticsService
```
