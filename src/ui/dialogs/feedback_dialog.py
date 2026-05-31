"""反馈对话框模块

提供操作反馈对话框组件，支持成功/警告/错误等不同类型的反馈展示。
"""

from typing import Callable, Optional

from kivy.clock import Clock
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp, sp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.modalview import ModalView


class FeedbackDialog(ModalView):
    """反馈对话框

    模态对话框，展示操作结果反馈。支持成功、警告、错误三种类型，
    不同类型有不同的颜色主题和图标提示。
    """

    # 类型颜色配置: (标题色, 背景高亮色, 按钮色)
    _TYPE_COLORS = {
        "success": ((0.2, 0.9, 0.3, 1), (0.1, 0.3, 0.15, 1), (0.2, 0.7, 0.3, 1)),
        "warning": ((0.95, 0.8, 0.1, 1), (0.3, 0.25, 0.05, 1), (0.8, 0.7, 0.1, 1)),
        "error": ((0.9, 0.2, 0.2, 1), (0.3, 0.1, 0.1, 1), (0.7, 0.2, 0.2, 1)),
        "info": ((0.3, 0.6, 0.95, 1), (0.1, 0.15, 0.3, 1), (0.2, 0.5, 0.9, 1)),
    }

    _TYPE_ICONS = {
        "success": "[OK]",
        "warning": "[!]",
        "error": "[X]",
        "info": "[i]",
    }

    def __init__(
        self,
        feedback_type: str = "info",
        title: str = "提示",
        message: str = "",
        auto_dismiss_time: float = 0.0,
        on_close: Optional[Callable[[], None]] = None,
        **kwargs,
    ) -> None:
        """初始化反馈对话框

        Args:
            feedback_type: 反馈类型 ("success"/"warning"/"error"/"info")
            title: 标题文本
            message: 内容文本
            auto_dismiss_time: 自动关闭时间（秒），0 表示不自动关闭
            on_close: 关闭回调
        """
        super().__init__(**kwargs)
        self._feedback_type = feedback_type
        self._on_close = on_close

        self.auto_dismiss = True
        self.size_hint = (0.85, None)
        self.height = dp(220)
        self.background_color = (0, 0, 0, 0.7)

        self._build_ui(title, message)

        if auto_dismiss_time > 0:
            Clock.schedule_once(lambda dt: self.dismiss(), auto_dismiss_time)

    def _build_ui(self, title: str, message: str) -> None:
        """构建对话框 UI

        Args:
            title: 标题
            message: 内容
        """
        colors = self._TYPE_COLORS.get(
            self._feedback_type, self._TYPE_COLORS["info"]
        )
        icon = self._TYPE_ICONS.get(self._feedback_type, "[i]")

        container = BoxLayout(
            orientation="vertical",
            padding=[dp(20), dp(16)],
            spacing=dp(12),
        )

        with container.canvas.before:
            Color(0.18, 0.18, 0.22, 0.98)
            self._bg_rect = RoundedRectangle(
                pos=container.pos,
                size=container.size,
                radius=[dp(12)],
            )

        container.bind(
            pos=lambda i, v: setattr(self._bg_rect, "pos", v),
            size=lambda i, v: setattr(self._bg_rect, "size", v),
        )

        # 图标 + 标题行
        header = BoxLayout(
            orientation="horizontal",
            size_hint=(1, None),
            height=dp(36),
            spacing=dp(8),
        )

        icon_label = Label(
            text=icon,
            font_size=sp(22),
            color=colors[0],
            size_hint=(None, 1),
            width=dp(40),
        )
        header.add_widget(icon_label)

        title_label = Label(
            text=title,
            font_size=sp(20),
            bold=True,
            color=colors[0],
            halign="left",
            valign="middle",
            size_hint=(1, 1),
        )
        title_label.bind(size=title_label.setter("text_size"))
        header.add_widget(title_label)

        container.add_widget(header)

        # 内容文本
        msg_label = Label(
            text=message,
            font_size=sp(15),
            color=(0.85, 0.85, 0.85, 1),
            size_hint=(1, 1),
            halign="left",
            valign="top",
        )
        msg_label.bind(size=msg_label.setter("text_size"))
        container.add_widget(msg_label)

        # 关闭按钮
        close_btn = Button(
            text="确定",
            font_size=sp(15),
            size_hint=(None, None),
            width=dp(120),
            height=dp(40),
            pos_hint={"center_x": 0.5},
            background_color=colors[2],
            color=(1, 1, 1, 1),
        )
        close_btn.bind(on_press=self._on_close_pressed)
        container.add_widget(close_btn)

        self.add_widget(container)

    def _on_close_pressed(self, instance: Button) -> None:
        """关闭按钮点击处理。"""
        self.dismiss()
        if self._on_close:
            self._on_close()
