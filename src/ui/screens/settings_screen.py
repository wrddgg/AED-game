"""SettingsScreen - 设置页面。

提供音效开关、BGM开关、语言选择、重置存档等功能。
"""

from typing import Any

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.togglebutton import ToggleButton
from kivy.uix.spinner import Spinner
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen
from src.ui.dialogs.confirm_dialog import ConfirmDialog


class _SettingRow(BoxLayout):
    """设置项行组件。"""

    def __init__(self, label_text: str, control_widget, **kwargs) -> None:
        super().__init__(orientation="horizontal", **kwargs)
        self.size_hint_y = None
        self.height = dp(55)
        self.padding = [dp(8), dp(4)]
        self.spacing = dp(12)

        label = Label(
            text=label_text,
            font_size=dp(18),
            color=(0.9, 0.92, 0.95, 1),
            size_hint=(0.55, 1),
            halign="left",
            valign="middle",
        )
        label.bind(size=label.setter("text_size"))
        self.add_widget(label)

        control_widget.size_hint = (0.45, 0.85)
        self.add_widget(control_widget)


class SettingsScreen(BaseScreen):
    """设置页面：管理游戏配置项。"""

    scene_id: str = "settings"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._sound_toggle: ToggleButton | None = None
        self._bgm_toggle: ToggleButton | None = None
        self._lang_spinner: Spinner | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        """构建设置页面 UI。"""
        root = BoxLayout(orientation="vertical", spacing=dp(12), padding=[dp(16), dp(12)])

        # 背景
        with root.canvas.before:
            Color(0.1, 0.12, 0.18, 1)
            self._bg_rect = Rectangle(pos=root.pos, size=root.size)
        root.bind(pos=self._update_bg, size=self._update_bg)

        # 标题栏
        header = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.08),
            spacing=dp(10),
        )

        back_btn = Button(
            text="< 返回",
            font_size=dp(16),
            size_hint=(0.25, 1),
            background_color=(0.3, 0.3, 0.35, 1),
            color=(1, 1, 1, 1),
        )
        back_btn.bind(on_press=self._go_back)
        header.add_widget(back_btn)

        title = Label(
            text="设置",
            font_size=dp(26),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.75, 1),
        )
        header.add_widget(title)

        root.add_widget(header)

        # 设置项列表
        settings_layout = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.72),
            spacing=dp(8),
            padding=[dp(12), dp(8)],
        )

        # 音效开关
        self._sound_toggle = ToggleButton(
            text="音效: 开",
            font_size=dp(16),
            background_color=(0.2, 0.55, 0.3, 1) if self._sound_toggle_state() else (0.5, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
            state="down" if self._sound_toggle_state() else "normal",
        )
        self._sound_toggle.bind(on_press=self.on_toggle_sound)
        sound_row = _SettingRow("音效", self._sound_toggle)
        settings_layout.add_widget(sound_row)

        # BGM开关
        self._bgm_toggle = ToggleButton(
            text="BGM: 开",
            font_size=dp(16),
            background_color=(0.2, 0.55, 0.3, 1) if self._bgm_toggle_state() else (0.5, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
            state="down" if self._bgm_toggle_state() else "normal",
        )
        self._bgm_toggle.bind(on_press=self.on_toggle_bgm)
        bgm_row = _SettingRow("背景音乐", self._bgm_toggle)
        settings_layout.add_widget(bgm_row)

        # 语言选择
        self._lang_spinner = Spinner(
            text="简体中文",
            values=("简体中文", "English"),
            font_size=dp(16),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        self._lang_spinner.bind(text=self._on_language_change)
        lang_row = _SettingRow("语言", self._lang_spinner)
        settings_layout.add_widget(lang_row)

        root.add_widget(settings_layout)

        # 重置存档按钮
        reset_layout = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.2),
            padding=[dp(40), dp(10)],
        )

        reset_btn = Button(
            text="重置存档",
            font_size=dp(20),
            size_hint=(1, None),
            height=dp(50),
            background_color=(0.8, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
        )
        reset_btn.bind(on_press=self._on_reset_confirm)
        reset_layout.add_widget(reset_btn)

        warning_label = Label(
            text="注意：重置存档将删除所有游戏记录，此操作不可撤销",
            font_size=dp(12),
            color=(0.8, 0.5, 0.5, 1),
            size_hint=(1, None),
            height=dp(30),
        )
        reset_layout.add_widget(warning_label)

        root.add_widget(reset_layout)

        self.add_widget(root)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _sound_toggle_state(self) -> bool:
        """获取音效开关状态。"""
        # TODO: 接入配置系统后读取
        return True

    def _bgm_toggle_state(self) -> bool:
        """获取BGM开关状态。"""
        # TODO: 接入配置系统后读取
        return True

    def _go_back(self, instance=None) -> None:
        """返回主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")

    def on_toggle_sound(self, instance=None) -> None:
        """切换音效开关。"""
        if self._sound_toggle is None:
            return
        is_on = self._sound_toggle.state == "down"
        self._sound_toggle.text = f"音效: {'开' if is_on else '关'}"
        self._sound_toggle.background_color = (
            (0.2, 0.55, 0.3, 1) if is_on else (0.5, 0.2, 0.2, 1)
        )
        # TODO: 接入配置系统后保存

    def on_toggle_bgm(self, instance=None) -> None:
        """切换BGM开关。"""
        if self._bgm_toggle is None:
            return
        is_on = self._bgm_toggle.state == "down"
        self._bgm_toggle.text = f"BGM: {'开' if is_on else '关'}"
        self._bgm_toggle.background_color = (
            (0.2, 0.55, 0.3, 1) if is_on else (0.5, 0.2, 0.2, 1)
        )
        # TODO: 接入配置系统后保存

    def _on_language_change(self, instance, value: str) -> None:
        """语言选择变更。"""
        # TODO: 接入配置系统后保存
        pass

    def _on_reset_confirm(self, instance=None) -> None:
        """弹出确认对话框确认重置。"""
        dialog = ConfirmDialog(
            title="重置存档",
            message="确定要重置所有存档吗？此操作不可撤销！",
            on_confirm=self.on_reset_save,
            on_cancel=None,
        )
        dialog.open()

    def on_reset_save(self) -> None:
        """重置存档。"""
        # TODO: 接入存档系统后实现
        pass
