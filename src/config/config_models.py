"""AED 急救互动剧情游戏 - 配置模型模块

定义配置加载后的中间数据模型，用于描述迷宫、医疗步骤、帮助主题等配置结构。
这些模型作为 JSON 原始数据与游戏运行时数据之间的桥梁。
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple


@dataclass
class MazeConfig:
    """迷宫配置

    描述迷宫小游戏的配置参数。

    Attributes:
        difficulty: 难度 (easy/normal/hard)
        size: 迷宫尺寸 (行, 列)
        targets: 目标位置列表
        time_limit: 时间限制（秒），0 表示无限
        obstacles: 障碍物位置列表
        start: 起点坐标 (行, 列)
        end: 终点坐标 (行, 列)
    """
    difficulty: str = "normal"
    size: Tuple[int, int] = (5, 5)
    targets: List[Tuple[int, int]] = field(default_factory=list)
    time_limit: float = 0.0
    obstacles: List[Tuple[int, int]] = field(default_factory=list)
    start: Tuple[int, int] = (0, 0)
    end: Tuple[int, int] = (4, 4)

    def to_dict(self) -> Dict[str, Any]:
        """将迷宫配置序列化为字典

        Returns:
            包含所有字段的字典，元组转为列表以便 JSON 序列化
        """
        return {
            "difficulty": self.difficulty,
            "size": list(self.size),
            "targets": [list(t) for t in self.targets],
            "time_limit": self.time_limit,
            "obstacles": [list(o) for o in self.obstacles],
            "start": list(self.start),
            "end": list(self.end),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "MazeConfig":
        """从字典反序列化创建 MazeConfig 实例

        Args:
            d: 包含迷宫配置的字典

        Returns:
            MazeConfig 实例
        """
        size_data = d.get("size", [5, 5])
        size = tuple(size_data) if isinstance(size_data, list) else (5, 5)

        targets_data = d.get("targets", [])
        targets = [
            tuple(t) if isinstance(t, list) else t
            for t in targets_data
        ]

        obstacles_data = d.get("obstacles", [])
        obstacles = [
            tuple(o) if isinstance(o, list) else o
            for o in obstacles_data
        ]

        start_data = d.get("start", [0, 0])
        start = tuple(start_data) if isinstance(start_data, list) else (0, 0)

        end_data = d.get("end", [4, 4])
        end = tuple(end_data) if isinstance(end_data, list) else (4, 4)

        return cls(
            difficulty=d.get("difficulty", "normal"),
            size=size,
            targets=targets,
            time_limit=d.get("time_limit", 0.0),
            obstacles=obstacles,
            start=start,
            end=end,
        )


@dataclass
class MedicalStep:
    """医疗步骤

    描述急救流程中的单个步骤。

    Attributes:
        step_id: 步骤唯一标识
        name: 步骤名称
        allowed_time: 允许用时（秒），0 表示不限
        error_consequence: 错误后果描述字典
        state_changes: 对患者状态的变更字典
    """
    step_id: str = ""
    name: str = ""
    allowed_time: float = 0.0
    error_consequence: Dict[str, Any] = field(default_factory=dict)
    state_changes: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """将医疗步骤序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "step_id": self.step_id,
            "name": self.name,
            "allowed_time": self.allowed_time,
            "error_consequence": dict(self.error_consequence),
            "state_changes": dict(self.state_changes),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "MedicalStep":
        """从字典反序列化创建 MedicalStep 实例

        Args:
            d: 包含医疗步骤的字典

        Returns:
            MedicalStep 实例
        """
        return cls(
            step_id=d.get("step_id", ""),
            name=d.get("name", ""),
            allowed_time=d.get("allowed_time", 0.0),
            error_consequence=d.get("error_consequence", {}),
            state_changes=d.get("state_changes", {}),
        )


@dataclass
class HelpTopic:
    """帮助主题

    描述一个帮助条目的内容。

    Attributes:
        topic_id: 主题唯一标识
        title: 主题标题
        content: 主题内容
        related_topics: 相关主题 ID 列表
    """
    topic_id: str = ""
    title: str = ""
    content: str = ""
    related_topics: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """将帮助主题序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "topic_id": self.topic_id,
            "title": self.title,
            "content": self.content,
            "related_topics": list(self.related_topics),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "HelpTopic":
        """从字典反序列化创建 HelpTopic 实例

        Args:
            d: 包含帮助主题的字典

        Returns:
            HelpTopic 实例
        """
        return cls(
            topic_id=d.get("topic_id", ""),
            title=d.get("title", ""),
            content=d.get("content", ""),
            related_topics=d.get("related_topics", []),
        )
