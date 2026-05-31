"""BootScreen - 启动画面。

显示 Logo + 加载进度条，3秒后自动跳转到主菜单。
"""

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.progressbar import ProgressBar
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen


class BootScreen(BaseScreen):
    """启动画面：展示 Logo 和加载进度，完成后跳转主菜单。"""

    scene_id: str = "boot"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._progress_bar: ProgressBar | None = None
        self._status_label: Label | None = None
        self._loading_steps: int = 0
        self._build_ui()

    def _build_ui(self) -> None:
        """构建启动画面的 UI 布局。"""
        layout = BoxLayout(
            orientation="vertical",
            padding=[dp(40), dp(60)],
            spacing=dp(20),
        )

        # 背景渐变
        with layout.canvas.before:
            Color(0.12, 0.14, 0.2, 1)
            self._bg_rect = Rectangle(pos=layout.pos, size=layout.size)
        layout.bind(pos=self._update_bg, size=self._update_bg)

        # Logo 区域
        logo_label = Label(
            text="AED\n急救大作战",
            font_size=dp(42),
            halign="center",
            valign="middle",
            color=(0.95, 0.3, 0.3, 1),
            size_hint=(1, 0.5),
        )
        layout.add_widget(logo_label)

        # 副标题
        subtitle = Label(
            text="学会急救，拯救生命",
            font_size=dp(18),
            color=(0.7, 0.75, 0.8, 1),
            size_hint=(1, 0.15),
        )
        layout.add_widget(subtitle)

        # 进度条
        self._progress_bar = ProgressBar(
            max=100,
            value=0,
            size_hint=(1, None),
            height=dp(20),
        )
        layout.add_widget(self._progress_bar)

        # 状态文字
        self._status_label = Label(
            text="初始化...",
            font_size=dp(14),
            color=(0.6, 0.65, 0.7, 1),
            size_hint=(1, 0.15),
        )
        layout.add_widget(self._status_label)

        self.add_widget(layout)

    def _update_bg(self, instance, value) -> None:
        """更新背景矩形尺寸。"""
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def on_enter(self, *args) -> None:
        """进入启动画面时开始模拟加载。"""
        self._loading_steps = 0
        Clock.schedule_interval(self._simulate_loading, 0.06)

    def on_leave(self, *args) -> None:
        """离开启动画面时取消定时器。"""
        Clock.unschedule(self._simulate_loading)

    def _simulate_loading(self, dt: float) -> None:
        """模拟加载进度，3秒内完成约50步。"""
        self._loading_steps += 1
        progress = min(self._loading_steps * 2, 100)

        if self._progress_bar is not None:
            self._progress_bar.value = progress

        # 更新状态文字
        status_messages = {
            0: "初始化...",
            20: "加载资源...",
            40: "加载场景配置...",
            60: "初始化音效系统...",
            80: "准备就绪...",
            95: "即将完成...",
        }
        for threshold, msg in sorted(status_messages.items()):
            if progress >= threshold:
                if self._status_label is not None:
                    self._status_label.text = msg

        if progress >= 100:
            Clock.unschedule(self._simulate_loading)
            if self._status_label is not None:
                self._status_label.text = "加载完成!"
            Clock.schedule_once(self._navigate_to_main, 0.3)

    def _navigate_to_main(self, dt: float) -> None:
        """跳转到主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")
