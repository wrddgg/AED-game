"""ResultScreen - 结果结算页面。

展示评级、分数、用时、正确步骤、失误总结和建议。
"""

from typing import Any

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen


class ResultScreen(BaseScreen):
    """结果结算页面：展示游戏结束后的详细分析。"""

    scene_id: str = "result"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._content_area: BoxLayout | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        """构建结果页面 UI。"""
        root = BoxLayout(orientation="vertical", spacing=dp(10), padding=[dp(16), dp(12)])

        # 背景
        with root.canvas.before:
            Color(0.1, 0.12, 0.18, 1)
            self._bg_rect = Rectangle(pos=root.pos, size=root.size)
        root.bind(pos=self._update_bg, size=self._update_bg)

        # 标题
        title = Label(
            text="结算报告",
            font_size=dp(30),
            bold=True,
            color=(1, 1, 1, 1),
            size_hint=(1, 0.08),
        )
        root.add_widget(title)

        # 可滚动内容区
        scroll = ScrollView(size_hint=(1, 0.72))
        self._content_area = BoxLayout(
            orientation="vertical",
            size_hint_y=None,
            spacing=dp(10),
            padding=[dp(8), dp(4)],
        )
        self._content_area.bind(
            minimum_height=self._content_area.setter("height")
        )
        scroll.add_widget(self._content_area)
        root.add_widget(scroll)

        # 底部按钮
        btn_layout = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.12),
            spacing=dp(10),
            padding=[dp(8), dp(4)],
        )

        replay_btn = Button(
            text="重玩",
            font_size=dp(18),
            background_color=(0.2, 0.6, 0.3, 1),
            color=(1, 1, 1, 1),
        )
        replay_btn.bind(on_press=self._on_replay)
        btn_layout.add_widget(replay_btn)

        menu_btn = Button(
            text="回主菜单",
            font_size=dp(18),
            background_color=(0.2, 0.45, 0.7, 1),
            color=(1, 1, 1, 1),
        )
        menu_btn.bind(on_press=self._on_main_menu)
        btn_layout.add_widget(menu_btn)

        history_btn = Button(
            text="查看历史",
            font_size=dp(18),
            background_color=(0.45, 0.35, 0.65, 1),
            color=(1, 1, 1, 1),
        )
        history_btn.bind(on_press=self._on_history)
        btn_layout.add_widget(history_btn)

        root.add_widget(btn_layout)
        self.add_widget(root)

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _navigate(self, screen_id: str) -> None:
        """导航到指定场景。"""
        from src.core.globals import navigate_to
        navigate_to(screen_id)

    def _on_replay(self, instance=None) -> None:
        """重玩当前场景。"""
        self._navigate("story")

    def _on_main_menu(self, instance=None) -> None:
        """返回主菜单。"""
        self._navigate("main_menu")

    def _on_history(self, instance=None) -> None:
        """查看历史记录。"""
        self._navigate("history")

    def display_result(self, analysis: dict) -> None:
        """渲染结算数据。

        Args:
            analysis: 结算分析数据，包含评级、分数、时间等字段。
        """
        if self._content_area is None:
            return

        self._content_area.clear_widgets()

        # 评级
        grade = analysis.get("grade", "C")
        grade_colors = {
            "S": (1, 0.85, 0.1, 1),
            "A": (0.3, 0.85, 0.4, 1),
            "B": (0.3, 0.7, 1, 1),
            "C": (0.9, 0.75, 0.2, 1),
            "D": (0.9, 0.3, 0.3, 1),
        }
        grade_color = grade_colors.get(grade, (0.9, 0.85, 0.3, 1))

        grade_label = Label(
            text=f"评级: {grade}",
            font_size=dp(48),
            bold=True,
            color=grade_color,
            size_hint=(1, None),
            height=dp(80),
        )
        self._content_area.add_widget(grade_label)

        # 分数
        score = analysis.get("score", 0)
        score_label = Label(
            text=f"得分: {score}",
            font_size=dp(26),
            color=(1, 1, 1, 1),
            size_hint=(1, None),
            height=dp(50),
        )
        self._content_area.add_widget(score_label)

        # 用时
        time_taken = analysis.get("time", 0)
        time_str = f"{time_taken:.1f}秒" if isinstance(time_taken, float) else f"{time_taken}秒"
        time_label = Label(
            text=f"用时: {time_str}",
            font_size=dp(20),
            color=(0.7, 0.75, 0.8, 1),
            size_hint=(1, None),
            height=dp(40),
        )
        self._content_area.add_widget(time_label)

        # 正确步骤
        correct_steps = analysis.get("correct_steps", 0)
        total_steps = analysis.get("total_steps", 0)
        steps_label = Label(
            text=f"正确步骤: {correct_steps}/{total_steps}",
            font_size=dp(20),
            color=(0.3, 0.85, 0.4, 1),
            size_hint=(1, None),
            height=dp(40),
        )
        self._content_area.add_widget(steps_label)

        # 失误总结
        mistakes = analysis.get("mistakes", [])
        if mistakes:
            mistake_title = Label(
                text="失误总结:",
                font_size=dp(20),
                bold=True,
                color=(0.9, 0.3, 0.3, 1),
                size_hint=(1, None),
                height=dp(35),
                halign="left",
                valign="middle",
            )
            mistake_title.bind(size=mistake_title.setter("text_size"))
            self._content_area.add_widget(mistake_title)

            for mistake in mistakes:
                mistake_text = mistake if isinstance(mistake, str) else str(mistake)
                mistake_label = Label(
                    text=f"  - {mistake_text}",
                    font_size=dp(16),
                    color=(0.85, 0.55, 0.55, 1),
                    size_hint=(1, None),
                    height=dp(30),
                    halign="left",
                    valign="middle",
                )
                mistake_label.bind(size=mistake_label.setter("text_size"))
                self._content_area.add_widget(mistake_label)

        # 建议
        suggestions = analysis.get("suggestions", [])
        if suggestions:
            suggest_title = Label(
                text="建议:",
                font_size=dp(20),
                bold=True,
                color=(0.3, 0.7, 1, 1),
                size_hint=(1, None),
                height=dp(35),
                halign="left",
                valign="middle",
            )
            suggest_title.bind(size=suggest_title.setter("text_size"))
            self._content_area.add_widget(suggest_title)

            for suggestion in suggestions:
                sug_text = suggestion if isinstance(suggestion, str) else str(suggestion)
                sug_label = Label(
                    text=f"  - {sug_text}",
                    font_size=dp(16),
                    color=(0.55, 0.75, 0.9, 1),
                    size_hint=(1, None),
                    height=dp(30),
                    halign="left",
                    valign="middle",
                )
                sug_label.bind(size=sug_label.setter("text_size"))
                self._content_area.add_widget(sug_label)

    def update(self, data: dict) -> None:
        """接收结算数据。"""
        analysis = data.get("analysis")
        if analysis:
            self.display_result(analysis)
