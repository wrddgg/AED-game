"""LeaderboardScreen - 排行榜页面。

展示排名列表，包含名次、玩家、分数、场景信息。
"""

from typing import Any

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen


class _RankRow(BoxLayout):
    """排行榜单行组件。"""

    def __init__(self, rank: int, entry: dict, **kwargs) -> None:
        super().__init__(orientation="horizontal", **kwargs)
        self.size_hint_y = None
        self.height = dp(50)
        self.padding = [dp(8), dp(4)]
        self.spacing = dp(6)

        # 根据名次设置背景色
        rank_colors = {
            1: (0.85, 0.65, 0.1, 0.3),
            2: (0.7, 0.7, 0.72, 0.25),
            3: (0.75, 0.5, 0.3, 0.25),
        }
        bg_color = rank_colors.get(rank, (0.15, 0.18, 0.25, 1))

        with self.canvas.before:
            Color(*bg_color)
            self._row_rect = Rectangle(pos=self.pos, size=self.size)
        self.bind(pos=self._update_rect, size=self._update_rect)

        # 名次
        rank_colors_text = {1: (1, 0.85, 0.1, 1), 2: (0.85, 0.85, 0.88, 1), 3: (0.85, 0.6, 0.35, 1)}
        rank_text_color = rank_colors_text.get(rank, (0.7, 0.75, 0.8, 1))

        rank_label = Label(
            text=f"#{rank}",
            font_size=dp(18),
            bold=True,
            color=rank_text_color,
            size_hint=(0.15, 1),
        )
        self.add_widget(rank_label)

        # 玩家名
        player_label = Label(
            text=entry.get("player", "匿名"),
            font_size=dp(16),
            color=(1, 1, 1, 1),
            size_hint=(0.35, 1),
            halign="left",
            valign="middle",
        )
        player_label.bind(size=player_label.setter("text_size"))
        self.add_widget(player_label)

        # 分数
        score_label = Label(
            text=str(entry.get("score", 0)),
            font_size=dp(18),
            bold=True,
            color=(1, 0.85, 0.3, 1),
            size_hint=(0.25, 1),
        )
        self.add_widget(score_label)

        # 场景
        scenario_label = Label(
            text=entry.get("scenario", ""),
            font_size=dp(14),
            color=(0.65, 0.7, 0.75, 1),
            size_hint=(0.25, 1),
            halign="right",
            valign="middle",
        )
        scenario_label.bind(size=scenario_label.setter("text_size"))
        self.add_widget(scenario_label)

    def _update_rect(self, instance, value) -> None:
        self._row_rect.pos = instance.pos
        self._row_rect.size = instance.size


class LeaderboardScreen(BaseScreen):
    """排行榜页面：展示玩家排名。"""

    scene_id: str = "leaderboard"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._list_container: GridLayout | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        """构建排行榜 UI。"""
        root = BoxLayout(orientation="vertical", spacing=dp(10), padding=[dp(16), dp(10)])

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
            text="排行榜",
            font_size=dp(26),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.75, 1),
        )
        header.add_widget(title)

        root.add_widget(header)

        # 表头
        table_header = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.06),
            padding=[dp(8), dp(2)],
            spacing=dp(6),
        )

        header_labels = [
            ("名次", 0.15),
            ("玩家", 0.35),
            ("分数", 0.25),
            ("场景", 0.25),
        ]
        for text, width_hint in header_labels:
            h_label = Label(
                text=text,
                font_size=dp(14),
                bold=True,
                color=(0.6, 0.65, 0.7, 1),
                size_hint=(width_hint, 1),
            )
            if text in ("玩家", "场景"):
                h_label.halign = "left" if text == "玩家" else "right"
                h_label.bind(size=h_label.setter("text_size"))
            table_header.add_widget(h_label)

        root.add_widget(table_header)

        # 可滚动的排行列表
        scroll = ScrollView(size_hint=(1, 0.86))
        self._list_container = GridLayout(
            cols=1,
            spacing=dp(4),
            size_hint_y=None,
            padding=[dp(4), dp(2)],
        )
        self._list_container.bind(
            minimum_height=self._list_container.setter("height")
        )
        scroll.add_widget(self._list_container)
        root.add_widget(scroll)

        self.add_widget(root)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _go_back(self, instance=None) -> None:
        """返回主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")

    def update(self, data: dict) -> None:
        """接收排行数据并渲染。

        Args:
            data: 包含 entries 键的字典，值为排行条目列表。
        """
        if self._list_container is None:
            return

        self._list_container.clear_widgets()
        entries = data.get("entries", [])

        for idx, entry in enumerate(entries, start=1):
            row = _RankRow(idx, entry)
            self._list_container.add_widget(row)

        if not entries:
            empty_label = Label(
                text="暂无排行数据",
                font_size=dp(18),
                color=(0.6, 0.6, 0.65, 1),
                size_hint_y=None,
                height=dp(80),
            )
            self._list_container.add_widget(empty_label)

    def on_enter(self, *args) -> None:
        """进入页面时自动加载排行榜。"""
        try:
            from src.services.leaderboard_service import LeaderboardService
            service = LeaderboardService()
            entries = service.fetch_top_list(20)
            self.update({"entries": entries})
        except Exception:
            self.update({"entries": []})
