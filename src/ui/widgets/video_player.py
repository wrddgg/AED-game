"""视频播放器组件模块

提供基于 Kivy 的视频播放器组件，支持播放/暂停、进度条显示、
循环播放和播放完成回调，用于剧情视频播放。
"""

from typing import Callable, Optional

from kivy.clock import Clock
from kivy.core.window import Window
from kivy.graphics import Color, Rectangle
from kivy.metrics import dp
from kivy.properties import BooleanProperty, NumericProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.image import Image
from kivy.uix.label import Label
from kivy.uix.progressbar import ProgressBar
from kivy.uix.video import Video


class VideoPlayer(BoxLayout):
    """视频播放器组件

    封装 Kivy Video 组件，提供播放控制界面、进度显示和循环播放功能。
    """

    is_playing = BooleanProperty(False)
    is_loop = BooleanProperty(False)
    duration = NumericProperty(0.0)
    position = NumericProperty(0.0)
    video_source = StringProperty("")

    def __init__(
        self,
        source: str = "",
        loop: bool = False,
        on_complete: Optional[Callable[[], None]] = None,
        **kwargs,
    ) -> None:
        """初始化视频播放器

        Args:
            source: 视频文件路径
            loop: 是否循环播放
            on_complete: 播放完成回调
        """
        super().__init__(orientation="vertical", **kwargs)
        self.video_source = source
        self.is_loop = loop
        self._on_complete = on_complete
        self._video: Optional[Video] = None
        self._progress_update_event = None

        self._build_ui()

        if source:
            self.load(source)

    def _build_ui(self) -> None:
        """构建播放器 UI。"""
        # 视频显示区域
        self._video_container = BoxLayout(
            size_hint=(1, 0.9),
        )
        self.add_widget(self._video_container)

        # 控制栏
        controls = BoxLayout(
            orientation="horizontal",
            size_hint=(1, None),
            height=dp(44),
            spacing=dp(8),
            padding=[dp(8), dp(4)],
        )

        self._play_btn = Button(
            text="播放",
            size_hint=(None, 1),
            width=dp(60),
            font_size=dp(14),
        )
        self._play_btn.bind(on_press=self._toggle_play)
        controls.add_widget(self._play_btn)

        self._progress = ProgressBar(
            max=100,
            value=0,
            size_hint=(1, None),
            height=dp(20),
        )
        controls.add_widget(self._progress)

        self._time_label = Label(
            text="0:00 / 0:00",
            size_hint=(None, 1),
            width=dp(90),
            font_size=dp(12),
            color=(1, 1, 1, 1),
        )
        controls.add_widget(self._time_label)

        self.add_widget(controls)

    def load(self, source: str) -> None:
        """加载视频文件

        Args:
            source: 视频文件路径
        """
        self.video_source = source
        self._stop_progress_update()

        # 清除旧视频
        self._video_container.clear_widgets()

        if not source:
            return

        try:
            self._video = Video(
                source=source,
                play=False,
                eos="loop" if self.is_loop else "pause",
                allow_stretch=True,
            )
            self._video.bind(
                duration=self._on_duration,
                position=self._on_position,
                eos=self._on_eos,
            )
            self._video_container.add_widget(self._video)
        except Exception as e:
            from src.core.logger import get_logger
            logger = get_logger("video_player")
            logger.error(f"加载视频失败: {source}, 错误: {e}")
            # 显示占位图
            placeholder = Label(
                text="视频加载失败",
                color=(1, 1, 1, 1),
                font_size=dp(16),
            )
            self._video_container.add_widget(placeholder)

    def play(self) -> None:
        """播放视频。"""
        if self._video is None:
            return
        self._video.play = True
        self.is_playing = True
        self._play_btn.text = "暂停"
        self._start_progress_update()

    def pause(self) -> None:
        """暂停视频。"""
        if self._video is None:
            return
        self._video.play = False
        self.is_playing = False
        self._play_btn.text = "播放"
        self._stop_progress_update()

    def stop(self) -> None:
        """停止视频并回到起始位置。"""
        self.pause()
        if self._video is not None:
            self._video.seek(0.0)
            self.position = 0.0
            self._progress.value = 0

    def seek(self, fraction: float) -> None:
        """跳转到指定位置

        Args:
            fraction: 0.0~1.0 之间的比例
        """
        if self._video is not None:
            self._video.seek(max(0.0, min(1.0, fraction)))

    def _toggle_play(self, instance: Button) -> None:
        """切换播放/暂停

        Args:
            instance: 按钮实例
        """
        if self.is_playing:
            self.pause()
        else:
            self.play()

    def _on_duration(self, instance: Video, value: float) -> None:
        """视频时长更新回调"""
        self.duration = value
        self._progress.max = max(1, value)

    def _on_position(self, instance: Video, value: float) -> None:
        """视频位置更新回调"""
        self.position = value
        if self.duration > 0:
            self._progress.value = value

    def _on_eos(self, instance: Video, value: str) -> None:
        """视频播放结束回调"""
        if value == "pause" and not self.is_loop:
            self.is_playing = False
            self._play_btn.text = "播放"
            self._stop_progress_update()
            if self._on_complete:
                self._on_complete()

    def _start_progress_update(self) -> None:
        """启动进度更新定时器。"""
        self._stop_progress_update()
        self._progress_update_event = Clock.schedule_interval(
            self._update_progress, 0.5
        )

    def _stop_progress_update(self) -> None:
        """停止进度更新定时器。"""
        if self._progress_update_event is not None:
            self._progress_update_event.cancel()
            self._progress_update_event = None

    def _update_progress(self, dt: float) -> None:
        """更新进度条和时间标签

        Args:
            dt: 时间增量
        """
        if self._video is None or self.duration <= 0:
            return

        pos = self._video.position
        self._progress.value = pos
        self._time_label.text = f"{self._format_time(pos)} / {self._format_time(self.duration)}"

    @staticmethod
    def _format_time(seconds: float) -> str:
        """格式化时间为 M:SS 格式

        Args:
            seconds: 秒数

        Returns:
            格式化的时间字符串
        """
        secs = int(seconds)
        minutes = secs // 60
        seconds = secs % 60
        return f"{minutes}:{seconds:02d}"
