# AED 急救互动剧情游戏

面向手机端的 AED 急救互动剧情游戏，玩法风格参考《隐形守护者》——视频 + 选择 + 分支 + 多结局。核心特点：**强配置驱动**，通过 JSON 导入控制剧情跳转、视频/动画播放、分支逻辑。

## 项目状态

**当前阶段：框架搭建 v0.1.0** — 可运行的框架底座已就绪，可开始填充内容。

## 技术栈

- **语言**: Python 3.10+
- **UI 框架**: Kivy + KivyMD
- **架构**: 数据驱动 + 接口解耦 + 事件总线
- **适配**: Android 优先

## 项目结构

```text
project/
├── app.py                  # 应用入口
├── requirements.txt        # Python 依赖
├── assets/                 # 资源文件 (images/videos/audio/...)
├── configs/                # JSON 配置文件
│   ├── scenarios/          #   场景配置
│   ├── stories/            #   剧情图配置
│   ├── medical/            #   医疗流程配置
│   ├── difficulty/         #   迷宫难度配置
│   ├── rewards/            #   勋章奖励配置
│   └── help/               #   帮助文档配置
├── data/                   # 运行时数据 (saves/history/cache)
├── docs/                   # 文档
│   ├── api/                #   接口说明
│   ├── config_schema/      #   JSON 配置格式说明
│   └── architecture/       #   架构说明
└── src/                    # 源代码
    ├── core/               # 核心层 (EventBus, SceneRouter, Timer, Save...)
    ├── config/             # 配置层 (ConfigLoader, Validator, Parsers)
    ├── story/              # 剧情引擎 (StoryEngine, Choice, Condition, Action)
    ├── rescue/             # 急救流程 (RescueFlow, PatientState, RuleEngine)
    ├── minigames/maze/     # 迷宫小游戏 (MazeGame, Generator, Controller)
    ├── ui/                 # UI层 (9 Screens + Widgets + Dialogs)
    ├── services/           # 服务层 (排行榜/勋章/历史/埋点)
    ├── models/             # 数据模型 (dataclass)
    └── utils/              # 工具类
```

## 文档

| 文档 | 路径 | 说明 |
|---|---|---|
| 接口说明 | [docs/api/interface_spec.md](docs/api/interface_spec.md) | 全部接口定义、方法、参数、依赖 |
| JSON配置说明 | [docs/config_schema/story_schema.md](docs/config_schema/story_schema.md) | 所有 JSON 配置格式、字段说明、示例 |
| 架构说明 | [docs/architecture/overview.md](docs/architecture/overview.md) | 分层架构、模块关系、数据流、主流程 |

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 运行应用
python app.py
```

## 核心特性

### 强配置驱动
- 通过修改 JSON 即可改变剧情跳转、视频播放、选项分支
- 不用改 Python 代码也能扩展剧情内容
- 支持 AND/OR/NOT 嵌套条件表达式

### 节点类型
| 类型 | 说明 |
|---|---|
| `video` | 视频播放，结束后自动跳转 |
| `text` | 文本展示，等待点击继续 |
| `choice` | 分支选择，显示选项按钮 |
| `minigame` | 触发迷宫小游戏 |
| `branch` | 条件分支，自动跳转 |
| `end` | 结局节点，进入结算 |

### JSON 配置示例
详见 `configs/` 目录：
- `scenarios/subway.json` — 地铁急救场景
- `stories/subway_story.json` — 完整剧情图（12节点+3结局）
- `medical/standard_aed.json` — 标准AED急救流程

## 设计原则

- **JSON 数据驱动**：所有剧情逻辑来自配置，不硬编码
- **接口解耦**：模块间通过接口和事件总线通信
- **UI 层纯净**：UI 只负责展示和输入
- **资源统一管理**：通过 key 引用资源，路径可配置
- **框架优先**：先搭好底座，再填内容

## 代码统计

- **Python 文件**: 65 个
- **接口/核心类**: 30+ 个
- **数据模型**: 12+ 个 dataclass
- **事件类型**: 15 个
- **UI 场景**: 9 个
- **JSON 配置示例**: 6 个
