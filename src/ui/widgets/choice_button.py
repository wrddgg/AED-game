"""选项按钮组件模块

提供剧情选择按钮组件，支持选项高亮、选中动画和禁用状态，
用于故事场景中的分支选择交互。
"""

from typing import Any, Callable, Optional

from kivy.animation import Animation
from kivy.clock import Clock
from kivy.graphics import Color, RoundedRectangle, Line
from kivy.metrics import dp, sp
from kivy.properties import StringProperty, BooleanProperty, NumericProperty, DictProperty
from kivy.uix.button import Button
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label


class ChoiceButton(BoxLayout):
    """剧情选项按钮组件

    显示选项文本和可选的提示标签，支持点击选中动画和禁用状态。
    选中后触发回调，并视觉上标记为已选。
    """

    choice_id = StringProperty("")
    choice_text = StringProperty("")
    is_selected = BooleanProperty(False)
    is_disabled = BooleanProperty(False)
    is_correct = BooleanProperty(False)
    choice_data = DictProperty({})

    # 颜色配置
    _bg_normal = (0.15, 0.15, 0.2, 1.0)
    _bg_selected = (0.2, 0.5, 0.9, 1.0)
    _bg_disabled = (0.3, 0.3, 0.3, 0.5)
    _bg_hover = (0.25, 0.25, 0.35, 1.0)
    _border_normal = (0.4, 0.4, 0.5, 1.0)
    _border_selected = (0.3, 0.6, 1.0, 1.0)
    _text_normal = (1.0, 1.0, 1.0, 1.0)
    _text_disabled = (0.6, 0.6, 0.6, 0.7)

    def __init__(
        self,
        choice_id: str = "",
        choice_text: str = "",
        on_select: Optional[Callable[[str, dict], None]] = None,
        choice_data: Optional[dict] = None,
        **kwargs: Any,
    ) -> None:
        """初始化选项按钮

        Args:
            choice_id: 选项唯一标识
            choice_text: 选项显示文本
            on_select: 选中回调，参数为 (choice_id, choice_data)
            choice_data: 选项附加数据
        """
        super().__init__(orientation="horizontal", **kwargs)
        self.choice_id = choice_id
        self.choice_text = choice_text
        self._on_select = on_select
        self.choice_data = choice_data or {}

        self.size_hint = (1, None)
        self.height = dp(56)
        self.padding = [dp(12), dp(8)]
        self.spacing = dp(8)

        self._build_ui()
        self._draw_background()

    def _build_ui(self) -> None:
        """构建内部 UI 结构。"""
        self._label = Label(
            text=self.choice_text,
            font_size=sp(16),
            color=self._text_normal,
            halign="left",
            valign="middle",
            size_hint=(1, 1),
        )
        self._label.bind(size=self._label.setter("text_size"))
        self.add_widget(self._label)

    def _draw_background(self) -> None:
        """绘制背景和边框。"""
        self.canvas.before.clear()
        with self.canvas.before:
            bg_color = self._bg_disabled if self.is_disabled else (
                self._bg_selected if self.is_selected else self._bg_normal
            )
            self._bg_rect_color = Color(*bg_color)
            self._bg_rect = RoundedRectangle(
                pos=self.pos,
                size=self.size,
                radius=[dp(8)],
            )

            border_color = self._border_selected if self.is_selected else self._border_normal
            self._border_color = Color(*border_color)
            self._border_line = Line(
                rounded_rectangle=(
                    self.pos[0], self.pos[1],
                    self.size[0], self.size[1],
                    dp(8),
                ),
                width=dp(1.5),
            )

        self.bind(pos=self._update_canvas, size=self._update_canvas)

    def _update_canvas(self, *args: Any) -> None:
        """更新 canvas 位置和大小。"""
        self._bg_rect.pos = self.pos
        self._bg_rect.size = self.size
        self._border_line.rounded_rectangle = (
            self.pos[0], self.pos[1],
            self.size[0], self.size[1],
            dp(8),
        )

    def on_touch_down(self, touch) -> bool:
        """处理点击事件

        Args:
            touch: 触摸事件

        Returns:
            是否消费了事件
        """
        if not self.collide_point(*touch.pos):
            return False

        if self.is_disabled or self.is_selected:
            return True

        self._select()
        return True

    def _select(self) -> None:
        """执行选中操作。"""
        self.is_selected = True
        self._draw_background()
        self._label.color = self._text_normal

        # 选中动画：高度微缩再恢复
        anim = Animation(height=dp(48), duration=0.06) + \
               Animation(height=dp(56), duration=0.06)
        anim.start(self)

        if self._on_select:
            self._on_select(self.choice_id, self.choice_data)

    def set_disabled(self, disabled: bool) -> None:
        """设置禁用状态

        Args:
            disabled: 是否禁用
        """
        self.is_disabled = disabled
        self._draw_background()
        self._label.color = self._text_disabled if disabled else self._text_normal

    def reset(self) -> None:
        """重置按钮状态。"""
        self.is_selected = False
        self.is_disabled = False
        self._draw_background()
        self._label.color = self._text_normal
