"""迷宫游戏主模块

整合迷宫生成、控制器、难度管理和 AED 目标系统，
提供完整的迷宫小游戏逻辑接口。
"""

import random
from typing import Any, Callable, Dict, List, Optional, Tuple

from src.core.event_bus import EventBus
from src.core.logger import get_logger
from src.minigames.maze.aed_target_system import AEDTargetSystem
from src.minigames.maze.maze_controller import MazeController
from src.minigames.maze.maze_difficulty import DifficultyConfig, MazeDifficulty

logger = get_logger("maze_game")


class MazeGame:
    """迷宫游戏

    整合迷宫子系统，提供统一的游戏流程控制接口。
    支持开始、暂停、恢复、移动、提示等操作。
    """

    def __init__(self, event_bus: Optional[EventBus] = None) -> None:
        """初始化迷宫游戏

        Args:
            event_bus: 事件总线，用于发布游戏事件
        """
        self._event_bus = event_bus
        self._difficulty = MazeDifficulty()
        self._controller: Optional[MazeController] = None
        self._aed_system = AEDTargetSystem()
        self._running = False
        self._paused = False
        self._elapsed_time: float = 0.0
        self._hints_remaining: int = 3
        self._on_complete: Optional[Callable[[bool, int], None]] = None

    def start(
        self,
        difficulty_preset: str = "normal",
        on_complete: Optional[Callable[[bool, int], None]] = None,
    ) -> None:
        """开始迷宫游戏

        Args:
            difficulty_preset: 难度预设名称
            on_complete: 游戏完成回调 (success, steps)
        """
        self._difficulty.set_preset(difficulty_preset)
        config = self._difficulty.get_config()

        self._controller = MazeController(
            rows=config.rows,
            cols=config.cols,
        )
        self._controller.start()

        # 放置 AED 设备
        aed_positions = self._generate_aed_positions(config)
        self._aed_system.place_devices(aed_positions, "standard")

        self._hints_remaining = config.hint_count
        self._elapsed_time = 0.0
        self._running = True
        self._paused = False
        self._on_complete = on_complete

        if self._event_bus:
            self._event_bus.publish(
                "minigame_started",
                game_type="maze",
                difficulty=difficulty_preset,
            )

        logger.info(f"迷宫游戏开始: {config.rows}x{config.cols}, 难度: {difficulty_preset}")

    def _generate_aed_positions(self, config: DifficultyConfig) -> List[Tuple[int, int]]:
        """生成 AED 设备的随机放置位置

        避免放在起点 (0,0) 和终点附近。

        Args:
            config: 难度配置

        Returns:
            AED 位置列表
        """
        positions: List[Tuple[int, int]] = []
        rows, cols = config.rows, config.cols
        count = config.aed_count

        # 候选位置：排除起点和终点
        candidates = [
            (r, c)
            for r in range(rows)
            for c in range(cols)
            if not (r == 0 and c == 0)
            and not (r == rows - 1 and c == cols - 1)
        ]

        random.shuffle(candidates)
        for i in range(min(count, len(candidates))):
            positions.append(candidates[i])

        return positions

    def move(self, direction: int) -> bool:
        """玩家移动

        Args:
            direction: 方向索引 (0=上, 1=右, 2=下, 3=左)

        Returns:
            是否移动成功
        """
        if not self._running or self._paused or self._controller is None:
            return False

        success = self._controller.move(direction)
        if success and self._controller.is_completed():
            self._complete(success=True)

        return success

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

    def pick_up_aed(self) -> bool:
        """拾取当前位置的 AED

        Returns:
            是否拾取成功
        """
        if not self._running or self._paused or self._controller is None:
            return False

        row, col = self._controller.get_player_position()
        return self._aed_system.pick_up(row, col)

    def use_aed(self) -> bool:
        """使用携带的 AED

        Returns:
            是否使用成功
        """
        if not self._running or self._paused:
            return False

        return self._aed_system.use_aed()

    def use_hint(self) -> Optional[Tuple[int, int]]:
        """使用提示，返回下一步建议的移动方向目标坐标

        使用 BFS 寻找到 AED 或终点的最短路径上的下一步。

        Returns:
            建议移动到的 (row, col)，无提示次数时返回 None
        """
        if not self._running or self._paused or self._controller is None:
            return None

        if self._hints_remaining <= 0:
            logger.debug("提示次数已用完")
            return None

        self._hints_remaining -= 1
        player_pos = self._controller.get_player_position()

        # 决定目标：优先找最近的未发现AED，否则找终点
        target = self._find_nearest_target(player_pos)
        if target is None:
            return None

        next_step = self._find_next_step(player_pos, target)
        if next_step:
            logger.debug(f"提示: 下一步移动到 {next_step}")

        return next_step

    def _find_nearest_target(self, from_pos: Tuple[int, int]) -> Optional[Tuple[int, int]]:
        """找到最近的目标位置（AED 或终点）

        Args:
            from_pos: 起始位置

        Returns:
            最近目标位置
        """
        if self._controller is None:
            return None

        # 如果没有携带 AED，先找 AED
        if not self._aed_system.has_aed():
            undiscovered = self._aed_system.get_undiscovered_devices()
            if undiscovered:
                # 找曼哈顿距离最近的
                nearest = min(
                    undiscovered,
                    key=lambda d: abs(d.row - from_pos[0]) + abs(d.col - from_pos[1]),
                )
                return (nearest.row, nearest.col)

        # 否则找终点
        return self._controller.get_target()

    def _find_next_step(
        self, from_pos: Tuple[int, int], target: Tuple[int, int]
    ) -> Optional[Tuple[int, int]]:
        """使用 BFS 找到从 from_pos 到 target 的最短路径的第一步

        Args:
            from_pos: 起始位置
            target: 目标位置

        Returns:
            第一步的坐标
        """
        if self._controller is None:
            return None

        from collections import deque

        grid = self._controller.get_grid()
        rows = self._controller.get_rows()
        cols = self._controller.get_cols()
        directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # 上右下左

        visited: set = {from_pos}
        queue: deque = deque()
        # 存储 (当前位置, 第一步)
        for dir_idx, (dr, dc) in enumerate(directions):
            cell = grid[from_pos[0]][from_pos[1]]
            if not cell.has_wall(dir_idx):
                nr, nc = from_pos[0] + dr, from_pos[1] + dc
                if 0 <= nr < rows and 0 <= nc < cols:
                    next_pos = (nr, nc)
                    if next_pos == target:
                        return next_pos
                    visited.add(next_pos)
                    queue.append((next_pos, next_pos))

        while queue:
            current, first_step = queue.popleft()
            if current == target:
                return first_step

            for dir_idx, (dr, dc) in enumerate(directions):
                cell = grid[current[0]][current[1]]
                if not cell.has_wall(dir_idx):
                    nr, nc = current[0] + dr, current[1] + dc
                    next_pos = (nr, nc)
                    if 0 <= nr < rows and 0 <= nc < cols and next_pos not in visited:
                        visited.add(next_pos)
                        queue.append((next_pos, first_step))

        return None

    def tick(self, delta_time: float) -> None:
        """每帧更新，推进计时

        Args:
            delta_time: 距上一帧的时间间隔（秒）
        """
        if not self._running or self._paused:
            return

        self._elapsed_time += delta_time

        config = self._difficulty.get_config()
        if config.time_limit > 0 and self._elapsed_time >= config.time_limit:
            self._complete(success=False)

    def pause(self) -> None:
        """暂停游戏。"""
        if self._running and not self._paused:
            self._paused = True
            logger.debug("迷宫游戏暂停")

    def resume(self) -> None:
        """恢复游戏。"""
        if self._running and self._paused:
            self._paused = False
            logger.debug("迷宫游戏恢复")

    def _complete(self, success: bool) -> None:
        """游戏完成处理

        Args:
            success: 是否成功
        """
        self._running = False
        steps = self._controller.get_player_steps() if self._controller else 0

        if self._event_bus:
            self._event_bus.publish(
                "minigame_completed",
                game_type="maze",
                success=success,
                score=steps,
            )

        if self._on_complete:
            self._on_complete(success, steps)

        result = "成功" if success else "失败"
        logger.info(f"迷宫游戏完成: {result}, 步数: {steps}, 用时: {self._elapsed_time:.1f}s")

    def is_running(self) -> bool:
        """游戏是否运行中。"""
        return self._running

    def is_paused(self) -> bool:
        """游戏是否暂停。"""
        return self._paused

    def get_elapsed_time(self) -> float:
        """获取已用时间。"""
        return self._elapsed_time

    def get_hints_remaining(self) -> int:
        """获取剩余提示次数。"""
        return self._hints_remaining

    def get_remaining_time(self) -> float:
        """获取剩余时间（秒），无限制时返回 -1。"""
        config = self._difficulty.get_config()
        if config.time_limit <= 0:
            return -1.0
        return max(0.0, config.time_limit - self._elapsed_time)

    def get_controller(self) -> Optional[MazeController]:
        """获取迷宫控制器。"""
        return self._controller

    def get_aed_system(self) -> AEDTargetSystem:
        """获取 AED 目标系统。"""
        return self._aed_system

    def get_difficulty(self) -> MazeDifficulty:
        """获取难度管理器。"""
        return self._difficulty

    def to_dict(self) -> Dict[str, Any]:
        """序列化游戏状态。"""
        return {
            "running": self._running,
            "paused": self._paused,
            "elapsed_time": self._elapsed_time,
            "hints_remaining": self._hints_remaining,
            "difficulty": self._difficulty.to_dict(),
            "controller": self._controller.to_dict() if self._controller else None,
            "aed_system": self._aed_system.to_dict(),
        }
