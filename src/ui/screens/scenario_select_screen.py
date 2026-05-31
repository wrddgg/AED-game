"""ScenarioSelectScreen - 场景选择页面。

显示可用场景列表，每个场景包含名称、描述、难度和背景缩略图。
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


class _ScenarioCard(BoxLayout):
    """单个场景卡片组件。"""

    def __init__(self, scenario_data: dict, on_select, **kwargs) -> None:
        super().__init__(orientation="vertical", **kwargs)
        self.scenario_id: str = scenario_data.get("id", "")
        self.size_hint_y = None
        self.height = dp(140)
        self.padding = [dp(10), dp(8)]
        self.spacing = dp(4)

        # 卡片背景
        with self.canvas.before:
            Color(0.18, 0.22, 0.3, 1)
            self._card_rect = Rectangle(pos=self.pos, size=self.size)
        self.bind(pos=self._update_rect, size=self._update_rect)

        # 场景名称
        name_label = Label(
            text=scenario_data.get("name", "未知场景"),
            font_size=dp(20),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(1, 0.3),
            halign="left",
            valign="middle",
        )
        name_label.bind(size=name_label.setter("text_size"))
        self.add_widget(name_label)

        # 场景描述
        desc_label = Label(
            text=scenario_data.get("description", ""),
            font_size=dp(14),
            color=(0.7, 0.75, 0.8, 1),
            size_hint=(1, 0.35),
            halign="left",
            valign="top",
        )
        desc_label.bind(size=desc_label.setter("text_size"))
        self.add_widget(desc_label)

        # 底部：难度 + 选择按钮
        bottom = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.3),
            spacing=dp(8),
        )

        difficulty = scenario_data.get("difficulty", "普通")
        diff_colors = {
            "简单": (0.3, 0.8, 0.3, 1),
            "普通": (0.9, 0.75, 0.2, 1),
            "困难": (0.9, 0.3, 0.3, 1),
        }
        diff_color = diff_colors.get(difficulty, (0.7, 0.7, 0.7, 1))

        diff_label = Label(
            text=f"难度: {difficulty}",
            font_size=dp(14),
            color=diff_color,
            size_hint=(0.5, 1),
            halign="left",
            valign="middle",
        )
        diff_label.bind(size=diff_label.setter("text_size"))
        bottom.add_widget(diff_label)

        select_btn = Button(
            text="选择",
            font_size=dp(16),
            size_hint=(0.5, 1),
            background_color=(0.2, 0.55, 0.85, 1),
            color=(1, 1, 1, 1),
        )
        select_btn.bind(on_press=lambda inst: on_select(self.scenario_id))
        bottom.add_widget(select_btn)

        self.add_widget(bottom)

    def _update_rect(self, instance, value) -> None:
        self._card_rect.pos = instance.pos
        self._card_rect.size = instance.size


class ScenarioSelectScreen(BaseScreen):
    """场景选择页面：展示所有可用场景供玩家选择。"""

    scene_id: str = "scenario_select"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._card_container: GridLayout | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        """构建场景选择 UI。"""
        layout = BoxLayout(orientation="vertical", padding=[dp(16), dp(12)], spacing=dp(12))

        # 背景
        with layout.canvas.before:
            Color(0.1, 0.12, 0.18, 1)
            self._bg_rect = Rectangle(pos=layout.pos, size=layout.size)
        layout.bind(pos=self._update_bg, size=self._update_bg)

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
            text="选择场景",
            font_size=dp(26),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(0.75, 1),
        )
        header.add_widget(title)

        layout.add_widget(header)

        # 可滚动的场景卡片列表
        scroll = ScrollView(size_hint=(1, 0.92))
        self._card_container = GridLayout(
            cols=1,
            spacing=dp(12),
            size_hint_y=None,
            padding=[dp(8), dp(4)],
        )
        self._card_container.bind(
            minimum_height=self._card_container.setter("height")
        )
        scroll.add_widget(self._card_container)
        layout.add_widget(scroll)

        self.add_widget(layout)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _go_back(self, instance=None) -> None:
        """返回主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")

    def on_select_scenario(self, scenario_id: str) -> None:
        """选中场景，加载对应剧情。

        Args:
            scenario_id: 场景唯一标识。
        """
        from src.core.globals import navigate_to
        # 将 scenario_id 同时作为 story_id 传递
        # StoryScreen 会尝试加载 {scenario_id}_story.json 和 {scenario_id}.json
        navigate_to("story", {"scenario_id": scenario_id, "story_id": f"{scenario_id}_story"})

    def on_enter(self, *args) -> None:
        """进入页面时自动加载场景列表。"""
        super().on_enter(*args)
        if self._card_container is not None and not self._card_container.children:
            # 默认场景列表
            default_scenarios = [
                {
                    "id": "subway",
                    "name": "地铁站急救",
                    "description": "在地铁站发现有人倒地，你需要判断情况并使用AED进行急救。",
                    "difficulty": "普通",
                },
                {
                    "id": "park",
                    "name": "公园突发",
                    "description": "晨练时有人突然晕倒，四周只有你和几位老人...",
                    "difficulty": "简单",
                },
                {
                    "id": "demo_playtest",
                    "name": "演示：完整急救流程",
                    "description": "体验完整的AED急救流程，从发现病人到使用AED除颤，多个分支和结局等你探索！",
                    "difficulty": "普通",
                },
            ]
            self.update({"scenarios": default_scenarios})

    def update(self, data: dict) -> None:
        """接收场景列表数据并渲染卡片。

        Args:
            data: 包含 scenarios 键的字典，值为场景数据列表。
        """
        if self._card_container is None:
            return

        self._card_container.clear_widgets()
        scenarios = data.get("scenarios", [])
        for scenario in scenarios:
            card = _ScenarioCard(scenario, self.on_select_scenario)
            self._card_container.add_widget(card)

        if not scenarios:
            empty_label = Label(
                text="暂无可用场景",
                font_size=dp(18),
                color=(0.6, 0.6, 0.65, 1),
                size_hint_y=None,
                height=dp(80),
            )
            self._card_container.add_widget(empty_label)
