"""HistoryScreen - 历史记录页面。

展示玩家的游戏历史记录列表。
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


class _RecordCard(BoxLayout):
    """单条历史记录卡片。"""

    def __init__(self, record: dict, on_select, **kwargs) -> None:
        super().__init__(orientation="vertical", **kwargs)
        self.record_id: str = record.get("id", "")
        self.size_hint_y = None
        self.height = dp(90)
        self.padding = [dp(10), dp(6)]
        self.spacing = dp(3)

        # 卡片背景
        with self.canvas.before:
            Color(0.18, 0.22, 0.3, 1)
            self._card_rect = Rectangle(pos=self.pos, size=self.size)
        self.bind(pos=self._update_rect, size=self._update_rect)

        # 第一行：场景名 + 分数
        row1 = BoxLayout(orientation="horizontal", size_hint=(1, 0.4))
        scene_name = Label(
            text=record.get("scenario_name", "未知场景"),
            font_size=dp(18),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.6, 1),
            halign="left",
            valign="middle",
        )
        scene_name.bind(size=scene_name.setter("text_size"))
        row1.add_widget(scene_name)

        score_label = Label(
            text=f"分数: {record.get('score', 0)}",
            font_size=dp(16),
            color=(1, 0.85, 0.3, 1),
            size_hint=(0.4, 1),
            halign="right",
            valign="middle",
        )
        score_label.bind(size=score_label.setter("text_size"))
        row1.add_widget(score_label)
        self.add_widget(row1)

        # 第二行：结果 + 用时 + 日期
        row2 = BoxLayout(orientation="horizontal", size_hint=(1, 0.35))
        result_text = "成功" if record.get("result") == "success" else "失败"
        result_color = (0.3, 0.85, 0.4, 1) if result_text == "成功" else (0.9, 0.3, 0.3, 1)

        result_label = Label(
            text=result_text,
            font_size=dp(15),
            color=result_color,
            size_hint=(0.3, 1),
            halign="left",
            valign="middle",
        )
        result_label.bind(size=result_label.setter("text_size"))
        row2.add_widget(result_label)

        time_label = Label(
            text=f"用时: {record.get('time', '-')}",
            font_size=dp(14),
            color=(0.7, 0.75, 0.8, 1),
            size_hint=(0.35, 1),
            halign="center",
            valign="middle",
        )
        row2.add_widget(time_label)

        date_label = Label(
            text=record.get("date", ""),
            font_size=dp(14),
            color=(0.6, 0.6, 0.65, 1),
            size_hint=(0.35, 1),
            halign="right",
            valign="middle",
        )
        date_label.bind(size=date_label.setter("text_size"))
        row2.add_widget(date_label)
        self.add_widget(row2)

        # 第三行：查看详情按钮
        detail_btn = Button(
            text="查看详情",
            font_size=dp(14),
            size_hint=(1, 0.25),
            background_color=(0.2, 0.4, 0.6, 1),
            color=(1, 1, 1, 1),
        )
        detail_btn.bind(on_press=lambda inst: on_select(self.record_id))
        self.add_widget(detail_btn)

    def _update_rect(self, instance, value) -> None:
        self._card_rect.pos = instance.pos
        self._card_rect.size = instance.size


class HistoryScreen(BaseScreen):
    """历史记录页面：展示玩家游戏历史。"""

    scene_id: str = "history"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._card_container: GridLayout | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        """构建历史记录页面 UI。"""
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
            text="历史记录",
            font_size=dp(26),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.75, 1),
        )
        header.add_widget(title)

        root.add_widget(header)

        # 可滚动的记录列表
        scroll = ScrollView(size_hint=(1, 0.92))
        self._card_container = GridLayout(
            cols=1,
            spacing=dp(10),
            size_hint_y=None,
            padding=[dp(4), dp(4)],
        )
        self._card_container.bind(
            minimum_height=self._card_container.setter("height")
        )
        scroll.add_widget(self._card_container)
        root.add_widget(scroll)

        self.add_widget(root)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _go_back(self, instance=None) -> None:
        """返回主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")

    def on_select_record(self, record_id: str) -> None:
        """查看记录详情。

        Args:
            record_id: 记录唯一标识。
        """
        from src.ui.dialogs.help_dialog import HelpDialog
        dialog = HelpDialog(topic_id=f"record_{record_id}")
        dialog.open()

    def update(self, data: dict) -> None:
        """接收历史数据并渲染。

        Args:
            data: 包含 records 键的字典，值为记录列表。
        """
        if self._card_container is None:
            return

        self._card_container.clear_widgets()
        records = data.get("records", [])

        for record in records:
            card = _RecordCard(record, self.on_select_record)
            self._card_container.add_widget(card)

        if not records:
            empty_label = Label(
                text="暂无游戏记录",
                font_size=dp(18),
                color=(0.6, 0.6, 0.65, 1),
                size_hint_y=None,
                height=dp(80),
            )
            self._card_container.add_widget(empty_label)

    def on_enter(self, *args) -> None:
        """进入页面时自动加载历史记录。"""
        try:
            from src.services.history_service import HistoryService
            service = HistoryService()
            records = service.list_records()
            self.update({"records": records})
        except Exception:
            self.update({"records": []})
