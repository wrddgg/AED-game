"""StoryScreen - 核心剧情展示页面。

这是最复杂的场景页面，用于展示视频/动画/文本内容，并提供选项交互。
布局：顶部状态栏+帮助按钮，中部内容展示区，底部选项按钮区。

支持直接从 JSON 文件加载剧情图，实现完整的流程控制：
- text 节点：显示文本，点击"继续"跳转到 next_node
- choice 节点：显示文本+选项按钮，选择后跳转
- branch 节点：根据条件自动跳转
- end 节点：显示结局
- video 节点：显示视频（占位，无视频时降级为文本）
- minigame 节点：触发小游戏
"""

import json
import os
from typing import Any, Optional

from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.clock import Clock
from kivy.metrics import dp
from kivy.graphics import Color, Rectangle

from src.ui.screens.base_screen import BaseScreen
from src.ui.widgets.countdown_widget import CountdownWidget
from src.ui.widgets.choice_button import ChoiceButton
from src.ui.fonts import DEFAULT_FONT_NAME


# 项目根目录
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class StoryScreen(BaseScreen):
    """核心剧情展示页面：从 JSON 加载剧情图，驱动完整游戏流程。"""

    scene_id: str = "story"

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._countdown: CountdownWidget | None = None
        self._content_area: BoxLayout | None = None
        self._choices_area: BoxLayout | None = None
        self._feedback_label: Label | None = None
        self._title_label: Label | None = None
        self._status_label: Label | None = None

        # 剧情运行时状态
        self._story_data: dict = {}          # 原始 JSON 数据
        self._variables: dict = {}           # 变量存储
        self._current_node_id: str = ""      # 当前节点 ID
        self._current_node: dict = {}        # 当前节点数据
        self._node_history: list = []        # 走过的节点历史
        self._is_playing: bool = False       # 是否正在播放

        self._build_ui()

    def _build_ui(self) -> None:
        """构建剧情页面 UI。"""
        root = BoxLayout(orientation="vertical", spacing=dp(6), padding=[dp(10), dp(8)])

        # 背景
        with root.canvas.before:
            Color(0.06, 0.08, 0.12, 1)
            self._bg_rect = Rectangle(pos=root.pos, size=root.size)
        root.bind(pos=self._update_bg, size=self._update_bg)

        # 顶部状态栏
        top_bar = BoxLayout(
            orientation="horizontal",
            size_hint=(1, 0.06),
            spacing=dp(8),
        )

        self._status_label = Label(
            text="",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(12),
            color=(0.6, 0.65, 0.7, 1),
            size_hint=(0.7, 1),
            halign="left",
            valign="middle",
        )
        self._status_label.bind(size=self._status_label.setter("text_size"))
        top_bar.add_widget(self._status_label)

        help_btn = Button(
            text="帮助",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(14),
            size_hint=(0.15, 1),
            background_color=(0.25, 0.3, 0.4, 1),
            color=(1, 1, 1, 1),
        )
        help_btn.bind(on_press=self._on_help)
        top_bar.add_widget(help_btn)

        back_btn = Button(
            text="退出",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(14),
            size_hint=(0.15, 1),
            background_color=(0.5, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
        )
        back_btn.bind(on_press=self._go_back)
        top_bar.add_widget(back_btn)

        root.add_widget(top_bar)

        # 标题行
        self._title_label = Label(
            text="",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(22),
            bold=True,
            color=(0.95, 0.95, 1.0, 1),
            size_hint=(1, 0.07),
            halign="center",
            valign="middle",
        )
        self._title_label.bind(size=self._title_label.setter("text_size"))
        root.add_widget(self._title_label)

        # 反馈标签
        self._feedback_label = Label(
            text="",
            font_name=DEFAULT_FONT_NAME,
            font_size=dp(16),
            color=(1, 1, 0.5, 1),
            size_hint=(1, 0.05),
            halign="center",
            valign="middle",
        )
        self._feedback_label.bind(size=self._feedback_label.setter("text_size"))
        root.add_widget(self._feedback_label)

        # 中部：内容展示区（可滚动）
        content_scroll = ScrollView(size_hint=(1, 0.55))
        self._content_area = BoxLayout(
            orientation="vertical",
            size_hint_y=None,
            spacing=dp(8),
            padding=[dp(10), dp(6)],
        )
        self._content_area.bind(
            minimum_height=self._content_area.setter("height")
        )
        content_scroll.add_widget(self._content_area)
        root.add_widget(content_scroll)

        # 底部：选项按钮区域
        self._choices_area = BoxLayout(
            orientation="vertical",
            size_hint=(1, 0.27),
            spacing=dp(8),
            padding=[dp(8), dp(4)],
        )
        root.add_widget(self._choices_area)

        self.add_widget(root)

    # ─────────────────────────────────────────────
    # 剧情加载与流程控制
    # ─────────────────────────────────────────────

    def load_story_json(self, story_id: str) -> bool:
        """从 JSON 文件加载剧情图。

        Args:
            story_id: 剧情 ID（对应 configs/stories/ 下的 JSON 文件名）

        Returns:
            是否加载成功
        """
        # 尝试多个路径
        candidates = [
            os.path.join(_PROJECT_ROOT, "configs", "stories", f"{story_id}.json"),
            os.path.join(_PROJECT_ROOT, "configs", "stories", f"{story_id}_story.json"),
        ]

        story_path = None
        for path in candidates:
            if os.path.isfile(path):
                story_path = path
                break

        if story_path is None:
            print(f"[StoryScreen] 找不到剧情文件: {story_id}")
            self._show_error(f"找不到剧情文件: {story_id}")
            return False

        try:
            with open(story_path, "r", encoding="utf-8") as f:
                self._story_data = json.load(f)
        except Exception as e:
            print(f"[StoryScreen] 加载剧情文件失败: {e}")
            self._show_error(f"加载剧情失败: {e}")
            return False

        # 初始化变量
        self._variables = dict(self._story_data.get("variables", {}))

        # 获取起始节点
        start_node_id = self._story_data.get("start_node", "")
        if not start_node_id:
            self._show_error("剧情配置缺少 start_node")
            return False

        self._is_playing = True
        self._node_history = []
        self._goto_node(start_node_id)
        return True

    def _goto_node(self, node_id: str) -> None:
        """跳转到指定节点并渲染。

        Args:
            node_id: 目标节点 ID
        """
        nodes = self._story_data.get("nodes", {})
        node_data = nodes.get(node_id)

        if node_data is None:
            self._show_error(f"节点不存在: {node_id}")
            return

        # 记录历史
        self._node_history.append(node_id)
        self._current_node_id = node_id
        self._current_node = node_data

        # 执行节点进入动作
        self._execute_actions(node_data.get("actions", []))

        # 更新状态栏
        self._update_status_bar()

        # 渲染节点
        self._render_node(node_data)

    def _render_node(self, node_data: dict) -> None:
        """根据节点类型渲染 UI。

        Args:
            node_data: 节点数据字典
        """
        node_type = node_data.get("type", "text")
        title = node_data.get("title", "")

        # 清空内容区
        if self._content_area is not None:
            self._content_area.clear_widgets()
        if self._choices_area is not None:
            self._choices_area.clear_widgets()

        # 设置标题
        if self._title_label is not None:
            self._title_label.text = title

        # 根据类型渲染
        if node_type == "text":
            self._render_text_node(node_data)
        elif node_type == "video":
            # 无视频文件时降级为文本+继续按钮
            self._render_text_node(node_data)
        elif node_type == "choice":
            self._render_choice_node(node_data)
        elif node_type == "branch":
            self._handle_branch_node(node_data)
        elif node_type == "end":
            self._render_end_node(node_data)
        elif node_type == "minigame":
            self._render_minigame_node(node_data)

    def _render_text_node(self, node_data: dict) -> None:
        """渲染文本节点：显示内容 + "继续"按钮。"""
        text = node_data.get("text", "")
        if text and self._content_area is not None:
            text_label = Label(
                text=text,
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(17),
                color=(0.9, 0.92, 0.95, 1),
                size_hint=(1, None),
                height=max(dp(100), len(text) * dp(2.2)),
                halign="left",
                valign="top",
                text_size=(None, None),
            )
            text_label.bind(
                width=lambda inst, val: setattr(inst, "text_size", (val, None)),
            )
            self._content_area.add_widget(text_label)

        # 继续按钮
        next_node = node_data.get("next_node", "")
        if next_node and self._choices_area is not None:
            continue_btn = Button(
                text="继续 ▶",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(18),
                size_hint=(0.5, None),
                height=dp(50),
                pos_hint={"center_x": 0.5},
                background_color=(0.2, 0.45, 0.75, 1),
                color=(1, 1, 1, 1),
            )
            continue_btn.bind(
                on_press=lambda inst, nn=next_node: self._goto_node(nn)
            )
            self._choices_area.add_widget(continue_btn)

    def _render_choice_node(self, node_data: dict) -> None:
        """渲染选择节点：显示内容 + 选项按钮。"""
        text = node_data.get("text", "")
        if text and self._content_area is not None:
            text_label = Label(
                text=text,
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(17),
                color=(0.9, 0.92, 0.95, 1),
                size_hint=(1, None),
                height=max(dp(80), len(text) * dp(2.2)),
                halign="left",
                valign="top",
            )
            text_label.bind(
                width=lambda inst, val: setattr(inst, "text_size", (val, None)),
            )
            self._content_area.add_widget(text_label)

        # 渲染选项
        choices = node_data.get("choices", [])
        if choices and self._choices_area is not None:
            for choice in choices:
                # 检查选项条件
                conditions = choice.get("conditions", [])
                if conditions and not self._evaluate_conditions(conditions):
                    continue

                choice_btn = ChoiceButton(
                    choice_id=choice.get("choice_id", ""),
                    choice_text=choice.get("text", ""),
                    is_correct=choice.get("is_correct", False),
                    choice_data=choice,
                    on_select=self._on_choice_select,
                    size_hint=(1, None),
                    height=dp(52),
                )
                self._choices_area.add_widget(choice_btn)

    def _render_end_node(self, node_data: dict) -> None:
        """渲染结局节点。"""
        text = node_data.get("text", "")
        title = node_data.get("title", "故事结束")
        tags = node_data.get("tags", [])

        # 根据结局标签决定颜色
        if "hero" in tags or "good" in tags:
            end_color = (0.3, 0.9, 0.4, 1)
            end_emoji = "🌟"
        elif "tragedy" in tags or "bad" in tags:
            end_color = (0.9, 0.3, 0.3, 1)
            end_emoji = "💔"
        else:
            end_color = (0.9, 0.85, 0.3, 1)
            end_emoji = "⭐"

        if self._content_area is not None:
            end_label = Label(
                text=f"{end_emoji} {title} {end_emoji}\n\n{text}",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(19),
                color=end_color,
                size_hint=(1, None),
                height=dp(220),
                halign="center",
                valign="middle",
            )
            end_label.bind(size=end_label.setter("text_size"))
            self._content_area.add_widget(end_label)

        # 统计信息
        if self._content_area is not None:
            stats_text = self._build_stats_text()
            stats_label = Label(
                text=stats_text,
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(14),
                color=(0.6, 0.65, 0.7, 1),
                size_hint=(1, None),
                height=dp(80),
                halign="center",
                valign="top",
            )
            stats_label.bind(size=stats_label.setter("text_size"))
            self._content_area.add_widget(stats_label)

        # 底部按钮
        if self._choices_area is not None:
            btn_row = BoxLayout(
                orientation="horizontal",
                size_hint=(1, None),
                height=dp(50),
                spacing=dp(12),
            )

            # 重玩按钮
            replay_btn = Button(
                text="重新开始",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(16),
                background_color=(0.2, 0.6, 0.3, 1),
                color=(1, 1, 1, 1),
            )
            replay_btn.bind(on_press=self._replay_story)
            btn_row.add_widget(replay_btn)

            # 返回主菜单
            menu_btn = Button(
                text="返回主菜单",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(16),
                background_color=(0.3, 0.3, 0.4, 1),
                color=(1, 1, 1, 1),
            )
            menu_btn.bind(on_press=self._go_back)
            btn_row.add_widget(menu_btn)

            self._choices_area.add_widget(btn_row)

    def _render_minigame_node(self, node_data: dict) -> None:
        """渲染小游戏节点。"""
        text = node_data.get("text", "")
        if text and self._content_area is not None:
            text_label = Label(
                text=text,
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(17),
                color=(0.9, 0.92, 0.95, 1),
                size_hint=(1, None),
                height=max(dp(80), len(text) * dp(2.2)),
                halign="left",
                valign="top",
            )
            text_label.bind(
                width=lambda inst, val: setattr(inst, "text_size", (val, None)),
            )
            self._content_area.add_widget(text_label)

        if self._content_area is not None:
            info_label = Label(
                text="即将进入小游戏挑战！",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(22),
                color=(1, 0.85, 0.3, 1),
                size_hint=(1, None),
                height=dp(60),
                halign="center",
                valign="middle",
            )
            self._content_area.add_widget(info_label)

        if self._choices_area is not None:
            # 迷宫入口按钮
            maze_btn = Button(
                text="开始迷宫挑战",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(20),
                size_hint=(0.6, None),
                height=dp(50),
                pos_hint={"center_x": 0.5},
                background_color=(0.2, 0.6, 0.3, 1),
                color=(1, 1, 1, 1),
            )
            maze_btn.bind(on_press=lambda inst: self._navigate_to_maze(node_data))
            self._choices_area.add_widget(maze_btn)

    def _handle_branch_node(self, node_data: dict) -> None:
        """处理分支节点：根据条件自动跳转。"""
        branch_conditions = node_data.get("branch_conditions", [])
        default_node = node_data.get("default_node", node_data.get("next_node", ""))

        for branch in branch_conditions:
            conditions = branch.get("conditions", [])
            if self._evaluate_conditions(conditions):
                next_node = branch.get("next_node", "")
                if next_node:
                    # 延迟一帧跳转，避免 UI 刷新问题
                    Clock.schedule_once(lambda dt, nn=next_node: self._goto_node(nn), 0.1)
                    return

        # 没有条件匹配，走默认
        if default_node:
            Clock.schedule_once(lambda dt: self._goto_node(default_node), 0.1)
        else:
            self._show_error("分支节点没有可跳转的目标")

    # ─────────────────────────────────────────────
    # 变量系统 & 条件评估
    # ─────────────────────────────────────────────

    def _execute_actions(self, actions: list) -> None:
        """执行动作列表。

        Args:
            actions: ActionData 字典列表
        """
        for action in actions:
            action_type = action.get("type", "")
            key = action.get("key", "")
            value = action.get("value")

            if action_type == "set_var":
                self._variables[key] = value
            elif action_type == "add_var":
                current = self._variables.get(key, 0)
                self._variables[key] = current + (value if isinstance(value, (int, float)) else 0)
            elif action_type == "sub_var":
                current = self._variables.get(key, 0)
                self._variables[key] = current - (value if isinstance(value, (int, float)) else 0)
            elif action_type == "set_flag":
                self._variables[key] = value if value is not None else True
            elif action_type == "remove_flag":
                self._variables.pop(key, None)
            elif action_type == "write_record":
                # 记录到变量中
                self._variables[f"record_{key}"] = value

    def _evaluate_conditions(self, conditions: list) -> bool:
        """评估条件列表（AND 关系，所有条件都满足才返回 True）。

        Args:
            conditions: ConditionData 字典列表

        Returns:
            是否全部满足
        """
        if not conditions:
            return True

        for cond in conditions:
            if not self._evaluate_single_condition(cond):
                return False
        return True

    def _evaluate_single_condition(self, cond: dict) -> bool:
        """评估单个条件。

        Args:
            cond: 条件字典

        Returns:
            是否满足
        """
        cond_type = cond.get("type", "")
        key = cond.get("key", "")
        operator = cond.get("operator", "eq")
        value = cond.get("value")

        if cond_type == "var_compare":
            current = self._variables.get(key, 0)
            return self._compare(current, operator, value)

        elif cond_type == "flag_set":
            return key in self._variables and self._variables[key] is not None and self._variables[key] is not False

        elif cond_type == "flag_not_set":
            return key not in self._variables or self._variables[key] is False or self._variables[key] is None

        # 嵌套逻辑
        elif cond_type == "and":
            and_conds = cond.get("and_conditions", [])
            return all(self._evaluate_single_condition(c) for c in and_conds)

        elif cond_type == "or":
            or_conds = cond.get("or_conditions", [])
            return any(self._evaluate_single_condition(c) for c in or_conds)

        elif cond_type == "not":
            not_cond = cond.get("not_condition")
            if not_cond:
                return not self._evaluate_single_condition(not_cond)
            return True

        return True

    @staticmethod
    def _compare(current, operator: str, target) -> bool:
        """比较两个值。"""
        try:
            if operator == "eq":
                return current == target
            elif operator == "neq":
                return current != target
            elif operator == "gt":
                return float(current) > float(target)
            elif operator == "lt":
                return float(current) < float(target)
            elif operator == "gte":
                return float(current) >= float(target)
            elif operator == "lte":
                return float(current) <= float(target)
        except (TypeError, ValueError):
            return False
        return False

    # ─────────────────────────────────────────────
    # 交互回调
    # ─────────────────────────────────────────────

    def _on_choice_select(self, choice_id: str, choice_data: dict) -> None:
        """玩家选择某个选项后的回调。

        Args:
            choice_id: 选项ID
            choice_data: 选项数据
        """
        # 显示反馈
        feedback = choice_data.get("feedback_text", "")
        if feedback:
            self.show_feedback(feedback)

        # 执行选项效果
        effects = choice_data.get("effects", [])
        self._execute_actions(effects)

        # 禁用所有选项按钮
        if self._choices_area is not None:
            for child in self._choices_area.children:
                if hasattr(child, "set_disabled"):
                    child.set_disabled(True)

        # 延迟跳转到下一个节点（让玩家看到反馈）
        next_node = choice_data.get("next_node", "")
        if next_node:
            Clock.schedule_once(lambda dt, nn=next_node: self._goto_node(nn), 1.2)

    def _replay_story(self, instance=None) -> None:
        """重新开始当前剧情。"""
        if self._story_data:
            self._variables = dict(self._story_data.get("variables", {}))
            self._node_history = []
            start_node = self._story_data.get("start_node", "")
            if start_node:
                self._goto_node(start_node)

    # ─────────────────────────────────────────────
    # UI 辅助
    # ─────────────────────────────────────────────

    def _update_status_bar(self) -> None:
        """更新顶部状态栏。"""
        if self._status_label is None:
            return

        confidence = self._variables.get("confidence", 0)
        knowledge = self._variables.get("knowledge", 0)
        time_pressure = self._variables.get("time_pressure", 0)
        step = len(self._node_history)

        self._status_label.text = (
            f"信心:{confidence}  知识:{knowledge}  "
            f"紧迫:{time_pressure}  步骤:{step}"
        )

    def _build_stats_text(self) -> str:
        """构建结局统计文本。"""
        confidence = self._variables.get("confidence", 0)
        knowledge = self._variables.get("knowledge", 0)
        time_pressure = self._variables.get("time_pressure", 0)
        steps = len(self._node_history)
        called_120 = "✓" if self._variables.get("called_120") else "✗"
        started_cpr = "✓" if self._variables.get("started_cpr") else "✗"
        found_aed = "✓" if self._variables.get("found_aed") else "✗"
        used_aed = "✓" if self._variables.get("used_aed") else "✗"

        return (
            f"─── 本次行动统计 ───\n"
            f"信心: {confidence}  |  知识: {knowledge}  |  紧迫: {time_pressure}\n"
            f"拨打120: {called_120}  |  CPR: {started_cpr}  |  找到AED: {found_aed}  |  使用AED: {used_aed}\n"
            f"总步骤: {steps}"
        )

    def _show_error(self, message: str) -> None:
        """显示错误信息。"""
        if self._content_area is not None:
            self._content_area.clear_widgets()
            error_label = Label(
                text=f"⚠ {message}",
                font_name=DEFAULT_FONT_NAME,
                font_size=dp(16),
                color=(0.9, 0.3, 0.3, 1),
                size_hint=(1, None),
                height=dp(80),
                halign="center",
                valign="middle",
            )
            self._content_area.add_widget(error_label)

    def show_feedback(self, text: str) -> None:
        """显示选择后的即时反馈。

        Args:
            text: 反馈文本。
        """
        if self._feedback_label is None:
            return
        self._feedback_label.text = text
        Clock.schedule_once(lambda dt: self._clear_feedback(), 2.5)

    def _clear_feedback(self) -> None:
        """清除反馈文字。"""
        if self._feedback_label is not None:
            self._feedback_label.text = ""

    # ─────────────────────────────────────────────
    # 导航
    # ─────────────────────────────────────────────

    def _update_bg(self, instance, value) -> None:
        self._bg_rect.pos = instance.pos
        self._bg_rect.size = instance.size

    def _on_help(self, instance=None) -> None:
        """打开帮助弹窗。"""
        from src.ui.dialogs.help_dialog import HelpDialog
        # 使用当前节点的 help_topic
        topic_id = self._current_node.get("help_topic", "story") if self._current_node else "story"
        dialog = HelpDialog(topic_id=topic_id)
        dialog.open()

    def _go_back(self, instance=None) -> None:
        """返回主菜单。"""
        from src.core.globals import navigate_to
        navigate_to("main_menu")

    def _navigate_to_maze(self, node_data: dict) -> None:
        """跳转到迷宫小游戏。"""
        from src.core.globals import navigate_to
        # 传递当前剧情上下文，以便迷宫完成后返回
        navigate_to("maze", {
            "data": node_data,
            "scenario_id": self._story_data.get("graph_id", ""),
            "story_id": self._story_data.get("graph_id", ""),
            "difficulty": "easy",
        })

    def _navigate_to_result(self, instance=None) -> None:
        """跳转到结果页面。"""
        from src.core.globals import navigate_to
        navigate_to("result")

    # ─────────────────────────────────────────────
    # 对外接口
    # ─────────────────────────────────────────────

    def update(self, data: dict) -> None:
        """接收数据更新，触发剧情加载。

        Args:
            data: 可包含以下字段：
                - story_id: 剧情 ID，用于加载 JSON 文件
                - scenario_id: 场景 ID，尝试加载对应剧情
                - go_to_node: 直接跳转到指定节点（迷宫返回等场景）
                - maze_success: 迷宫是否成功（配合 go_to_node 使用）
                - node: 直接传入节点数据（兼容旧接口）
                - remaining: 倒计时更新
        """
        # 优先处理 go_to_node（从迷宫等小游戏返回）
        go_to_node = data.get("go_to_node", "")
        maze_success = data.get("maze_success")

        if go_to_node:
            story_id = data.get("story_id", "")
            scenario_id = data.get("scenario_id", "")

            # 如果已有剧情在播放，直接跳转
            if self._is_playing and self._story_data:
                # 处理迷宫结果：设置变量
                if maze_success is not None:
                    node_data = self._story_data.get("nodes", {}).get(go_to_node, {})
                    # 根据迷宫结果执行对应效果
                    if maze_success:
                        # 成功：设置 found_aed 标志
                        self._variables["found_aed"] = True
                        self._variables["used_aed"] = True
                        self._variables["confidence"] = self._variables.get("confidence", 0) + 15
                        self.show_feedback("成功找到并使用了AED！信心+15")
                    else:
                        # 失败：增加紧迫感
                        self._variables["time_pressure"] = self._variables.get("time_pressure", 0) + 25
                        self._variables["confidence"] = self._variables.get("confidence", 0) - 10
                        self.show_feedback("未能在限时内找到AED...紧迫+25 信心-10")

                self._goto_node(go_to_node)
                return

            # 如果没有剧情在播放，先加载剧情再跳转
            if story_id:
                self.load_story_json(story_id)
                if go_to_node and self._is_playing:
                    self._goto_node(go_to_node)
                return
            if scenario_id:
                if not self.load_story_json(f"{scenario_id}_story"):
                    self.load_story_json(scenario_id)
                if go_to_node and self._is_playing:
                    self._goto_node(go_to_node)
                return

        # 处理 story_id / scenario_id
        story_id = data.get("story_id", "")
        scenario_id = data.get("scenario_id", "")

        if story_id and not self._is_playing:
            self.load_story_json(story_id)
            return

        if scenario_id and not self._is_playing:
            # 尝试从 scenario_id 推导 story_id
            # 先尝试 scenario_id + "_story"，再尝试直接用 scenario_id
            if not self.load_story_json(f"{scenario_id}_story"):
                self.load_story_json(scenario_id)
            return

        # 兼容旧接口
        node_data = data.get("node")
        if node_data:
            self._render_node(node_data)

        remaining = data.get("remaining")
        if remaining is not None:
            if self._countdown is not None:
                self._countdown.remaining = float(remaining)

    def on_enter(self, *args) -> None:
        """进入页面时自动加载默认剧情（如果尚未加载）。"""
        super().on_enter(*args)
        if not self._is_playing:
            # 默认加载 demo_playtest 剧情
            self.load_story_json("demo_playtest_story")

    def on_leave(self, *args) -> None:
        """离开页面时暂停。"""
        super().on_leave(*args)
