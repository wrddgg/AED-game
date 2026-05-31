"""加载遮罩层模块

提供全屏加载遮罩组件，显示加载动画和提示文本，
用于异步资源加载或场景切换时的等待界面。
"""

from typing import Optional

from kivy.animation import Animation
from kivy.clock import Clock
from kivy.graphics import Color, Rectangle, Rotate, PushMatrix, PopMatrix
from kivy.metrics import dp, sp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.label import Label
from kivy.uix.widget import Widget


class LoadingOverlay(FloatLayout):
    """加载遮罩层

    半透明全屏遮罩，中央显示旋转加载动画和提示文本。
    """

    def __init__(self, message: str = "加载中...", **kwargs) -> None:
        """初始化加载遮罩

        Args:
            message: 加载提示文本
        """
        super().__init__(**kwargs)
        self._message = message
        self._rotation_angle = 0.0
        self._rotate_event = None

        self._build_ui()

    def _build_ui(self) -> None:
        """构建遮罩 UI。"""
        # 半透明背景
        with self.canvas.before:
            Color(0, 0, 0, 0.7)
            self._bg_rect = Rectangle(pos=self.pos, size=self.size)

        self.bind(pos=self._update_bg, size=self._update_bg)

        # 中央内容
        content = BoxLayout(
            orientation="vertical",
            size_hint=(None, None),
            size=(dp(200), dp(150)),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            spacing=dp(16),
        )

        # 旋转加载指示器
        self._spinner = Widget(
            size_hint=(None, None),
            size=(dp(60), dp(60)),
            pos_hint={"center_x": 0.5},
        )
        with self._spinner.canvas:
            PushMatrix()
            self._rotate = Rotate(angle=0, origin=self._spinner.center)
            Color(0.4, 0.7, 1.0, 1.0)
            # 绘制弧线表示加载
            from kivy.graphics import Line
            self._spinner_line = Line(
                circle=(dp(30), dp(30), dp(24), 0, 270),
                width=dp(3),
            )
            PopMatrix()

        content.add_widget(self._spinner)

        # 提示文本
        self._label = Label(
            text=self._message,
            font_size=sp(16),
            color=(0.9, 0.9, 0.9, 1),
            size_hint=(1, None),
            height=dp(30),
            halign="center",
        )
        content.add_widget(self._label)

        self.add_widget(content)

    def _update_bg(self, *args) -> None:
        """更新背景矩形位置和大小。"""
        self._bg_rect.pos = self.pos
        self._bg_rect.size = self.size

    def show(self) -> None:
        """显示遮罩并启动旋转动画。"""
        self.opacity = 1.0
        self.visible = True
        if self._rotate_event is None:
            self._rotate_event = Clock.schedule_interval(self._animate_rotation, 0.03)

    def hide(self) -> None:
        """隐藏遮罩并停止旋转动画。"""
        self.opacity = 0.0
        self.visible = False
        if self._rotate_event is not None:
            self._rotate_event.cancel()
            self._rotate_event = None

    def _animate_rotation(self, dt: float) -> None:
        """旋转动画更新

        Args:
            dt: 时间增量
        """
        self._rotation_angle = (self._rotation_angle + 5) % 360
        self._rotate.angle = self._rotation_angle
        self._rotate.origin = self._spinner.center

    def set_message(self, message: str) -> None:
        """更新加载提示文本

        Args:
            message: 新的提示文本
        """
        self._message = message
        self._label.text = message
