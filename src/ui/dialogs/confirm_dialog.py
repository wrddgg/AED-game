"""确认对话框模块

提供通用的确认/取消对话框组件，支持自定义标题、内容和按钮文本。
"""

from typing import Callable, Optional

from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp, sp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.modalview import ModalView


class ConfirmDialog(ModalView):
    """确认对话框

    模态对话框，显示标题、内容和确认/取消按钮。
    点击确认触发 on_confirm 回调，点击取消或点击外部关闭对话框。
    """

    def __init__(
        self,
        title: str = "确认",
        message: str = "确定要执行此操作吗？",
        confirm_text: str = "确认",
        cancel_text: str = "取消",
        on_confirm: Optional[Callable[[], None]] = None,
        on_cancel: Optional[Callable[[], None]] = None,
        **kwargs,
    ) -> None:
        """初始化确认对话框

        Args:
            title: 对话框标题
            message: 对话框内容文本
            confirm_text: 确认按钮文本
            cancel_text: 取消按钮文本
            on_confirm: 确认回调
            on_cancel: 取消回调
        """
        super().__init__(**kwargs)
        self._on_confirm = on_confirm
        self._on_cancel = on_cancel

        self.auto_dismiss = True
        self.size_hint = (0.85, None)
        self.height = dp(200)
        self.background_color = (0, 0, 0, 0.7)

        self._build_ui(title, message, confirm_text, cancel_text)

    def _build_ui(
        self,
        title: str,
        message: str,
        confirm_text: str,
        cancel_text: str,
    ) -> None:
        """构建对话框 UI

        Args:
            title: 标题
            message: 内容
            confirm_text: 确认按钮文本
            cancel_text: 取消按钮文本
        """
        container = BoxLayout(
            orientation="vertical",
            padding=[dp(20), dp(16)],
            spacing=dp(16),
            size_hint=(1, 1),
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

        # 标题
        title_label = Label(
            text=title,
            font_size=sp(20),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(1, None),
            height=dp(32),
            halign="left",
            valign="middle",
        )
        title_label.bind(size=title_label.setter("text_size"))
        container.add_widget(title_label)

        # 内容
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

        # 按钮栏
        btn_layout = BoxLayout(
            orientation="horizontal",
            size_hint=(1, None),
            height=dp(44),
            spacing=dp(12),
        )

        cancel_btn = Button(
            text=cancel_text,
            font_size=sp(15),
            background_color=(0.35, 0.35, 0.4, 1),
            color=(1, 1, 1, 1),
        )
        cancel_btn.bind(on_press=self._on_cancel_pressed)
        btn_layout.add_widget(cancel_btn)

        confirm_btn = Button(
            text=confirm_text,
            font_size=sp(15),
            background_color=(0.2, 0.5, 0.9, 1),
            color=(1, 1, 1, 1),
        )
        confirm_btn.bind(on_press=self._on_confirm_pressed)
        btn_layout.add_widget(confirm_btn)

        container.add_widget(btn_layout)
        self.add_widget(container)

    def _on_confirm_pressed(self, instance: Button) -> None:
        """确认按钮点击处理"""
        self.dismiss()
        if self._on_confirm:
            self._on_confirm()

    def _on_cancel_pressed(self, instance: Button) -> None:
        """取消按钮点击处理"""
        self.dismiss()
        if self._on_cancel:
            self._on_cancel()
