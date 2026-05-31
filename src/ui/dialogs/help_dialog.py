"""帮助对话框模块

提供帮助/说明信息对话框组件，支持多页展示和滚动文本。
"""

from typing import Callable, List, Optional

from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp, sp
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.modalview import ModalView
from kivy.uix.scrollview import ScrollView


class HelpDialog(ModalView):
    """帮助对话框

    模态对话框，显示帮助信息。支持分页展示多条帮助内容，
    包含上一页/下一页按钮和关闭按钮。
    """

    def __init__(
        self,
        pages: Optional[List[dict]] = None,
        title: str = "帮助",
        topic_id: str = "",
        **kwargs,
    ) -> None:
        """初始化帮助对话框

        Args:
            pages: 帮助页面列表，每项为 {"title": str, "content": str}
            title: 对话框标题
            topic_id: 帮助主题ID（会自动生成默认页面）
        """
        super().__init__(**kwargs)

        # 如果传了 topic_id 但没传 pages，生成默认帮助内容
        if topic_id and not pages:
            pages = _get_help_pages(topic_id)

        self._pages = pages or [{"title": "帮助", "content": "暂无帮助信息"}]
        self._current_page = 0

        self.auto_dismiss = True
        self.size_hint = (0.9, 0.75)
        self.background_color = (0, 0, 0, 0.7)

        self._build_ui(title)

    def _build_ui(self, title: str) -> None:
        """构建对话框 UI

        Args:
            title: 对话框标题
        """
        container = BoxLayout(
            orientation="vertical",
            padding=[dp(20), dp(16)],
            spacing=dp(12),
        )

        with container.canvas.before:
            Color(0.18, 0.18, 0.22, 0.98)
            self._bg_rect = RoundedRectangle(
                pos=container.pos,
                size=container.size,
                radius=[dp(12)],
            )

        container.bind(
            pos=lambda i, v: setattr(self._bg_rect, "pos", v),
            size=lambda i, v: setattr(self._bg_rect, "size", v),
        )

        # 标题行
        header = BoxLayout(
            orientation="horizontal",
            size_hint=(1, None),
            height=dp(36),
        )

        title_label = Label(
            text=title,
            font_size=sp(20),
            bold=True,
            color=(1, 1, 1, 1),
            halign="left",
            valign="middle",
            size_hint=(1, 1),
        )
        title_label.bind(size=title_label.setter("text_size"))
        header.add_widget(title_label)

        close_btn = Button(
            text="X",
            size_hint=(None, 1),
            width=dp(36),
            font_size=sp(16),
            background_color=(0.5, 0.2, 0.2, 1),
            color=(1, 1, 1, 1),
        )
        close_btn.bind(on_press=lambda x: self.dismiss())
        header.add_widget(close_btn)

        container.add_widget(header)

        # 页面标题
        self._page_title = Label(
            text="",
            font_size=sp(17),
            bold=True,
            color=(0.8, 0.8, 1.0, 1),
            size_hint=(1, None),
            height=dp(28),
            halign="left",
            valign="middle",
        )
        self._page_title.bind(size=self._page_title.setter("text_size"))
        container.add_widget(self._page_title)

        # 滚动内容区
        scroll = ScrollView(size_hint=(1, 1))
        self._content_label = Label(
            text="",
            font_size=sp(14),
            color=(0.85, 0.85, 0.85, 1),
            halign="left",
            valign="top",
            size_hint_y=None,
            padding=[dp(8), dp(8)],
        )
        self._content_label.bind(
            width=lambda i, v: setattr(self._content_label, "text_size", (v, None)),
            texture_size=lambda i, v: setattr(self._content_label, "height", v[1]),
        )
        scroll.add_widget(self._content_label)
        container.add_widget(scroll)

        # 页面导航栏
        nav = BoxLayout(
            orientation="horizontal",
            size_hint=(1, None),
            height=dp(44),
            spacing=dp(12),
        )

        self._prev_btn = Button(
            text="上一页",
            font_size=sp(14),
            background_color=(0.35, 0.35, 0.4, 1),
            color=(1, 1, 1, 1),
        )
        self._prev_btn.bind(on_press=self._go_prev)
        nav.add_widget(self._prev_btn)

        self._page_indicator = Label(
            text="1/1",
            font_size=sp(14),
            color=(0.7, 0.7, 0.7, 1),
            size_hint=(None, 1),
            width=dp(50),
        )
        nav.add_widget(self._page_indicator)

        self._next_btn = Button(
            text="下一页",
            font_size=sp(14),
            background_color=(0.35, 0.35, 0.4, 1),
            color=(1, 1, 1, 1),
        )
        self._next_btn.bind(on_press=self._go_next)
        nav.add_widget(self._next_btn)

        container.add_widget(nav)
        self.add_widget(container)

        self._update_page()

    def _update_page(self) -> None:
        """更新当前页面显示。"""
        page = self._pages[self._current_page]
        self._page_title.text = page.get("title", "")
        self._content_label.text = page.get("content", "")
        self._page_indicator.text = f"{self._current_page + 1}/{len(self._pages)}"

        self._prev_btn.disabled = self._current_page == 0
        self._next_btn.disabled = self._current_page == len(self._pages) - 1

        self._prev_btn.opacity = 0.4 if self._prev_btn.disabled else 1.0
        self._next_btn.opacity = 0.4 if self._next_btn.disabled else 1.0

    def _go_prev(self, instance: Button) -> None:
        """上一页。"""
        if self._current_page > 0:
            self._current_page -= 1
            self._update_page()

    def _go_next(self, instance: Button) -> None:
        """下一页。"""
        if self._current_page < len(self._pages) - 1:
            self._current_page += 1
            self._update_page()


# 内置帮助内容映射
_HELP_TOPICS = {
    "main_menu": [
        {
            "title": "游戏简介",
            "content": "AED急救大作战是一款互动剧情急救游戏。\n\n"
                       "你将在不同场景中遇到心脏骤停的患者，\n"
                       "需要做出正确的急救决策来拯救生命。",
        },
        {
            "title": "操作说明",
            "content": "1. 选择场景开始游戏\n"
                       "2. 阅读剧情，做出选择\n"
                       "3. 在限时内完成急救步骤\n"
                       "4. 寻找AED设备\n"
                       "5. 查看结算报告",
        },
    ],
    "story": [
        {
            "title": "剧情操作",
            "content": "阅读剧情文本，在选项出现时点击你选择的答案。\n\n"
                       "注意倒计时！超时可能导致不良后果。\n\n"
                       "错误的选择会影响病人状态，但不会立刻失败。",
        },
    ],
    "maze": [
        {
            "title": "迷宫操作",
            "content": "使用方向按钮在迷宫中移动。\n\n"
                       "找到所有AED设备后前往出口。\n\n"
                       "注意时间限制！",
        },
    ],
}


def _get_help_pages(topic_id: str) -> List[dict]:
    """根据主题ID获取帮助页面列表。

    Args:
        topic_id: 帮助主题ID

    Returns:
        帮助页面列表
    """
    return _HELP_TOPICS.get(topic_id, [{"title": "帮助", "content": "暂无该主题的帮助信息"}])
