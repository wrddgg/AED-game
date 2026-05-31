"""AED 急救互动剧情游戏 - 记录数据模块

定义游戏记录、奖励和排行榜相关的数据结构：
- GameRecord: 游戏记录，包含场景完成后的所有数据
- RewardData: 奖励数据，描述可解锁的成就/奖励
- LeaderboardEntry: 排行榜条目

所有数据类支持序列化(to_dict)和反序列化(from_dict)。
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class GameRecord:
    """游戏记录

    记录一次场景游玩的完整数据，用于存档和历史查看。

    Attributes:
        record_id: 记录唯一标识
        scenario_id: 场景 ID
        start_time: 开始时间（时间戳）
        end_time: 结束时间（时间戳）
        result: 结果 (success/failure/partial)
        score: 得分
        choices_made: 已做出的选择列表
        time_taken: 用时（秒）
        patient_final_state: 患者最终状态
        mistakes: 失误列表
        ending_node: 结束节点 ID
    """
    record_id: str = ""
    scenario_id: str = ""
    start_time: float = 0.0
    end_time: float = 0.0
    result: str = ""
    score: int = 0
    choices_made: List[str] = field(default_factory=list)
    time_taken: float = 0.0
    patient_final_state: Dict[str, Any] = field(default_factory=dict)
    mistakes: List[str] = field(default_factory=list)
    ending_node: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """将游戏记录序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "record_id": self.record_id,
            "scenario_id": self.scenario_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "result": self.result,
            "score": self.score,
            "choices_made": list(self.choices_made),
            "time_taken": self.time_taken,
            "patient_final_state": dict(self.patient_final_state),
            "mistakes": list(self.mistakes),
            "ending_node": self.ending_node,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "GameRecord":
        """从字典反序列化创建 GameRecord 实例

        Args:
            d: 包含游戏记录数据的字典

        Returns:
            GameRecord 实例
        """
        return cls(
            record_id=d.get("record_id", ""),
            scenario_id=d.get("scenario_id", ""),
            start_time=d.get("start_time", 0.0),
            end_time=d.get("end_time", 0.0),
            result=d.get("result", ""),
            score=d.get("score", 0),
            choices_made=d.get("choices_made", []),
            time_taken=d.get("time_taken", 0.0),
            patient_final_state=d.get("patient_final_state", {}),
            mistakes=d.get("mistakes", []),
            ending_node=d.get("ending_node", ""),
        )


@dataclass
class RewardData:
    """奖励数据

    描述一个可解锁的成就或奖励。

    Attributes:
        reward_id: 奖励唯一标识
        name: 奖励名称
        description: 奖励描述
        icon: 图标资源路径
        condition: 解锁条件字典
        unlocked: 是否已解锁
        unlocked_time: 解锁时间（时间戳）
    """
    reward_id: str = ""
    name: str = ""
    description: str = ""
    icon: str = ""
    condition: Dict[str, Any] = field(default_factory=dict)
    unlocked: bool = False
    unlocked_time: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """将奖励数据序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "reward_id": self.reward_id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "condition": dict(self.condition),
            "unlocked": self.unlocked,
            "unlocked_time": self.unlocked_time,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "RewardData":
        """从字典反序列化创建 RewardData 实例

        Args:
            d: 包含奖励数据的字典

        Returns:
            RewardData 实例
        """
        return cls(
            reward_id=d.get("reward_id", ""),
            name=d.get("name", ""),
            description=d.get("description", ""),
            icon=d.get("icon", ""),
            condition=d.get("condition", {}),
            unlocked=d.get("unlocked", False),
            unlocked_time=d.get("unlocked_time", 0.0),
        )


@dataclass
class LeaderboardEntry:
    """排行榜条目

    Attributes:
        player_name: 玩家名称
        score: 得分
        scenario_id: 场景 ID
        timestamp: 记录时间（时间戳）
    """
    player_name: str = ""
    score: int = 0
    scenario_id: str = ""
    timestamp: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """将排行榜条目序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "player_name": self.player_name,
            "score": self.score,
            "scenario_id": self.scenario_id,
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "LeaderboardEntry":
        """从字典反序列化创建 LeaderboardEntry 实例

        Args:
            d: 包含排行榜条目数据的字典

        Returns:
            LeaderboardEntry 实例
        """
        return cls(
            player_name=d.get("player_name", ""),
            score=d.get("score", 0),
            scenario_id=d.get("scenario_id", ""),
            timestamp=d.get("timestamp", 0.0),
        )
