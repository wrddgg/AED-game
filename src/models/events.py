"""AED 急救互动剧情游戏 - 事件定义模块

定义游戏中所有事件类型，用于事件总线(EventBus)的发布/订阅机制。
所有事件类均基于 BaseEvent，携带时间戳和事件类型标识。
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional
import time


@dataclass
class BaseEvent:
    """事件基类，所有事件继承此类"""
    timestamp: float = field(default_factory=time.time)

    @property
    def event_type(self) -> str:
        return self.__class__.__name__


@dataclass
class GameStartedEvent(BaseEvent):
    """游戏启动事件"""
    pass


@dataclass
class GamePausedEvent(BaseEvent):
    """游戏暂停事件"""
    pass


@dataclass
class GameResumedEvent(BaseEvent):
    """游戏恢复事件"""
    pass


@dataclass
class SceneChangedEvent(BaseEvent):
    """场景切换事件

    Attributes:
        scene_id: 目标场景 ID
        params: 传递给新场景的参数
    """
    scene_id: str = ""
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StoryNodeEnteredEvent(BaseEvent):
    """剧情节点进入事件

    Attributes:
        node_id: 进入的节点 ID
        node_type: 节点类型 (video/text/choice/minigame/branch/end)
    """
    node_id: str = ""
    node_type: str = ""


@dataclass
class StoryChoiceSelectedEvent(BaseEvent):
    """剧情选项被选中事件

    Attributes:
        choice_id: 选中的选项 ID
        node_id: 选项所在的节点 ID
    """
    choice_id: str = ""
    node_id: str = ""


@dataclass
class VariableChangedEvent(BaseEvent):
    """剧情变量变更事件

    Attributes:
        key: 变量名
        old_value: 变更前的值
        new_value: 变更后的值
    """
    key: str = ""
    old_value: Any = None
    new_value: Any = None


@dataclass
class MiniGameStartedEvent(BaseEvent):
    """小游戏开始事件

    Attributes:
        game_type: 小游戏类型
        config: 小游戏配置
    """
    game_type: str = ""
    config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MiniGameCompletedEvent(BaseEvent):
    """小游戏完成事件

    Attributes:
        game_type: 小游戏类型
        success: 是否成功
        score: 得分
    """
    game_type: str = ""
    success: bool = False
    score: int = 0


@dataclass
class TimerTimeoutEvent(BaseEvent):
    """计时器超时事件

    Attributes:
        timer_id: 超时的计时器 ID
    """
    timer_id: str = ""


@dataclass
class PatientStateChangedEvent(BaseEvent):
    """患者状态变更事件

    Attributes:
        attribute: 变更的属性名
        old_value: 变更前的值
        new_value: 变更后的值
    """
    attribute: str = ""
    old_value: Any = None
    new_value: Any = None


@dataclass
class ScenarioCompletedEvent(BaseEvent):
    """场景完成事件

    Attributes:
        scenario_id: 完成的场景 ID
        result: 结果 (success/failure/partial)
    """
    scenario_id: str = ""
    result: str = ""


@dataclass
class RecordSavedEvent(BaseEvent):
    """记录保存事件

    Attributes:
        record_id: 保存的记录 ID
    """
    record_id: str = ""


@dataclass
class RescueStepAdvancedEvent(BaseEvent):
    """急救步骤推进事件

    Attributes:
        step_id: 推进到的步骤 ID
    """
    step_id: str = ""


@dataclass
class RescueStepFailedEvent(BaseEvent):
    """急救步骤失败事件

    Attributes:
        step_id: 失败的步骤 ID
        reason: 失败原因
    """
    step_id: str = ""
    reason: str = ""
