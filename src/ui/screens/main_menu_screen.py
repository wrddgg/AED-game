"""MainMenuScreen - 主菜单界面。

提供开始游戏、历史记录、排行榜、帮助、设置等入口。
"""

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen


class _MenuButton(Button):
    """主菜单按钮，统一样式。"""

    def __init__(self, text: str, on_press_callback, **kwargs) -> None:
        super().__init__(**kwargs)
        self.text = text
        self.font_size = dp(20)
        self.size_hint = (0.7, None)
        self.height = dp(56)
        self.pos_hint = {"center_x": 0.5}
        self.background_color = (0.2, 0.45, 0.75, 1)
        self.color = (1, 1, 1, 1)
        self.bind(on_press=on_press_callback)


class MainMenuScreen(BaseScreen):
    """主菜单界面：展示游戏标题和功能入口按钮。"""

    scene_id: str = "main_menu"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._build_ui()

    def _build_ui(self) -> None:
        """构建主菜单 UI。"""
        layout = BoxLayout(orientation="vertical", padding=[dp(20), dp(30)], spacing=dp(12))

        # 背景
        with layout.canvas.before:
            Color(0.1, 0.12, 0.18, 1)
            self._bg_rect = Rectangle(pos=layout.pos, size=layout.size)
        layout.bind(pos=self._update_bg, size=self._update_bg)

        # 标题区域
        title_layout = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.35),
            spacing=dp(8),
        )

        title = Label(
            text="AED急救大作战",
            font_size=dp(36),
            bold=True,
            color=(0.95, 0.3, 0.3, 1),
            size_hint=(1, 0.6),
        )
        title_layout.add_widget(title)

        subtitle = Label(
            text="学会急救，拯救生命",
            font_size=dp(16),
            color=(0.7, 0.75, 0.8, 1),
            size_hint=(1, 0.4),
        )
        title_layout.add_widget(subtitle)
        layout.add_widget(title_layout)

        # 按钮区域
        btn_layout = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.55),
            spacing=dp(14),
            padding=[dp(30), 0],
        )

        buttons = [
            ("开始游戏", self.on_start_game),
            ("历史记录", self.on_history),
            ("排行榜", self.on_leaderboard),
            ("帮助", self.on_help),
            ("设置", self.on_settings),
        ]

        for text, callback in buttons:
            btn = _MenuButton(text, callback)
            btn_layout.add_widget(btn)

        layout.add_widget(btn_layout)

        # 底部版本信息
        version_label = Label(
            text="v1.0.0",
            font_size=dp(12),
            color=(0.4, 0.4, 0.45, 1),
            size_hint=(1, 0.1),
        )
        layout.add_widget(version_label)

        self.add_widget(layout)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _navigate(self, screen_id: str) -> None:
        """导航到指定场景。"""
        from src.core.globals import navigate_to
        navigate_to(screen_id)

    def on_start_game(self, instance=None) -> None:
        """切换到场景选择页面。"""
        self._navigate("scenario_select")

    def on_history(self, instance=None) -> None:
        """切换到历史记录页面。"""
        self._navigate("history")

    def on_leaderboard(self, instance=None) -> None:
        """切换到排行榜页面。"""
        self._navigate("leaderboard")

    def on_help(self, instance=None) -> None:
        """显示帮助对话框。"""
        from src.ui.dialogs.help_dialog import HelpDialog
        dialog = HelpDialog(topic_id="main_menu")
        dialog.open()

    def on_settings(self, instance=None) -> None:
        """切换到设置页面。"""
        self._navigate("settings")
