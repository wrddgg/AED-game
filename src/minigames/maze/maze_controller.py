"""迷宫控制器模块

管理迷宫游戏的运行时状态，包括玩家位置移动、碰撞检测、
路径验证和游戏状态判断。
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from src.core.logger import get_logger
from src.minigames.maze.maze_generator import MazeCell, MazeGenerator

logger = get_logger("maze_controller")

# 方向定义: 上、右、下、左
DIRECTIONS: List[Tuple[int, int]] = [(-1, 0), (0, 1), (1, 0), (0, -1)]


@dataclass
class PlayerState:
    """玩家状态

    Attributes:
        row: 当前行
        col: 当前列
        steps: 已走步数
        path: 移动路径记录
    """
    row: int = 0
    col: int = 0
    steps: int = 0
    path: List[Tuple[int, int]] = field(default_factory=list)


class MazeController:
    """迷宫控制器

    管理迷宫的生成、玩家移动、碰撞检测和胜负判断。
    """

    def __init__(
        self,
        rows: int = 10,
        cols: int = 10,
        seed: Optional[int] = None,
    ) -> None:
        """初始化迷宫控制器

        Args:
            rows: 迷宫行数
            cols: 迷宫列数
            seed: 随机种子
        """
        self._rows = rows
        self._cols = cols
        self._generator = MazeGenerator(rows, cols, seed)
        self._grid: List[List[MazeCell]] = []
        self._player = PlayerState()
        self._target: Tuple[int, int] = (rows - 1, cols - 1)
        self._completed = False
        self._started = False

    def start(self) -> None:
        """开始迷宫游戏，生成迷宫并初始化玩家位置。"""
        self._grid = self._generator.generate()
        self._player = PlayerState(row=0, col=0, steps=0, path=[(0, 0)])
        self._target = (self._rows - 1, self._cols - 1)
        self._completed = False
        self._started = True
        logger.info(f"迷宫游戏开始: {self._rows}x{self._cols}")

    def move(self, direction: int) -> bool:
        """向指定方向移动玩家

        Args:
            direction: 方向索引 (0=上, 1=右, 2=下, 3=左)

        Returns:
            是否移动成功（没有撞墙）
        """
        if not self._started or self._completed:
            return False

        if direction < 0 or direction >= len(DIRECTIONS):
            return False

        cell = self._grid[self._player.row][self._player.col]

        # 检查是否有墙
        if cell.has_wall(direction):
            logger.debug(f"撞墙: 方向 {direction}")
            return False

        dr, dc = DIRECTIONS[direction]
        new_row = self._player.row + dr
        new_col = self._player.col + dc

        # 边界检查
        if not (0 <= new_row < self._rows and 0 <= new_col < self._cols):
            return False

        self._player.row = new_row
        self._player.col = new_col
        self._player.steps += 1
        self._player.path.append((new_row, new_col))

        # 检查是否到达目标
        if (new_row, new_col) == self._target:
            self._completed = True
            logger.info(f"迷宫完成! 步数: {self._player.steps}")

        return True

    def move_up(self) -> bool:
        """向上移动。"""
        return self.move(0)

    def move_right(self) -> bool:
        """向右移动。"""
        return self.move(1)

    def move_down(self) -> bool:
        """向下移动。"""
        return self.move(2)

    def move_left(self) -> bool:
        """向左移动。"""
        return self.move(3)

    def is_completed(self) -> bool:
        """检查迷宫是否已完成。"""
        return self._completed

    def get_player_position(self) -> Tuple[int, int]:
        """获取玩家当前位置。"""
        return (self._player.row, self._player.col)

    def get_player_steps(self) -> int:
        """获取玩家已走步数。"""
        return self._player.steps

    def get_player_path(self) -> List[Tuple[int, int]]:
        """获取玩家移动路径。"""
        return list(self._player.path)

    def get_target(self) -> Tuple[int, int]:
        """获取目标位置。"""
        return self._target

    def get_grid(self) -> List[List[MazeCell]]:
        """获取迷宫网格。"""
        return self._grid

    def get_rows(self) -> int:
        """获取迷宫行数。"""
        return self._rows

    def get_cols(self) -> int:
        """获取迷宫列数。"""
        return self._cols

    def reset(self) -> None:
        """重置玩家位置到起点，不重新生成迷宫。"""
        self._player = PlayerState(row=0, col=0, steps=0, path=[(0, 0)])
        self._completed = False
        logger.debug("玩家位置已重置")

    def to_dict(self) -> dict:
        """将控制器状态序列化为字典。

        Returns:
            状态字典
        """
        return {
            "rows": self._rows,
            "cols": self._cols,
            "player_row": self._player.row,
            "player_col": self._player.col,
            "player_steps": self._player.steps,
            "player_path": list(self._player.path),
            "target": list(self._target),
            "completed": self._completed,
        }
