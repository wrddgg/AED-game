"""暂停遮罩层模块

提供游戏暂停遮罩组件，覆盖在游戏画面上方显示暂停菜单，
支持继续游戏、重新开始和退出等操作。
"""

from typing import Callable, Optional

from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp, sp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.label import Label


class PauseOverlay(FloatLayout):
    """暂停遮罩层

    半透明全屏遮罩，中央显示暂停菜单，包含继续、重新开始和退出按钮。
    """

    def __init__(
        self,
        on_resume: Optional[Callable[[], None]] = None,
        on_restart: Optional[Callable[[], None]] = None,
        on_quit: Optional[Callable[[], None]] = None,
        **kwargs,
    ) -> None:
        """初始化暂停遮罩

        Args:
            on_resume: 继续游戏回调
            on_restart: 重新开始回调
            on_quit: 退出回调
        """
        super().__init__(**kwargs)
        self._on_resume = on_resume
        self._on_restart = on_restart
        self._on_quit = on_quit

        self._build_ui()

    def _build_ui(self) -> None:
        """构建遮罩 UI。"""
        # 半透明背景
        with self.canvas.before:
            Color(0, 0, 0, 0.75)
            self._bg_rect = RoundedRectangle(pos=self.pos, size=self.size)

        self.bind(pos=self._update_bg, size=self._update_bg)

        # 中央菜单面板
        panel = BoxLayout(
            orientation="vertical",
            size_hint=(0.7, None),
            height=dp(280),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            padding=[dp(24), dp(20)],
            spacing=dp(16),
        )

        with panel.canvas.before:
            Color(0.15, 0.15, 0.2, 0.95)
            self._panel_bg = RoundedRectangle(
                pos=panel.pos,
                size=panel.size,
                radius=[dp(16)],
            )

        panel.bind(
            pos=lambda i, v: setattr(self._panel_bg, "pos", v),
            size=lambda i, v: setattr(self._panel_bg, "size", v),
        )

        # 标题
        title = Label(
            text="游戏暂停",
            font_size=sp(26),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(1, None),
            height=dp(48),
        )
        panel.add_widget(title)

        # 分隔线占位
        spacer = BoxLayout(size_hint=(1, None), height=dp(8))
        panel.add_widget(spacer)

        # 继续游戏按钮
        resume_btn = Button(
            text="继续游戏",
            font_size=sp(18),
            size_hint=(1, None),
            height=dp(48),
            background_color=(0.2, 0.6, 0.3, 1),
            color=(1, 1, 1, 1),
        )
        resume_btn.bind(on_press=self._on_resume_pressed)
        panel.add_widget(resume_btn)

        # 重新开始按钮
        restart_btn = Button(
            text="重新开始",
            font_size=sp(18),
            size_hint=(1, None),
            height=dp(48),
            background_color=(0.8, 0.6, 0.1, 1),
            color=(1, 1, 1, 1),
        )
        restart_btn.bind(on_press=self._on_restart_pressed)
        panel.add_widget(restart_btn)

        # 退出按钮
        quit_btn = Button(
            text="退出",
            font_size=sp(18),
            size_hint=(1, None),
            height=dp(48),
            background_color=(0.7, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
        )
        quit_btn.bind(on_press=self._on_quit_pressed)
        panel.add_widget(quit_btn)

        self.add_widget(panel)

    def _update_bg(self, *args) -> None:
        """更新背景矩形位置和大小。"""
        self._bg_rect.pos = self.pos
        self._bg_rect.size = self.size

    def _on_resume_pressed(self, instance: Button) -> None:
        """继续游戏按钮处理。"""
        self._dismiss()
        if self._on_resume:
            self._on_resume()

    def _on_restart_pressed(self, instance: Button) -> None:
        """重新开始按钮处理。"""
        self._dismiss()
        if self._on_restart:
            self._on_restart()

    def _on_quit_pressed(self, instance: Button) -> None:
        """退出按钮处理。"""
        self._dismiss()
        if self._on_quit:
            self._on_quit()

    def _dismiss(self) -> None:
        """隐藏遮罩。"""
        self.parent.remove_widget(self)

    def show(self) -> None:
        """显示遮罩。"""
        self.opacity = 1.0
        self.visible = True

    def hide(self) -> None:
        """隐藏遮罩。"""
        self.opacity = 0.0
        self.visible = False
