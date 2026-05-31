"""病人状态管理模块。

管理急救场景中病人的生命体征和状态变化，包括心率、呼吸、意识等级、
病情评分等。支持状态衰减、伤害和恢复计算。
"""

from __future__ import annotations

import copy
from typing import Any, Optional


# 病情等级列表，从最差到最好
CONDITION_LEVELS: list[str] = ["dead", "critical", "deteriorating", "unstable", "stable", "recovering"]

# 每个病情等级对应的分数区间
CONDITION_SCORE_MAP: dict[str, tuple[float, float]] = {
    "dead": (0, 0),
    "critical": (1, 25),
    "deteriorating": (26, 45),
    "unstable": (46, 65),
    "stable": (66, 85),
    "recovering": (86, 100),
}


class PatientState:
    """病人状态类，追踪和管理急救场景中病人的生命体征。

    Attributes:
        condition_score: 病情评分，0-100，越高越好
        decay_rate: 状态随时间衰减的速率
    """

    DEFAULT_STATE: dict[str, Any] = {
        "heart_rate": 0,
        "breathing": False,
        "consciousness": "unconscious",
        "time_elapsed": 0,
        "condition": "critical",
    }

    def __init__(self, initial_state: Optional[dict] = None) -> None:
        """初始化病人状态。

        Args:
            initial_state: 初始状态字典，为 None 时使用默认值
        """
        base = copy.deepcopy(self.DEFAULT_STATE)
        if initial_state is not None:
            base.update(initial_state)
        self._state: dict[str, Any] = base
        self.condition_score: float = self._condition_from_label(self._state.get("condition", "critical"))
        self.decay_rate: float = 2.0  # 每秒衰减分数

    # ---------- 公开接口 ----------

    def get_state(self) -> dict:
        """返回当前状态的深拷贝。"""
        return copy.deepcopy(self._state)

    def apply_damage(self, amount: float) -> None:
        """对病人施加伤害，降低 condition_score 并恶化状态。

        Args:
            amount: 伤害量（正值扣减分数）
        """
        self.condition_score = max(0.0, self.condition_score - abs(amount))
        self._sync_state_from_score()

    def apply_recovery(self, amount: float) -> None:
        """对病人施加恢复，提高 condition_score 并改善状态。

        Args:
            amount: 恢复量（正值增加分数）
        """
        self.condition_score = min(100.0, self.condition_score + abs(amount))
        self._sync_state_from_score()

    def set_state(self, state: dict) -> None:
        """批量设置病人状态。

        Args:
            state: 要设置的状态字典
        """
        self._state.update(state)
        if "condition" in state:
            self.condition_score = self._condition_from_label(state["condition"])
        else:
            self._sync_state_from_score()

    def is_dead(self) -> bool:
        """判断病人是否已死亡（condition_score <= 0）。"""
        return self.condition_score <= 0

    def is_stable(self) -> bool:
        """判断病人状态是否稳定（condition 为 stable 或 recovering）。"""
        return self._state.get("condition") in ("stable", "recovering")

    def get_condition_score(self) -> float:
        """获取当前病情评分，0-100。"""
        return self.condition_score

    def decay(self, delta_time: float) -> None:
        """随时间衰减病人状态。

        根据衰减速率降低 condition_score，若病人已死亡则不再衰减。

        Args:
            delta_time: 经过的时间（秒）
        """
        if self.is_dead():
            return
        self.condition_score = max(0.0, self.condition_score - self.decay_rate * delta_time)
        self._state["time_elapsed"] = self._state.get("time_elapsed", 0) + delta_time
        self._sync_state_from_score()

    def to_dict(self) -> dict:
        """将病人状态序列化为字典。"""
        result = self.get_state()
        result["condition_score"] = self.condition_score
        return result

    @classmethod
    def from_dict(cls, data: dict) -> PatientState:
        """从字典反序列化创建 PatientState 实例。

        Args:
            data: 序列化的状态字典

        Returns:
            新的 PatientState 实例
        """
        score = data.pop("condition_score", None)
        state = cls(data)
        if score is not None:
            state.condition_score = score
            state._sync_state_from_score()
        return state

    # ---------- 内部方法 ----------

    def _condition_from_label(self, label: str) -> float:
        """将病情标签转换为对应的分数中值。

        Args:
            label: 病情等级标签

        Returns:
            对应分数区间的中值
        """
        if label in CONDITION_SCORE_MAP:
            low, high = CONDITION_SCORE_MAP[label]
            return (low + high) / 2
        return 12.5  # 默认 critical 中值

    def _sync_state_from_score(self) -> None:
        """根据 condition_score 同步更新状态字典中的 condition 字段。"""
        if self.condition_score <= 0:
            self._state["condition"] = "dead"
            self._state["heart_rate"] = 0
            self._state["breathing"] = False
            self._state["consciousness"] = "unconscious"
            return

        condition = "critical"
        for label in CONDITION_LEVELS:
            low, high = CONDITION_SCORE_MAP[label]
            if low <= self.condition_score <= high:
                condition = label
                break
        self._state["condition"] = condition

        # 根据状态更新相关体征
        if condition in ("stable", "recovering"):
            self._state["breathing"] = True
            self._state["heart_rate"] = max(self._state.get("heart_rate", 0), 60)
            self._state["consciousness"] = "conscious"
        elif condition == "unstable":
            self._state["breathing"] = True
            self._state["heart_rate"] = max(self._state.get("heart_rate", 0), 40)
            self._state["consciousness"] = "semi-conscious"
