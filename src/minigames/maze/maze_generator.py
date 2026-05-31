"""迷宫生成器模块。

使用 DFS 算法生成迷宫，支持自定义大小、障碍物比例和 AED 目标放置。
生成的迷宫数据供 MazeController 和 MazeGame 使用。
"""

from __future__ import annotations

import random
from typing import Any, Optional


class MazeGenerator:
    """迷宫生成器，根据难度参数生成可玩迷宫。

    使用深度优先搜索（DFS）算法生成完美迷宫，然后根据配置
    放置 AED 目标和额外障碍物。

    Implements IMazeGenerator concept.
    """

    def generate(
        self,
        difficulty: dict,
        targets: Optional[list[tuple[int, int]]] = None,
    ) -> dict:
        """根据难度配置生成迷宫。

        Args:
            difficulty: 难度配置字典，包含：
                - size: (rows, cols) 迷宫尺寸（必须为奇数）
                - obstacle_ratio: 额外障碍物比例 (0.0-1.0)
                - seed: 随机种子
            targets: AED 目标位置列表 [(row, col), ...]

        Returns:
            迷宫数据字典：
                - grid: 2D 列表，0=通路, 1=墙壁, 2=AED目标
                - start: 起点坐标 (row, col)
                - end: 终点坐标 (row, col)
                - targets: AED 目标位置列表
                - size: 迷宫尺寸 (rows, cols)
        """
        size = difficulty.get("size", (11, 11))
        rows, cols = size
        obstacle_ratio = difficulty.get("obstacle_ratio", 0.1)
        seed = difficulty.get("seed")

        # 确保尺寸为奇数（DFS 迷宫生成要求）
        if rows % 2 == 0:
            rows += 1
        if cols % 2 == 0:
            cols += 1

        rng = random.Random(seed)

        # 生成基础迷宫
        grid = self._generate_dfs(rows, cols, rng)

        # 放置 AED 目标
        target_positions = list(targets) if targets else []
        self._place_targets(grid, target_positions, rng)

        # 放置额外障碍物
        self._place_obstacles(grid, obstacle_ratio, rng)

        # 设置起点和终点
        start = self._find_passable_near(grid, 1, 1, rng)
        end = self._find_passable_near(grid, rows - 2, cols - 2, rng)

        return {
            "grid": grid,
            "start": start,
            "end": end,
            "targets": target_positions,
            "size": (rows, cols),
        }

    def _generate_dfs(self, rows: int, cols: int, rng: random.Random) -> list[list[int]]:
        """使用 DFS 算法生成迷宫。

        生成一个完美迷宫（任意两点之间有且仅有一条路径），
        初始全部为墙壁，通过 DFS 打通路径。

        Args:
            rows: 行数（奇数）
            cols: 列数（奇数）
            rng: 随机数生成器

        Returns:
            2D 迷宫网格，0=通路, 1=墙壁
        """
        # 初始化全部为墙壁
        grid = [[1] * cols for _ in range(rows)]

        # DFS 从 (1,1) 开始
        stack: list[tuple[int, int]] = [(1, 1)]
        grid[1][1] = 0

        while stack:
            r, c = stack[-1]

            # 收集可访问的邻居（间隔2格）
            neighbors: list[tuple[int, int]] = []
            for dr, dc in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
                nr, nc = r + dr, c + dc
                if 1 <= nr < rows - 1 and 1 <= nc < cols - 1 and grid[nr][nc] == 1:
                    neighbors.append((nr, nc))

            if neighbors:
                nr, nc = rng.choice(neighbors)
                # 打通中间墙壁
                mid_r = (r + nr) // 2
                mid_c = (c + nc) // 2
                grid[mid_r][mid_c] = 0
                grid[nr][nc] = 0
                stack.append((nr, nc))
            else:
                stack.pop()

        return grid

    def _place_targets(
        self,
        grid: list[list[int]],
        targets: list[tuple[int, int]],
        rng: random.Random,
    ) -> None:
        """在迷宫中放置 AED 目标。

        如果指定的目标位置不可通行，则在附近寻找可通行位置。
        如果没有指定目标位置，则自动放置一个。

        Args:
            grid: 迷宫网格
            targets: 目标位置列表
            rng: 随机数生成器
        """
        rows = len(grid)
        cols = len(grid[0]) if rows > 0 else 0

        # 如果没有指定目标，自动放置一个在迷宫中部附近
        if not targets:
            mid_r = rows // 2
            mid_c = cols // 2
            if mid_r % 2 == 0:
                mid_r = max(1, mid_r - 1)
            if mid_c % 2 == 0:
                mid_c = max(1, mid_c - 1)
            # 找到附近的通路
            pos = self._find_passable_near(grid, mid_r, mid_c, rng)
            targets.append(pos)

        # 确保每个目标位置可通行
        for i, (tr, tc) in enumerate(targets):
            if 0 <= tr < rows and 0 <= tc < cols and grid[tr][tc] == 0:
                grid[tr][tc] = 2  # 标记为 AED 目标
            else:
                # 寻找附近可通行位置
                new_pos = self._find_passable_near(grid, tr, tc, rng)
                grid[new_pos[0]][new_pos[1]] = 2
                targets[i] = new_pos

    def _place_obstacles(
        self,
        grid: list[list[int]],
        ratio: float,
        rng: random.Random,
    ) -> None:
        """在迷宫通路上放置额外障碍物。

        随机将部分通路格子变为墙壁，增加迷宫难度。

        Args:
            grid: 迷宫网格
            ratio: 障碍物比例 (0.0-1.0)
            rng: 随机数生成器
        """
        # 收集所有通路格子（排除起点附近和 AED 目标）
        passable: list[tuple[int, int]] = []
        for r in range(len(grid)):
            for c in range(len(grid[r])):
                if grid[r][c] == 0:
                    # 排除起点 (1,1) 附近的格子
                    if abs(r - 1) + abs(c - 1) <= 2:
                        continue
                    passable.append((r, c))

        # 随机选择一定比例的通路变为墙壁
        num_obstacles = int(len(passable) * ratio)
        if num_obstacles > 0 and passable:
            chosen = rng.sample(passable, min(num_obstacles, len(passable)))
            for r, c in chosen:
                grid[r][c] = 1

    def _find_passable_near(
        self,
        grid: list[list[int]],
        target_r: int,
        target_c: int,
        rng: random.Random,
    ) -> tuple[int, int]:
        """在目标位置附近寻找可通行格子。

        从目标位置开始 BFS 搜索最近的可通行格子。

        Args:
            grid: 迷宫网格
            target_r: 目标行
            target_c: 目标列
            rng: 随机数生成器

        Returns:
            最近的可通行格子坐标
        """
        rows = len(grid)
        cols = len(grid[0]) if rows > 0 else 0

        # 如果目标位置已经是通路，直接返回
        if 0 <= target_r < rows and 0 <= target_c < cols and grid[target_r][target_c] == 0:
            return (target_r, target_c)

        # BFS 搜索最近的可通行位置
        from collections import deque

        visited: set[tuple[int, int]] = set()
        queue: deque[tuple[int, int]] = deque()
        start = (max(1, min(target_r, rows - 2)), max(1, min(target_c, cols - 2)))
        queue.append(start)
        visited.add(start)

        while queue:
            r, c = queue.popleft()
            if 0 <= r < rows and 0 <= c < cols and grid[r][c] == 0:
                return (r, c)
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    queue.append((nr, nc))

        # 兜底：返回 (1,1)
        return (1, 1)
