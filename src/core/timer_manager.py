"""计时器管理模块

提供基于帧更新的计时器管理器，支持启动、取消、暂停、恢复和查询剩余时间。
适用于 Kivy 每帧 tick 驱动的游戏循环。
"""

import uuid
from typing import Callable, Optional

from src.core.logger import get_logger

logger = get_logger("timer_manager")


class _Timer:
    """内部计时器对象，记录单个计时器的状态。"""

    __slots__ = ("timer_id", "duration", "remaining", "on_timeout", "repeat", "paused", "active")

    def __init__(
        self,
        timer_id: str,
        duration: float,
        on_timeout: Callable[[], None],
        repeat: bool = False,
    ) -> None:
        self.timer_id: str = timer_id
        self.duration: float = duration
        self.remaining: float = duration
        self.on_timeout: Callable[[], None] = on_timeout
        self.repeat: bool = repeat
        self.paused: bool = False
        self.active: bool = True


class TimerManager:
    """计时器管理器。

    通过每帧调用 tick(delta_time) 推进所有活跃计时器。
    支持一次性和重复计时器，以及暂停和恢复操作。
    """

    def __init__(self) -> None:
        self._timers: dict[str, _Timer] = {}

    def start(
        self,
        duration: float,
        on_timeout: Callable[[], None],
        repeat: bool = False,
    ) -> str:
        """启动一个新计时器。

        Args:
            duration: 计时时长（秒）
            on_timeout: 超时回调函数
            repeat: 是否重复计时，默认 False

        Returns:
            计时器ID，用于后续操作
        """
        timer_id = str(uuid.uuid4())
        timer = _Timer(timer_id, duration, on_timeout, repeat)
        self._timers[timer_id] = timer
        logger.debug(f"启动计时器: {timer_id}, 时长: {duration}s, 重复: {repeat}")
        return timer_id

    def cancel(self, timer_id: str) -> None:
        """取消计时器。

        Args:
            timer_id: 计时器ID
        """
        timer = self._timers.pop(timer_id, None)
        if timer is not None:
            timer.active = False
            logger.debug(f"取消计时器: {timer_id}")

    def pause(self, timer_id: str) -> None:
        """暂停计时器。

        Args:
            timer_id: 计时器ID
        """
        timer = self._timers.get(timer_id)
        if timer is not None and timer.active and not timer.paused:
            timer.paused = True
            logger.debug(f"暂停计时器: {timer_id}")

    def resume(self, timer_id: str) -> None:
        """恢复已暂停的计时器。

        Args:
            timer_id: 计时器ID
        """
        timer = self._timers.get(timer_id)
        if timer is not None and timer.active and timer.paused:
            timer.paused = False
            logger.debug(f"恢复计时器: {timer_id}")

    def get_remaining(self, timer_id: str) -> float:
        """获取计时器剩余时间。

        Args:
            timer_id: 计时器ID

        Returns:
            剩余秒数，如果计时器不存在或已结束返回 0.0
        """
        timer = self._timers.get(timer_id)
        if timer is None or not timer.active:
            return 0.0
        return max(0.0, timer.remaining)

    def tick(self, delta_time: float) -> None:
        """推进所有活跃计时器。

        应在游戏主循环中每帧调用。

        Args:
            delta_time: 自上一帧以来的时间增量（秒）
        """
        completed: list[_Timer] = []

        for timer in self._timers.values():
            if not timer.active or timer.paused:
                continue

            timer.remaining -= delta_time
            if timer.remaining <= 0:
                completed.append(timer)

        for timer in completed:
            try:
                timer.on_timeout()
            except Exception as e:
                logger.error(f"计时器 {timer.timer_id} 回调执行出错: {e}")

            if timer.repeat:
                timer.remaining = timer.duration
            else:
                timer.active = False
                self._timers.pop(timer.timer_id, None)

    def cancel_all(self) -> None:
        """取消所有计时器。"""
        for timer in self._timers.values():
            timer.active = False
        self._timers.clear()
        logger.debug("已取消所有计时器")
