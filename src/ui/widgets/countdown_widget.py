"""倒计时组件模块

提供游戏中的倒计时显示组件，支持自定义时长、颜色变化和超时回调。
"""

from typing import Callable, Optional

from kivy.animation import Animation
from kivy.clock import Clock
from kivy.core.text import Label as CoreLabel
from kivy.graphics import Color, Rectangle
from kivy.metrics import dp
from kivy.properties import NumericProperty, BooleanProperty, StringProperty
from kivy.uix.widget import Widget


class CountdownWidget(Widget):
    """倒计时显示组件

    显示剩余时间的圆形进度条和数字，时间不足时变色警告。
    """

    # Kivy 属性，支持 kv 绑定
    total_time = NumericProperty(0.0)
    remaining = NumericProperty(0.0)
    is_running = BooleanProperty(False)
    time_text = StringProperty("0:00")

    def __init__(
        self,
        total_time: float = 60.0,
        on_timeout: Optional[Callable[[], None]] = None,
        **kwargs,
    ) -> None:
        """初始化倒计时组件

        Args:
            total_time: 总时长（秒）
            on_timeout: 倒计时结束回调
        """
        super().__init__(**kwargs)
        self.total_time = total_time
        self.remaining = total_time
        self._on_timeout = on_timeout
        self._clock_event = None
        self._warning_threshold = total_time * 0.2  # 剩余20%时警告
        self._fg_color = (1.0, 1.0, 1.0, 1.0)  # 白色文字
        self._progress_color = (0.3, 0.8, 0.3, 1.0)  # 绿色进度

        self.size_hint = (None, None)
        self.size = (dp(120), dp(120))
        self._update_text()

    def start(self) -> None:
        """启动倒计时。"""
        if self.is_running:
            return
        self.is_running = True
        self._clock_event = Clock.schedule_interval(self._tick, 1.0)

    def pause(self) -> None:
        """暂停倒计时。"""
        if not self.is_running:
            return
        self.is_running = False
        if self._clock_event is not None:
            self._clock_event.cancel()
            self._clock_event = None

    def resume(self) -> None:
        """恢复倒计时。"""
        if self.is_running or self.remaining <= 0:
            return
        self.start()

    def stop(self) -> None:
        """停止倒计时并重置。"""
        self.pause()
        self.remaining = self.total_time
        self._update_text()
        self._progress_color = (0.3, 0.8, 0.3, 1.0)

    def _tick(self, dt: float) -> None:
        """每秒更新倒计时

        Args:
            dt: 时间增量
        """
        self.remaining = max(0.0, self.remaining - 1.0)
        self._update_text()
        self._update_color()

        if self.remaining <= 0:
            self.pause()
            if self._on_timeout:
                self._on_timeout()

    def _update_text(self) -> None:
        """更新时间文本显示。"""
        secs = int(self.remaining)
        minutes = secs // 60
        seconds = secs % 60
        self.time_text = f"{minutes}:{seconds:02d}"

    def _update_color(self) -> None:
        """根据剩余时间更新进度条颜色。"""
        if self.remaining <= self._warning_threshold:
            # 警告色：红色
            self._progress_color = (0.9, 0.2, 0.2, 1.0)
        elif self.remaining <= self.total_time * 0.5:
            # 中间色：黄色
            self._progress_color = (0.9, 0.8, 0.2, 1.0)
        else:
            # 正常色：绿色
            self._progress_color = (0.3, 0.8, 0.3, 1.0)

    def set_time(self, seconds: float) -> None:
        """设置剩余时间

        Args:
            seconds: 剩余秒数
        """
        self.remaining = max(0.0, seconds)
        self.total_time = max(self.total_time, seconds)
        self._warning_threshold = self.total_time * 0.2
        self._update_text()
        self._update_color()

    def get_remaining(self) -> float:
        """获取剩余时间。"""
        return self.remaining
