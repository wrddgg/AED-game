"""AED 急救互动剧情游戏 - 场景数据模块

定义 ScenarioData 数据类，描述一个完整的急救场景配置，
包括场景标识、名称、入口剧情、背景、音乐、初始变量、医疗/迷宫配置等。
支持序列化和反序列化，便于从 JSON 配置加载。
"""

from dataclasses import dataclass, field
from typing import Dict, Any


@dataclass
class ScenarioData:
    """场景数据

    Attributes:
        scenario_id: 场景唯一标识
        name: 场景名称
        entry_story_id: 入口剧情图 ID
        background: 背景图片资源路径
        music: 背景音乐资源路径
        initial_variables: 场景初始变量
        medical_config_id: 医疗流程配置 ID
        maze_config_id: 迷宫难度配置 ID
        description: 场景描述
        difficulty: 难度 (easy/normal/hard)
    """
    scenario_id: str = ""
    name: str = ""
    entry_story_id: str = ""
    background: str = ""
    music: str = ""
    initial_variables: Dict[str, Any] = field(default_factory=dict)
    medical_config_id: str = ""
    maze_config_id: str = ""
    description: str = ""
    difficulty: str = "normal"

    def to_dict(self) -> Dict[str, Any]:
        """将场景数据序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "entry_story_id": self.entry_story_id,
            "background": self.background,
            "music": self.music,
            "initial_variables": dict(self.initial_variables),
            "medical_config_id": self.medical_config_id,
            "maze_config_id": self.maze_config_id,
            "description": self.description,
            "difficulty": self.difficulty,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ScenarioData":
        """从字典反序列化创建 ScenarioData 实例

        Args:
            d: 包含场景数据的字典

        Returns:
            ScenarioData 实例
        """
        return cls(
            scenario_id=d.get("scenario_id", ""),
            name=d.get("name", ""),
            entry_story_id=d.get("entry_story_id", ""),
            background=d.get("background", ""),
            music=d.get("music", ""),
            initial_variables=d.get("initial_variables", {}),
            medical_config_id=d.get("medical_config_id", ""),
            maze_config_id=d.get("maze_config_id", ""),
            description=d.get("description", ""),
            difficulty=d.get("difficulty", "normal"),
        )
