"""MazeScreen - 迷宫小游戏页面。

布局：顶部计时器+AED进度+提示按钮，中部迷宫网格，底部方向控制按钮。
直接集成 MazeGenerator，绕过有接口bug的MazeController/MazeGame，
实现完整可玩的迷宫小游戏。
"""

import os
from typing import Any, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle
from kivy.core.window import Window

from src.ui.screens.base_screen import BaseScreen
from src.ui.widgets.maze_cell import MazeCell
from src.ui.fonts import DEFAULT_FONT_NAME
from src.minigames.maze.maze_generator import MazeGenerator


# 方向: 上=0, 右=1, 下=2, 左=3
DIR_DELTA = [(-1, 0), (0, 1), (1, 0), (0, -1)]
DIR_NAMES = ["up", "right", "down", "left"]


class MazeScreen(BaseScreen):
    """迷宫小游戏页面：玩家操控角色在迷宫中寻找 AED 设备。"""

    scene_id: str = "maze"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._maze_grid: GridLayout | None = None
        self._timer_label: Label | None = None
        self._progress_label: Label | None = None
        self._hint_label: Label | None = None

        # 迷宫数据（来自 MazeGenerator 的 0/1/2 网格）
        self._grid: list[list[int]] = []
        self._grid_rows: int = 0
        self._grid_cols: int = 0
        self._start_pos: tuple[int, int] = (1, 1)
        self._end_pos: tuple[int, int] = (1, 1)

        # 玩家状态
        self._player_row: int = 1
        self._player_col: int = 1
        self._player_steps: int = 0

        # AED 目标
        self._aed_targets: list[tuple[int, int]] = []  # AED位置
        self._aed_found: list[tuple[int, int]] = []     # 已找到的AED
        self._has_aed: bool = False                      # 是否携带AED

        # 游戏状态
        self._running: bool = False
        self._elapsed: float = 0.0
        self._time_limit: float = 0.0  # 0=无限制
        self._hints_remaining: int = 3
        self._completed: bool = False

        # 剧情回调数据（完成迷宫后跳回剧情）
        self._story_data: dict = {}

        # 定时器事件
        self._tick_event = None

        # 键盘支持
        self._keyboard = None

        self._build_ui()

    def _build_ui(self) -> None:
        """构建迷宫页面 UI。"""
        root = BoxLayout(orientation="vertical", spacing=dp(4), padding=[dp(8), dp(6)])

        # 背景
        with root.canvas.before:
            Color(0.06, 0.08, 0.12, 1)
            self._bg_rect = Rectangle(pos=root.pos, size=root.size)
        root.bind(pos=self._update_bg, size=self._update_bg)

        # 顶部信息栏
        top_bar = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.07),
            spacing=dp(6),
        )

        self._timer_label = Label(
            text="时间: --",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(15),
            color=(1, 0.85, 0.3, 1),
            size_hint=(0.3, 1),
            halign="left",
            valign="middle",
        )
        self._timer_label.bind(size=self._timer_label.setter("text_size"))
        top_bar.add_widget(self._timer_label)

        self._progress_label = Label(
            text="AED: 0/0",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(15),
            color=(0.3, 0.85, 0.4, 1),
            size_hint=(0.3, 1),
            halign="center",
            valign="middle",
        )
        self._progress_label.bind(size=self._progress_label.setter("text_size"))
        top_bar.add_widget(self._progress_label)

        self._hint_label = Label(
            text=f"提示: {self._hints_remaining}",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(15),
            color=(0.6, 0.7, 1.0, 1),
            size_hint=(0.2, 1),
            halign="center",
            valign="middle",
        )
        self._hint_label.bind(size=self._hint_label.setter("text_size"))
        top_bar.add_widget(self._hint_label)

        hint_btn = Button(
            text="提示",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(14),
            size_hint=(0.2, 1),
            background_color=(0.3, 0.4, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        hint_btn.bind(on_press=self._on_use_hint)
        top_bar.add_widget(hint_btn)

        root.add_widget(top_bar)

        # 中部：迷宫网格
        self._maze_grid = GridLayout(
            cols=1,
            size_hint=(1, 0.68),
            spacing=dp(1),
            padding=[dp(4), dp(4)],
        )
        root.add_widget(self._maze_grid)

        # 底部：方向控制按钮
        controls = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.25),
            spacing=dp(3),
            padding=[dp(30), dp(2)],
        )

        # 上
        row_up = BoxLayout(orientation="horizontal", size_hint=(1, 0.33))
        row_up.add_widget(Label(size_hint=(0.33, 1)))
        up_btn = Button(
            text="▲",
            font_size=dp(28),
            size_hint=(0.34, 1),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        up_btn.bind(on_press=lambda inst: self.on_direction("up"))
        row_up.add_widget(up_btn)
        row_up.add_widget(Label(size_hint=(0.33, 1)))
        controls.add_widget(row_up)

        # 左 + 中(拾取) + 右
        row_mid = BoxLayout(orientation="horizontal", size_hint=(1, 0.33), spacing=dp(4))
        left_btn = Button(
            text="◄",
            font_size=dp(28),
            size_hint=(0.3, 1),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        left_btn.bind(on_press=lambda inst: self.on_direction("left"))
        row_mid.add_widget(left_btn)

        pickup_btn = Button(
            text="拾取AED",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(14),
            size_hint=(0.4, 1),
            background_color=(0.7, 0.3, 0.2, 1),
            color=(1, 1, 1, 1),
        )
        pickup_btn.bind(on_press=self._on_pickup_aed)
        row_mid.add_widget(pickup_btn)

        right_btn = Button(
            text="►",
            font_size=dp(28),
            size_hint=(0.3, 1),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        right_btn.bind(on_press=lambda inst: self.on_direction("right"))
        row_mid.add_widget(right_btn)
        controls.add_widget(row_mid)

        # 下
        row_down = BoxLayout(orientation="horizontal", size_hint=(1, 0.33))
        row_down.add_widget(Label(size_hint=(0.33, 1)))
        down_btn = Button(
            text="▼",
            font_size=dp(28),
            size_hint=(0.34, 1),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        down_btn.bind(on_press=lambda inst: self.on_direction("down"))
        row_down.add_widget(down_btn)
        row_down.add_widget(Label(size_hint=(0.33, 1)))
        controls.add_widget(row_down)

        root.add_widget(controls)
        self.add_widget(root)

    # ─────────────────────────────────────────────
    # 迷宫生成
    # ─────────────────────────────────────────────

    def _generate_maze(self, difficulty: str = "easy") -> None:
        """用 MazeGenerator 生成迷宫并初始化游戏状态。

        Args:
            difficulty: 难度预设 easy/normal/hard/expert
        """
        # 难度映射到生成参数
        size_map = {
            "easy": (9, 9),
            "normal": (11, 11),
            "hard": (15, 15),
            "expert": (21, 21),
        }
        obstacle_map = {
            "easy": 0.0,
            "normal": 0.05,
            "hard": 0.1,
            "expert": 0.2,
        }
        time_map = {
            "easy": 0.0,
            "normal": 120.0,
            "hard": 90.0,
            "expert": 60.0,
        }
        hint_map = {
            "easy": 5,
            "normal": 3,
            "hard": 1,
            "expert": 0,
        }

        size = size_map.get(difficulty, (9, 9))
        obstacle_ratio = obstacle_map.get(difficulty, 0.0)
        self._time_limit = time_map.get(difficulty, 0.0)
        self._hints_remaining = hint_map.get(difficulty, 3)

        # 调用 MazeGenerator 生成迷宫
        gen = MazeGenerator()
        result = gen.generate(
            difficulty={
                "size": size,
                "obstacle_ratio": obstacle_ratio,
                "seed": None,  # 随机生成
            }
        )

        self._grid = result["grid"]
        self._grid_rows = len(self._grid)
        self._grid_cols = len(self._grid[0]) if self._grid else 0
        self._start_pos = result["start"]
        self._end_pos = result["end"]

        # 收集 AED 目标（grid中值为2的位置）
        self._aed_targets = []
        self._aed_found = []
        for r in range(self._grid_rows):
            for c in range(self._grid_cols):
                if self._grid[r][c] == 2:
                    self._aed_targets.append((r, c))

        # 如果没有AED目标，在迷宫中部附近放一个
        if not self._aed_targets:
            mid_r = self._grid_rows // 2
            mid_c = self._grid_cols // 2
            # 找附近的通路
            for dr in range(-2, 3):
                for dc in range(-2, 3):
                    nr, nc = mid_r + dr, mid_c + dc
                    if 0 <= nr < self._grid_rows and 0 <= nc < self._grid_cols:
                        if self._grid[nr][nc] == 0:
                            self._grid[nr][nc] = 2
                            self._aed_targets.append((nr, nc))
                            break
                if self._aed_targets:
                    break

        # 初始化玩家位置
        self._player_row, self._player_col = self._start_pos
        self._player_steps = 0
        self._has_aed = False
        self._elapsed = 0.0
        self._completed = False
        self._running = True

    # ─────────────────────────────────────────────
    # 渲染
    # ─────────────────────────────────────────────

    def _render(self) -> None:
        """重新渲染整个迷宫网格。"""
        if self._maze_grid is None or not self._grid:
            return

        self._maze_grid.clear_widgets()
        self._maze_grid.cols = self._grid_cols

        for r in range(self._grid_rows):
            for c in range(self._grid_cols):
                pos = (r, c)
                cell_value = self._grid[r][c]

                if pos == (self._player_row, self._player_col):
                    cell_type = "player"
                elif pos in self._aed_found:
                    cell_type = "found_target"
                elif pos in self._aed_targets and pos not in self._aed_found:
                    cell_type = "target"
                elif cell_value == 1:
                    cell_type = "wall"
                else:
                    cell_type = "path"

                cell = MazeCell(cell_type=cell_type)
                self._maze_grid.add_widget(cell)

        # 更新顶部信息
        self._update_info()

    def _update_info(self) -> None:
        """更新顶部信息标签。"""
        if self._timer_label is not None:
            if self._time_limit > 0:
                remaining = max(0, self._time_limit - self._elapsed)
                self._timer_label.text = f"剩余: {remaining:.0f}s"
            else:
                self._timer_label.text = f"用时: {self._elapsed:.0f}s"

        if self._progress_label is not None:
            total = len(self._aed_targets)
            found = len(self._aed_found)
            self._progress_label.text = f"AED: {found}/{total}"

        if self._hint_label is not None:
            self._hint_label.text = f"提示: {self._hints_remaining}"

    # ─────────────────────────────────────────────
    # 玩家移动
    # ─────────────────────────────────────────────

    def on_direction(self, direction: str) -> None:
        """方向按钮回调。

        Args:
            direction: "up"/"down"/"left"/"right"
        """
        if not self._running or self._completed:
            return

        dir_idx = DIR_NAMES.index(direction) if direction in DIR_NAMES else -1
        if dir_idx < 0:
            return

        dr, dc = DIR_DELTA[dir_idx]
        new_r = self._player_row + dr
        new_c = self._player_col + dc

        # 边界检查
        if not (0 <= new_r < self._grid_rows and 0 <= new_c < self._grid_cols):
            return

        # 墙壁检查（值为1的是墙）
        if self._grid[new_r][new_c] == 1:
            return

        # 移动
        self._player_row = new_r
        self._player_col = new_c
        self._player_steps += 1

        # 自动拾取AED（走到AED位置自动捡起）
        if (new_r, new_c) in self._aed_targets and (new_r, new_c) not in self._aed_found:
            self._aed_found.append((new_r, new_c))
            self._has_aed = True

        # 检查是否到达终点
        if (new_r, new_c) == self._end_pos:
            self._complete_maze(success=True)

        # 刷新渲染
        self._render()

    def _on_pickup_aed(self, instance=None) -> None:
        """拾取AED按钮回调。"""
        if not self._running or self._completed:
            return

        pos = (self._player_row, self._player_col)
        if pos in self._aed_targets and pos not in self._aed_found:
            self._aed_found.append(pos)
            self._has_aed = True
            self._render()

    def _on_use_hint(self, instance=None) -> None:
        """使用提示，高亮下一步方向。"""
        if not self._running or self._completed:
            return

        if self._hints_remaining <= 0:
            return

        # BFS 找到最近目标的最短路径第一步
        next_step = self._bfs_next_step()

        if next_step is not None:
            self._hints_remaining -= 1
            # 高亮提示格子：暂时将其标记显示
            nr, nc = next_step
            # 闪烁效果：改变格子颜色短暂时间
            self._flash_hint(nr, nc)

    def _bfs_next_step(self) -> Optional[tuple[int, int]]:
        """BFS 寻找到最近目标的最短路径的第一步。

        Returns:
            第一步的坐标 (row, col)，或 None
        """
        from collections import deque

        start = (self._player_row, self._player_col)

        # 确定目标：未找到的AED优先，否则终点
        goals = set()
        for t in self._aed_targets:
            if t not in self._aed_found:
                goals.add(t)
        if not goals:
            goals.add(self._end_pos)

        if start in goals:
            return None

        visited = {start}
        queue = deque()

        for dir_idx, (dr, dc) in enumerate(DIR_DELTA):
            nr, nc = start[0] + dr, start[1] + dc
            if 0 <= nr < self._grid_rows and 0 <= nc < self._grid_cols:
                if self._grid[nr][nc] != 1 and (nr, nc) not in visited:
                    next_pos = (nr, nc)
                    if next_pos in goals:
                        return next_pos
                    visited.add(next_pos)
                    queue.append((next_pos, next_pos))

        while queue:
            current, first_step = queue.popleft()
            if current in goals:
                return first_step

            for dr, dc in DIR_DELTA:
                nr, nc = current[0] + dr, current[1] + dc
                next_pos = (nr, nc)
                if 0 <= nr < self._grid_rows and 0 <= nc < self._grid_cols:
                    if self._grid[nr][nc] != 1 and next_pos not in visited:
                        visited.add(next_pos)
                        queue.append((next_pos, first_step))

        return None

    def _flash_hint(self, row: int, col: int) -> None:
        """闪烁提示格子（临时改变颜色）。"""
        # 找到对应的格子widget并闪烁
        if self._maze_grid is None:
            return

        idx = row * self._grid_cols + col
        children = self._maze_grid.children
        # GridLayout 的 children 是反向的
        total = len(children)
        widget_idx = total - 1 - idx
        if 0 <= widget_idx < total:
            child = children[widget_idx]
            old_color = child._bg_color.rgba[:]
            # 闪烁为黄色
            child._bg_color.rgba = (1.0, 0.9, 0.2, 1.0)
            # 0.5秒后恢复
            Clock.schedule_once(
                lambda dt, c=child, oc=old_color: self._restore_cell_color(c, oc),
                0.5,
            )

        self._update_info()

    @staticmethod
    def _restore_cell_color(cell, old_color) -> None:
        """恢复格子颜色。"""
        try:
            cell._bg_color.rgba = old_color
        except Exception:
            pass

    # ─────────────────────────────────────────────
    # 游戏流程
    # ─────────────────────────────────────────────

    def _complete_maze(self, success: bool) -> None:
        """迷宫完成处理。

        Args:
            success: 是否成功找到AED并到达终点
        """
        self._running = False
        self._completed = True

        # 停止计时
        if self._tick_event is not None:
            self._tick_event.cancel()
            self._tick_event = None

        # 解绑键盘
        self._unbind_keyboard()

        result_text = "成功找到AED！" if success else "时间耗尽..."
        steps_text = f"步数: {self._player_steps}"
        time_text = f"用时: {self._elapsed:.1f}s"

        # 延迟显示结果并返回剧情
        if self._maze_grid is not None:
            self._maze_grid.clear_widgets()
        result_label = Label(
            text=f"{'🌟' if success else '💔'} {result_text}\n{steps_text}\n{time_text}",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(22),
            color=(0.3, 0.9, 0.4, 1) if success else (0.9, 0.3, 0.3, 1),
            halign="center",
            valign="middle",
        )
        result_label.bind(size=result_label.setter("text_size"))
        if self._maze_grid is not None:
            self._maze_grid.parent.add_widget(result_label)

        # 2.5秒后返回剧情
        Clock.schedule_once(
            lambda dt: self._return_to_story(success), 2.5
        )

    def _return_to_story(self, success: bool) -> None:
        """返回剧情页面。

        Args:
            success: 迷宫是否成功
        """
        from src.core.globals import navigate_to

        # 获取剧情回调数据
        node_data = self._story_data.get("data", {})
        if success:
            next_node = node_data.get("next_node", "")
        else:
            next_node = node_data.get("failure_node", node_data.get("next_node", ""))

        # 导航回故事页面，传入结果
        navigate_to("story", {
            "scenario_id": self._story_data.get("scenario_id", "subway"),
            "story_id": self._story_data.get("story_id", "subway_story"),
            "go_to_node": next_node,
            "maze_success": success,
        })

    def _tick(self, dt: float) -> None:
        """每帧计时更新。"""
        if not self._running or self._completed:
            return

        self._elapsed += dt
        self._update_info()

        # 检查超时
        if self._time_limit > 0 and self._elapsed >= self._time_limit:
            self._complete_maze(success=False)

    # ─────────────────────────────────────────────
    # 键盘支持
    # ─────────────────────────────────────────────

    def _bind_keyboard(self) -> None:
        """绑定键盘事件。"""
        self._keyboard = Window.request_keyboard(
            self._unbind_keyboard, self, "text"
        )
        if self._keyboard:
            self._keyboard.bind(on_key_down=self._on_key_down)

    def _unbind_keyboard(self, *args) -> None:
        """解绑键盘事件。"""
        if self._keyboard:
            self._keyboard.unbind(on_key_down=self._on_key_down)
            self._keyboard.release()
            self._keyboard = None

    def _on_key_down(self, keyboard, keycode, text, modifiers) -> bool:
        """键盘按键回调。

        方向键和WASD控制移动。
        """
        key = keycode[1] if isinstance(keycode, tuple) else keycode

        key_map = {
            "up": "up", "w": "up",
            "down": "down", "s": "down",
            "left": "left", "a": "left",
            "right": "right", "d": "right",
        }

        direction = key_map.get(key)
        if direction:
            self.on_direction(direction)
            return True

        return False

    # ─────────────────────────────────────────────
    # Screen 回调
    # ─────────────────────────────────────────────

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def on_enter(self, *args) -> None:
        """进入迷宫页面时，生成迷宫并开始游戏。"""
        super().on_enter(*args)
        # 如果 update() 已经触发了迷宫生成（从剧情跳转），跳过
        if self._grid and self._running:
            self._bind_keyboard()
            return

        # 直接进入迷宫页面（没经过剧情），用默认难度
        if not self._grid:
            self._generate_maze("easy")
            self._render()

        # 开始计时
        if self._tick_event is not None:
            self._tick_event.cancel()
        self._tick_event = Clock.schedule_interval(self._tick, 0.1)
        # 绑定键盘
        self._bind_keyboard()

    def on_leave(self, *args) -> None:
        """离开迷宫页面时清理。"""
        super().on_leave(*args)
        self._running = False
        if self._tick_event is not None:
            self._tick_event.cancel()
            self._tick_event = None
        self._unbind_keyboard()

    def update(self, data: dict) -> None:
        """接收外部数据更新，可指定难度或剧情回调。

        Args:
            data: 可包含 difficulty, data(剧情节点), scenario_id, story_id
        """
        difficulty = data.get("difficulty", "easy")
        self._story_data = data

        # 重新生成迷宫
        self._generate_maze(difficulty)
        self._render()

        # 开始计时
        if self._tick_event is not None:
            self._tick_event.cancel()
        self._tick_event = Clock.schedule_interval(self._tick, 0.1)
