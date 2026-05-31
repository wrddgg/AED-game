"""BaseScreen - 所有场景的基类。

提供场景通用功能：进入/离开回调、数据更新、加载状态、错误提示。
直接使用 Kivy Screen，避免 KivyMD 的 MDApp 继承限制。
"""

from typing import Any

from kivy.uix.screenmanager import Screen
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
from kivy.clock import Clock
from kivy.metrics import dp

from src.ui.fonts import DEFAULT_FONT_NAME, get_default_font


class BaseScreen(Screen):
    """所有场景的基类，提供通用生命周期方法和 UI 辅助功能。"""

    scene_id: str = ""

    # 子类共享的默认字体名
    DEFAULT_FONT = DEFAULT_FONT_NAME

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._app_context: Any = None
        self._loading_overlay: BoxLayout | None = None

    @property
    def app_context(self) -> Any:
        """获取全局上下文引用。"""
        return self._app_context

    @app_context.setter
    def app_context(self, value: Any) -> None:
        self._app_context = value

    def on_enter(self, *args: Any) -> None:
        """进入场景时调用。子类可重写此方法添加进入逻辑。"""
        pass

    def on_leave(self, *args: Any) -> None:
        """离开场景时调用。子类可重写此方法添加离开逻辑。"""
        pass

    def update(self, data: dict) -> None:
        """更新场景数据。

        Args:
            data: 需要更新的数据字典。
        """
        pass

    def show_loading(self) -> None:
        """显示加载状态遮罩层。"""
        if self._loading_overlay is not None:
            return
        self._loading_overlay = BoxLayout(
            orientation="vertical",
            size_hint=(1, 1),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
        )

        loading_label = Label(
            text="加载中...",
            font_name=self.DEFAULT_FONT,
            font_size=dp(24),
            color=(1, 1, 1, 1),
            size_hint=(1, 0.1),
        )
        self._loading_overlay.add_widget(loading_label)
        self.add_widget(self._loading_overlay)

    def hide_loading(self) -> None:
        """隐藏加载状态遮罩层。"""
        if self._loading_overlay is None:
            return
        self.remove_widget(self._loading_overlay)
        self._loading_overlay = None

    def show_error(self, message: str) -> None:
        """显示错误提示。

        Args:
            message: 错误信息文本。
        """
        error_layout = BoxLayout(
            orientation="vertical",
            size_hint=(0.8, None),
            height=dp(80),
            pos_hint={"center_x": 0.5, "center_y": 0.5},
            padding=[dp(16), dp(12)],
        )
        from kivy.graphics import Color, RoundedRectangle
        with error_layout.canvas.before:
            Color(0.9, 0.2, 0.2, 0.95)
            RoundedRectangle(
                pos=error_layout.pos,
                size=error_layout.size,
                radius=[dp(8)],
            )

        error_label = Label(
            text=f"错误: {message}",
            font_name=self.DEFAULT_FONT,
            font_size=dp(16),
            color=(1, 1, 1, 1),
        )
        error_layout.add_widget(error_label)
        self.add_widget(error_layout)

        # 3秒后自动移除错误提示
        Clock.schedule_once(
            lambda dt: self.remove_widget(error_layout)
            if error_layout.parent is not None else None,
            3.0,
        )
