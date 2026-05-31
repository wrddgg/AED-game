# AED 急救互动剧情游戏 - JSON 配置格式说明

> 版本: v0.1.0
> 更新日期: 2026-05-31

---

## 目录

1. [概述](#1-概述)
2. [Scenario 场景配置](#2-scenario-场景配置)
3. [StoryGraph 剧情图配置](#3-storygraph-剧情图配置)
4. [StoryNode 剧情节点配置](#4-storynode-剧情节点配置)
5. [Choice 选项配置](#5-choice-选项配置)
6. [Condition 条件配置](#6-condition-条件配置)
7. [Action 动作配置](#7-action-动作配置)
8. [Medical 医疗流程配置](#8-medical-医疗流程配置)
9. [Maze 迷宫配置](#9-maze-迷宫配置)
10. [Help 帮助文档配置](#10-help-帮助文档配置)
11. [Rewards 勋章奖励配置](#11-rewards-勋章奖励配置)
12. [资源引用规范](#12-资源引用规范)
13. [完整示例](#13-完整示例)

---

## 1. 概述

所有游戏内容（剧情、规则、选项、条件、动作等）均通过 JSON 文件配置。Python 代码不硬编码任何剧情逻辑。

### 配置文件存放位置

| 配置类型 | 目录 | 命名约定 |
|---|---|---|
| 场景 | `configs/scenarios/` | `{scenario_id}.json` |
| 剧情 | `configs/stories/` | `{story_id}.json` |
| 医疗 | `configs/medical/` | `{config_id}.json` |
| 迷宫 | `configs/difficulty/` | `{config_id}.json` |
| 帮助 | `configs/help/` | `help_topics.json` |
| 奖励 | `configs/rewards/` | `rewards.json` |

### 通用规则

- 编码: UTF-8
- 所有 ID 使用小写字母 + 下划线 (snake_case)
- 资源路径使用相对于 `assets/` 的路径（不含 `assets/` 前缀）
- 时间单位: 秒
- `duration: 0` 表示无时间限制

---

## 2. Scenario 场景配置

**文件路径**: `configs/scenarios/{scenario_id}.json`

```json
{
  "scenario_id": "subway",           // [必填] 场景唯一ID
  "name": "地铁急救",                // [必填] 场景名称（显示用）
  "description": "地铁站突发...",     // [选填] 场景描述
  "entry_story_id": "subway_story",  // [必填] 对应剧情图ID
  "background": "subway_station",    // [选填] 默认背景图资源key
  "music": "tension_bgm",           // [选填] 默认BGM资源key
  "initial_variables": {             // [选填] 初始变量
    "confidence": 50,
    "knowledge": 30,
    "time_pressure": 0
  },
  "medical_config_id": "standard_aed", // [选填] 医疗配置ID
  "maze_config_id": "subway_maze",     // [选填] 迷宫配置ID
  "difficulty": "normal"               // [选填] 难度: easy/normal/hard
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `scenario_id` | string | ✅ | 唯一标识符 |
| `name` | string | ✅ | 显示名称 |
| `description` | string | ❌ | 场景描述文本 |
| `entry_story_id` | string | ✅ | 指向剧情图配置 |
| `background` | string | ❌ | 背景图资源key |
| `music` | string | ❌ | BGM资源key |
| `initial_variables` | object | ❌ | 初始变量键值对 |
| `medical_config_id` | string | ❌ | 医疗流程配置引用 |
| `maze_config_id` | string | ❌ | 迷宫配置引用 |
| `difficulty` | string | ❌ | 难度等级 |

---

## 3. StoryGraph 剧情图配置

**文件路径**: `configs/stories/{story_id}.json`

```json
{
  "graph_id": "subway_story",        // [必填] 剧情图ID
  "start_node": "node_01",           // [必填] 起始节点ID
  "variables": {                     // [选填] 默认变量（与场景变量合并）
    "called_120": false,
    "found_aed": false
  },
  "global_conditions": [],           // [选填] 全局条件（预留）
  "end_nodes": ["end_good", "end_bad", "end_partial"],  // [必填] 结局节点列表
  "nodes": {                         // [必填] 节点字典
    "node_01": { ... },
    "node_02": { ... }
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `graph_id` | string | ✅ | 剧情图唯一ID |
| `start_node` | string | ✅ | 入口节点ID |
| `variables` | object | ❌ | 全局变量初始值 |
| `global_conditions` | array | ❌ | 全局触发条件 |
| `end_nodes` | array | ✅ | 结局节点ID列表 |
| `nodes` | object | ✅ | node_id → StoryNode 映射 |

---

## 4. StoryNode 剧情节点配置

节点是剧情图的核心单元。每个节点定义了玩家在此刻看到什么、做什么、往哪里去。

```json
{
  "node_id": "node_02",              // [必填] 节点唯一ID
  "type": "choice",                  // [必填] 节点类型
  "title": "第一反应",               // [选填] 节点标题
  "text": "你看到有人倒地...",       // [选填] 节点文本
  "video": "intro_video",            // [选填] 视频资源key
  "animation": "person_falling",     // [选填] 动画资源key
  "audio": "crowd_ambient",          // [选填] 音频资源key
  "background": "subway_station",    // [选填] 背景图资源key
  "duration": 30,                    // [选填] 时间限制(秒), 0=无限
  "choices": [],                     // [选填] 选项列表(仅choice类型)
  "actions": [],                     // [选填] 进入时触发的动作
  "exit_actions": [],                // [选填] 退出时触发的动作
  "conditions": [],                  // [选填] 节点显示条件
  "next_node": "node_03",           // [选填] 自动跳转目标
  "failure_node": "node_bad",       // [选填] 超时/失败跳转目标
  "help_topic": "first_response",   // [选填] 帮助主题ID
  "tags": ["choice", "critical"]    // [选填] 标签(用于搜索/分类)
}
```

### 节点类型 (type)

| type | 说明 | 特殊行为 |
|---|---|---|
| `video` | 视频播放节点 | 播放视频，结束后跳转 next_node |
| `text` | 文本展示节点 | 显示文本，点击继续跳转 |
| `choice` | 选择分支节点 | 显示选项按钮，等待玩家选择 |
| `minigame` | 小游戏节点 | 触发迷宫小游戏，结果决定跳转 |
| `branch` | 条件分支节点 | 根据条件自动跳转到不同节点 |
| `end` | 结局节点 | 剧情结束，进入结算 |

### Branch 节点特殊字段

branch 类型支持 `branch_conditions` 字段：

```json
{
  "type": "branch",
  "branch_conditions": [
    {
      "conditions": [
        {"type": "var_compare", "key": "confidence", "operator": "gte", "value": 60}
      ],
      "next_node": "end_good"
    },
    {
      "conditions": [
        {"type": "var_compare", "key": "time_pressure", "operator": "gte", "value": 50}
      ],
      "next_node": "end_bad"
    }
  ],
  "default_node": "end_partial"
}
```

- `branch_conditions` 按顺序评估，第一个满足条件的 `next_node` 生效
- `default_node`: 所有条件都不满足时的默认跳转

---

## 5. Choice 选项配置

仅在 `choice` 类型节点中使用。

```json
{
  "choice_id": "c02_a",              // [必填] 选项唯一ID
  "text": "立即上前查看情况",        // [必填] 选项显示文本
  "next_node": "node_03a",           // [选填] 选择后跳转的节点
  "conditions": [],                  // [选填] 显示条件(空=始终显示)
  "effects": [                       // [选填] 选择后触发的效果
    {"type": "add_var", "key": "confidence", "value": 10}
  ],
  "is_correct": true,                // [选填] 是否为正确选择
  "feedback_text": "你迅速反应！"    // [选填] 选择后的即时反馈
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `choice_id` | string | ✅ | 选项唯一标识 |
| `text` | string | ✅ | 选项按钮文本 |
| `next_node` | string | ❌ | 跳转目标节点 |
| `conditions` | array | ❌ | 显示此选项的条件 |
| `effects` | array | ❌ | 效果动作列表 |
| `is_correct` | boolean | ❌ | 是否正确（影响评分） |
| `feedback_text` | string | ❌ | 即时反馈文本 |

### 条件选项示例

某些选项只在特定条件下显示：

```json
{
  "choice_id": "c_use_aed",
  "text": "使用AED进行除颤",
  "next_node": "node_aed_use",
  "conditions": [
    {"type": "flag_set", "key": "found_aed"}
  ],
  "is_correct": true,
  "feedback_text": "使用AED是关键步骤！"
}
```

只有当 `found_aed` 标记被设置时，此选项才会出现。

---

## 6. Condition 条件配置

条件用于控制选项显示、节点可见、分支跳转等。

### 基本条件类型

#### var_compare - 变量比较
```json
{"type": "var_compare", "key": "confidence", "operator": "gte", "value": 60}
```

| operator | 说明 |
|---|---|
| `eq` | 等于 |
| `neq` | 不等于 |
| `gt` | 大于 |
| `lt` | 小于 |
| `gte` | 大于等于 |
| `lte` | 小于等于 |

#### flag_set - 标记已设置
```json
{"type": "flag_set", "key": "called_120"}
```

#### flag_not_set - 标记未设置
```json
{"type": "flag_not_set", "key": "found_aed"}
```

#### time_exceeded - 时间超限
```json
{"type": "time_exceeded", "value": 120}
```

#### step_completed - 步骤已完成
```json
{"type": "step_completed", "key": "start_cpr"}
```

### 组合条件

条件列表默认使用 AND 逻辑（所有条件都满足才算通过）。

#### AND (默认)
```json
{
  "conditions": [
    {"type": "var_compare", "key": "confidence", "operator": "gte", "value": 60},
    {"type": "flag_set", "key": "started_cpr"}
  ]
}
```

#### OR
```json
{
  "type": "or",
  "conditions": [
    {"type": "flag_set", "key": "called_120"},
    {"type": "flag_set", "key": "found_aed"}
  ]
}
```

#### NOT
```json
{
  "type": "not",
  "condition": {"type": "flag_set", "key": "completed"}
}
```

#### 嵌套组合
```json
{
  "conditions": [
    {"type": "var_compare", "key": "confidence", "operator": "gte", "value": 50},
    {
      "type": "or",
      "conditions": [
        {"type": "flag_set", "key": "started_cpr"},
        {"type": "flag_set", "key": "used_aed"}
      ]
    }
  ]
}
```

---

## 7. Action 动作配置

动作在节点进入/退出时、选项被选择时触发。

### 动作类型

| type | 必需字段 | 说明 |
|---|---|---|
| `set_var` | key, value | 设置变量值 |
| `add_var` | key, value | 增加变量值 |
| `sub_var` | key, value | 减少变量值 |
| `set_flag` | key, value | 设置标记（value通常为true） |
| `remove_flag` | key | 移除标记 |
| `play_audio` | key | 播放音频 |
| `play_video` | key | 播放视频 |
| `navigate` | key | 场景跳转 |
| `trigger_minigame` | key, params | 触发小游戏 |
| `write_record` | key, value | 写入记录 |
| `modify_patient` | key, value | 修改病人状态属性 |

### 示例

```json
"actions": [
  {"type": "add_var", "key": "confidence", "value": 10},
  {"type": "set_flag", "key": "started_cpr", "value": true},
  {"type": "modify_patient", "key": "condition_score", "value": 20},
  {"type": "play_audio", "key": "cpr_rhythm"}
]
```

---

## 8. Medical 医疗流程配置

**文件路径**: `configs/medical/{config_id}.json`

```json
{
  "config_id": "standard_aed",
  "name": "标准AED急救流程",
  "steps": [
    {
      "step_id": "confirm_scene",
      "name": "确认现场安全",
      "order": 1,
      "allowed_time": 10,
      "error_consequence": {
        "patient_damage": 5,
        "message": "未确认现场安全可能危及自身"
      },
      "state_changes": {}
    }
  ],
  "success_condition": {
    "type": "and",
    "conditions": [
      {"type": "flag_set", "key": "started_cpr"},
      {"type": "flag_set", "key": "used_aed"}
    ]
  },
  "failure_condition": {
    "type": "or",
    "conditions": [
      {"type": "var_compare", "key": "time_pressure", "operator": "gte", "value": 80}
    ]
  },
  "patient_rules": {
    "initial_state": {
      "condition_score": 30,
      "heart_rate": 0,
      "breathing": false,
      "consciousness": "unconscious"
    },
    "decay_rate": 2.0,
    "cpr_recovery": 5.0,
    "aed_recovery": 25.0
  }
}
```

### Step 字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `step_id` | string | ✅ | 步骤唯一ID |
| `name` | string | ✅ | 步骤名称 |
| `order` | int | ✅ | 执行顺序 |
| `allowed_time` | float | ✅ | 允许时间(秒), 0=无限 |
| `error_consequence` | object | ❌ | 错误后果 |
| `state_changes` | object | ❌ | 完成后的状态变更 |

---

## 9. Maze 迷宫配置

**文件路径**: `configs/difficulty/{config_id}.json`

```json
{
  "config_id": "subway_maze",
  "name": "地铁站AED迷宫",
  "difficulty": "normal",
  "size": [11, 11],
  "obstacle_ratio": 0.15,
  "time_limit": 45,
  "targets": 1,
  "start": [0, 0],
  "end": [10, 10],
  "seed": 42,
  "on_success": {
    "next_node": "node_06",
    "effects": [
      {"type": "set_flag", "key": "found_aed", "value": true},
      {"type": "add_var", "key": "confidence", "value": 10}
    ]
  },
  "on_failure": {
    "next_node": "node_05_aed_fail",
    "effects": [
      {"type": "add_var", "key": "time_pressure", "value": 25}
    ]
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `config_id` | string | ✅ | 配置唯一ID |
| `name` | string | ✅ | 迷宫名称 |
| `difficulty` | string | ✅ | 难度等级 |
| `size` | [int, int] | ✅ | 迷宫尺寸 [rows, cols] |
| `obstacle_ratio` | float | ❌ | 额外障碍比例 (0-1) |
| `time_limit` | float | ✅ | 限时(秒) |
| `targets` | int | ✅ | AED目标数量 |
| `start` | [int, int] | ❌ | 起点坐标 |
| `end` | [int, int] | ❌ | 终点坐标 |
| `seed` | int | ❌ | 随机种子(可复现) |
| `on_success` | object | ✅ | 成功回调(跳转+效果) |
| `on_failure` | object | ✅ | 失败回调(跳转+效果) |

---

## 10. Help 帮助文档配置

**文件路径**: `configs/help/help_topics.json`

```json
{
  "topics": [
    {
      "topic_id": "first_response",    // [必填] 帮助主题ID
      "title": "第一反应",             // [必填] 标题
      "content": "发现有人倒地时...",   // [必填] 内容
      "related_topics": ["call_120"]   // [选填] 关联主题ID
    }
  ]
}
```

---

## 11. Rewards 勋章奖励配置

**文件路径**: `configs/rewards/rewards.json`

```json
{
  "rewards": [
    {
      "reward_id": "first_rescue",     // [必填] 勋章ID
      "name": "初次救援",              // [必填] 名称
      "description": "完成第一次急救",  // [选填] 描述
      "icon": "medal_first",           // [选填] 图标资源key
      "condition": {                   // [必填] 解锁条件
        "type": "flag_set",
        "key": "completed_first_scenario"
      }
    }
  ]
}
```

---

## 12. 资源引用规范

所有资源通过 `key` 引用，不直接写路径。key 映射到 `assets/` 下对应目录。

| 资源类型 | 目录 | key 示例 |
|---|---|---|
| 图片 | `assets/images/` | `subway_station` |
| 背景 | `assets/backgrounds/` | `park_scene` |
| 视频 | `assets/videos/` | `subway_intro` |
| 音频 | `assets/audio/` | `tension_bgm` |
| 动画 | `assets/animations/` | `person_falling` |
| 字体 | `assets/fonts/` | `main_font` |
| UI素材 | `assets/ui/` | `btn_primary` |
| 图标 | `assets/icons/` | `medal_first` |

### 资源加载规则

1. ResourceManager 维护 key → path 的映射表
2. 映射表可通过 JSON 配置覆盖（`configs/ui/resource_map.json`）
3. 加载失败时返回占位资源并记录警告日志
4. 支持热更新：修改映射表后无需改代码

---

## 13. 完整示例

参见项目中的示例配置：
- `configs/scenarios/subway.json` - 地铁场景
- `configs/scenarios/park.json` - 公园场景
- `configs/stories/subway_story.json` - 地铁剧情图（含12个节点、3个结局）
- `configs/medical/standard_aed.json` - 标准AED急救流程
- `configs/difficulty/subway_maze.json` - 迷宫配置
- `configs/rewards/rewards.json` - 勋章奖励
- `configs/help/help_topics.json` - 帮助主题

### 扩展新场景只需3步

1. 在 `configs/scenarios/` 创建场景 JSON
2. 在 `configs/stories/` 创建剧情图 JSON
3. （可选）创建对应的医疗/迷宫配置

**无需修改任何 Python 代码。**
