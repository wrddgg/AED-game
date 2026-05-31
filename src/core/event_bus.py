"""事件总线模块

提供发布-订阅模式的事件总线实现，支持线程安全的事件订阅、取消订阅和发布。
"""

import threading
from collections import defaultdict
from typing import Any, Callable


class EventBus:
    """事件总线，实现发布-订阅模式。

    使用线程安全的锁保护订阅表，支持同一事件类型的多个回调，
    回调按订阅顺序执行。
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callable[..., None]]] = defaultdict(list)
        self._lock = threading.Lock()

    def subscribe(self, event_type: str, callback: Callable[..., None]) -> None:
        """订阅事件。

        当指定事件发布时，callback 会被调用。

        Args:
            event_type: 事件类型标识
            callback: 事件回调函数，接受 **kwargs
        """
        with self._lock:
            if callback not in self._subscribers[event_type]:
                self._subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback: Callable[..., None]) -> None:
        """取消订阅事件。

        Args:
            event_type: 事件类型标识
            callback: 要移除的回调函数
        """
        with self._lock:
            callbacks = self._subscribers.get(event_type)
            if callbacks and callback in callbacks:
                callbacks.remove(callback)
                if not callbacks:
                    del self._subscribers[event_type]

    def publish(self, event_type: str, **kwargs: Any) -> None:
        """发布事件。

        通知所有订阅了该事件类型的回调，按订阅顺序调用。
        如果某个回调抛出异常，会记录但不会中断后续回调的执行。

        Args:
            event_type: 事件类型标识
            **kwargs: 传递给回调的参数
        """
        with self._lock:
            callbacks = list(self._subscribers.get(event_type, []))

        for callback in callbacks:
            try:
                callback(**kwargs)
            except Exception as e:
                from src.core.logger import get_logger
                logger = get_logger("event_bus")
                logger.error(
                    f"事件 '{event_type}' 的回调 {callback.__name__} 执行出错: {e}"
                )

    def clear(self) -> None:
        """清空所有订阅。"""
        with self._lock:
            self._subscribers.clear()
