"""迷宫格子组件模块

提供迷宫中单个格子的可视化组件，支持显示墙壁、玩家位置、
AED 设备标记和目标点等状态。
"""

from typing import Optional

from kivy.graphics import Color, Rectangle, Line
from kivy.metrics import dp
from kivy.properties import BooleanProperty, NumericProperty, StringProperty, OptionProperty
from kivy.uix.label import Label


class MazeCell(Label):
    """迷宫格子 UI 组件

    根据 cell_type 渲染不同颜色的格子：
    - path: 通路（白色）
    - wall: 墙壁（深灰色）
    - target: AED目标（红色）
    - player: 玩家位置（蓝色）
    - found_target: 已找到的AED（绿色）
    """

    cell_type = OptionProperty(
        "path", options=["path", "wall", "target", "player", "found_target"]
    )

    # 颜色映射
    _COLORS = {
        "path": (0.92, 0.92, 0.94, 1.0),
        "wall": (0.2, 0.2, 0.28, 1.0),
        "target": (0.9, 0.25, 0.25, 1.0),
        "player": (0.2, 0.55, 1.0, 1.0),
        "found_target": (0.25, 0.85, 0.35, 1.0),
    }

    # 图标映射
    _ICONS = {
        "path": "",
        "wall": "",
        "target": "AED",
        "player": "●",
        "found_target": "✓",
    }

    def __init__(self, cell_type: str = "path", cell_size: float = 0, **kwargs) -> None:
        """初始化迷宫格子

        Args:
            cell_type: 格子类型 (path/wall/target/player/found_target)
            cell_size: 格子尺寸（像素），0 则自适应
        """
        self.cell_type = cell_type
        super().__init__(**kwargs)

        if cell_size > 0:
            self.size_hint = (None, None)
            self.size = (cell_size, cell_size)
        else:
            self.size_hint = (None, None)

        color = self._COLORS.get(cell_type, self._COLORS["path"])
        icon = self._ICONS.get(cell_type, "")

        # 设置文字
        if cell_type == "target":
            self.text = "AED"
            self.font_size = dp(8)
            self.color = (1, 1, 1, 1)
        elif cell_type == "player":
            self.text = "●"
            self.font_size = dp(14)
            self.color = (1, 1, 1, 1)
        elif cell_type == "found_target":
            self.text = "✓"
            self.font_size = dp(12)
            self.color = (1, 1, 1, 1)
        else:
            self.text = ""
            self.font_size = dp(1)

        self.halign = "center"
        self.valign = "center"

        # 绘制背景
        with self.canvas.before:
            self._bg_color = Color(*color)
            self._bg_rect = Rectangle(pos=self.pos, size=self.size)

        self.bind(pos=self._update_rect, size=self._update_rect)

    def _update_rect(self, instance, value) -> None:
        """更新背景矩形位置和大小。"""
        self._bg_rect.pos = self.pos
        self._bg_rect.size = self.size
