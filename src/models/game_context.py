"""AED 急救互动剧情游戏 - 游戏上下文模块

定义 GameContext 数据类，用于存储游戏运行时的全部状态信息，
包括当前场景、剧情变量、患者状态、分数等。
支持序列化(to_dict)和反序列化(from_dict)，便于存档和读档。
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Any


@dataclass
class GameContext:
    """游戏运行时上下文

    Attributes:
        scenario_id: 当前场景 ID
        current_node_id: 当前剧情节点 ID
        variables: 剧情变量字典
        patient_state: 患者状态字典
        score: 当前得分
        elapsed_time: 已用时间（秒）
        choices_made: 已做出的选择列表
        flags: 已解锁标记集合
        game_running: 游戏是否正在运行
        paused: 游戏是否暂停
    """
    scenario_id: str = ""
    current_node_id: str = ""
    variables: Dict[str, Any] = field(default_factory=dict)
    patient_state: Dict[str, Any] = field(default_factory=dict)
    score: int = 0
    elapsed_time: float = 0.0
    choices_made: List[str] = field(default_factory=list)
    flags: Set[str] = field(default_factory=set)
    game_running: bool = False
    paused: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """将游戏上下文序列化为字典

        Returns:
            包含所有字段的字典，flags 转为列表以便 JSON 序列化
        """
        return {
            "scenario_id": self.scenario_id,
            "current_node_id": self.current_node_id,
            "variables": dict(self.variables),
            "patient_state": dict(self.patient_state),
            "score": self.score,
            "elapsed_time": self.elapsed_time,
            "choices_made": list(self.choices_made),
            "flags": list(self.flags),
            "game_running": self.game_running,
            "paused": self.paused,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "GameContext":
        """从字典反序列化创建 GameContext 实例

        Args:
            d: 包含游戏上下文数据的字典

        Returns:
            GameContext 实例
        """
        flags_data = d.get("flags", [])
        if isinstance(flags_data, list):
            flags = set(flags_data)
        elif isinstance(flags_data, set):
            flags = flags_data
        else:
            flags = set()

        return cls(
            scenario_id=d.get("scenario_id", ""),
            current_node_id=d.get("current_node_id", ""),
            variables=d.get("variables", {}),
            patient_state=d.get("patient_state", {}),
            score=d.get("score", 0),
            elapsed_time=d.get("elapsed_time", 0.0),
            choices_made=d.get("choices_made", []),
            flags=flags,
            game_running=d.get("game_running", False),
            paused=d.get("paused", False),
        )

    def get_variable(self, key: str, default: Any = None) -> Any:
        """获取剧情变量值

        Args:
            key: 变量名
            default: 默认值

        Returns:
            变量值，不存在则返回默认值
        """
        return self.variables.get(key, default)

    def set_variable(self, key: str, value: Any) -> None:
        """设置剧情变量值

        Args:
            key: 变量名
            value: 变量值
        """
        self.variables[key] = value

    def has_flag(self, flag: str) -> bool:
        """检查是否拥有指定标记

        Args:
            flag: 标记名

        Returns:
            是否拥有该标记
        """
        return flag in self.flags

    def set_flag(self, flag: str) -> None:
        """设置标记

        Args:
            flag: 标记名
        """
        self.flags.add(flag)

    def remove_flag(self, flag: str) -> None:
        """移除标记

        Args:
            flag: 标记名
        """
        self.flags.discard(flag)

    def add_choice(self, choice_id: str) -> None:
        """记录已做出的选择

        Args:
            choice_id: 选项 ID
        """
        self.choices_made.append(choice_id)

    def get_patient_attribute(self, attribute: str, default: Any = None) -> Any:
        """获取患者状态属性

        Args:
            attribute: 属性名
            default: 默认值

        Returns:
            属性值，不存在则返回默认值
        """
        return self.patient_state.get(attribute, default)

    def set_patient_attribute(self, attribute: str, value: Any) -> None:
        """设置患者状态属性

        Args:
            attribute: 属性名
            value: 属性值
        """
        self.patient_state[attribute] = value
