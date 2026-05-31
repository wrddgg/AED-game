"""迷宫难度管理模块

根据游戏进度和配置动态调整迷宫的难度参数，
包括尺寸、时间限制和障碍物密度等。
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional

from src.core.logger import get_logger

logger = get_logger("maze_difficulty")


@dataclass
class DifficultyConfig:
    """难度配置

    Attributes:
        rows: 迷宫行数
        cols: 迷宫列数
        time_limit: 时间限制（秒），0 表示无限制
        aed_count: 迷宫中 AED 设备数量
        hint_count: 可用提示次数
        obstacle_density: 额外障碍密度（0.0~1.0），0 表示无额外障碍
    """
    rows: int = 8
    cols: int = 8
    time_limit: float = 0.0
    aed_count: int = 1
    hint_count: int = 3
    obstacle_density: float = 0.0


# 预设难度等级
DIFFICULTY_PRESETS: Dict[str, DifficultyConfig] = {
    "easy": DifficultyConfig(
        rows=6,
        cols=6,
        time_limit=0.0,
        aed_count=2,
        hint_count=5,
        obstacle_density=0.0,
    ),
    "normal": DifficultyConfig(
        rows=8,
        cols=8,
        time_limit=120.0,
        aed_count=1,
        hint_count=3,
        obstacle_density=0.0,
    ),
    "hard": DifficultyConfig(
        rows=12,
        cols=12,
        time_limit=90.0,
        aed_count=1,
        hint_count=1,
        obstacle_density=0.1,
    ),
    "expert": DifficultyConfig(
        rows=16,
        cols=16,
        time_limit=60.0,
        aed_count=1,
        hint_count=0,
        obstacle_density=0.2,
    ),
}


class MazeDifficulty:
    """迷宫难度管理器

    根据预设等级或自定义参数生成难度配置，
    也支持根据游戏进度自动递增难度。
    """

    def __init__(self, preset: str = "normal") -> None:
        """初始化难度管理器

        Args:
            preset: 预设难度名称 ("easy"/"normal"/"hard"/"expert")
        """
        self._current_level: int = 1
        self._preset_name: str = preset
        self._config: DifficultyConfig = self._get_preset(preset)

    def _get_preset(self, name: str) -> DifficultyConfig:
        """获取预设难度配置

        Args:
            name: 预设名称

        Returns:
            难度配置，不存在则返回 normal
        """
        if name in DIFFICULTY_PRESETS:
            return DifficultyConfig(**DIFFICULTY_PRESETS[name].__dict__)
        logger.warning(f"未知难度预设 '{name}'，使用 normal")
        return DifficultyConfig(**DIFFICULTY_PRESETS["normal"].__dict__)

    def get_config(self) -> DifficultyConfig:
        """获取当前难度配置。

        Returns:
            当前难度配置
        """
        return self._config

    def set_preset(self, name: str) -> None:
        """切换预设难度

        Args:
            name: 预设名称
        """
        self._preset_name = name
        self._config = self._get_preset(name)
        logger.info(f"难度切换: {name}")

    def set_custom(self, config: DifficultyConfig) -> None:
        """设置自定义难度配置

        Args:
            config: 自定义难度配置
        """
        self._config = config
        self._preset_name = "custom"
        logger.info("使用自定义难度配置")

    def advance_level(self) -> DifficultyConfig:
        """提升难度等级

        每次调用递增 level，根据 level 自动调整迷宫尺寸和参数。
        尺寸逐步增大，时间限制逐步缩短，提示次数逐步减少。

        Returns:
            新的难度配置
        """
        self._current_level += 1
        level = self._current_level

        # 基于等级计算参数
        base_rows = 6
        base_cols = 6
        growth = min(level - 1, 8)  # 最多增长8格

        rows = base_rows + growth
        cols = base_cols + growth

        # 时间限制：初始无限制，第3关开始有时间限制，逐级缩短
        if level >= 3:
            time_limit = max(30.0, 150.0 - (level - 3) * 15.0)
        else:
            time_limit = 0.0

        # 提示次数：逐级减少
        hint_count = max(0, 5 - level + 1)

        # AED数量
        aed_count = 1

        # 障碍密度：高等级增加
        obstacle_density = min(0.3, (level - 1) * 0.03)

        self._config = DifficultyConfig(
            rows=rows,
            cols=cols,
            time_limit=time_limit,
            aed_count=aed_count,
            hint_count=hint_count,
            obstacle_density=obstacle_density,
        )

        logger.info(f"难度提升: Level {level}, {rows}x{cols}, 时间 {time_limit}s")
        return self._config

    def get_current_level(self) -> int:
        """获取当前难度等级。"""
        return self._current_level

    def get_preset_name(self) -> str:
        """获取当前预设名称。"""
        return self._preset_name

    def to_dict(self) -> Dict[str, Any]:
        """序列化为字典。"""
        return {
            "level": self._current_level,
            "preset": self._preset_name,
            "rows": self._config.rows,
            "cols": self._config.cols,
            "time_limit": self._config.time_limit,
            "aed_count": self._config.aed_count,
            "hint_count": self._config.hint_count,
            "obstacle_density": self._config.obstacle_density,
        }
