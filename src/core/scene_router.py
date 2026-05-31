"""场景路由模块

提供基于 Kivy ScreenManager 的场景切换管理器，支持场景注册、
切换、返回和场景历史栈。
"""

from typing import Any, Optional

from kivy.uix.screenmanager import Screen, ScreenManager, SlideTransition

from src.core.logger import get_logger

logger = get_logger("scene_router")


class SceneRouter:
    """场景切换管理器。

    基于 Kivy 的 ScreenManager，维护场景历史栈，
    支持场景注册、切换和返回等操作。
    """

    def __init__(self, screen_manager: Optional[ScreenManager] = None) -> None:
        self._screen_manager: ScreenManager = screen_manager or ScreenManager()
        self._scene_registry: dict[str, type[Screen]] = {}
        self._history: list[str] = []

    @property
    def screen_manager(self) -> ScreenManager:
        """获取内部的 ScreenManager 实例。"""
        return self._screen_manager

    def add_scene(self, scene_id: str, screen_class: type[Screen]) -> None:
        """注册场景类。

        Args:
            scene_id: 场景唯一标识
            screen_class: Kivy Screen 子类
        """
        self._scene_registry[scene_id] = screen_class
        logger.debug(f"注册场景: {scene_id} -> {screen_class.__name__}")

    def open(self, scene_id: str, params: Optional[dict[str, Any]] = None) -> None:
        """切换到指定场景。

        将当前场景压入历史栈，然后切换到目标场景。
        如果目标场景尚未添加到 ScreenManager，会自动实例化并添加。

        Args:
            scene_id: 目标场景标识
            params: 传递给场景的参数

        Raises:
            KeyError: 场景未注册时抛出
        """
        if scene_id not in self._scene_registry:
            raise KeyError(f"场景 '{scene_id}' 未注册")

        # 记录当前场景到历史栈
        current = self.get_current()
        if current is not None and current != scene_id:
            self._history.append(current)

        # 如果 ScreenManager 中还没有该 Screen，实例化并添加
        existing_names = [s.name for s in self._screen_manager.screens]
        if scene_id not in existing_names:
            screen_class = self._scene_registry[scene_id]
            screen = screen_class(name=scene_id)
            self._screen_manager.add_widget(screen)

        # 传递参数
        screen = self._screen_manager.get_screen(scene_id)
        if params is not None:
            if hasattr(screen, 'params'):
                screen.params = params
            if hasattr(screen, 'update'):
                try:
                    screen.update(params)
                except Exception:
                    pass

        self._screen_manager.current = scene_id
        logger.debug(f"切换场景: {scene_id}, 参数: {params}")

    def go_back(self) -> Optional[str]:
        """返回上一场景。

        Returns:
            返回到的场景ID，如果历史栈为空则返回 None
        """
        if not self._history:
            logger.warning("场景历史栈为空，无法返回")
            return None

        previous_scene_id = self._history.pop()
        self._screen_manager.current = previous_scene_id
        logger.debug(f"返回场景: {previous_scene_id}")
        return previous_scene_id

    def get_current(self) -> Optional[str]:
        """获取当前场景ID。

        Returns:
            当前场景标识，如果没有当前场景则返回 None
        """
        return self._screen_manager.current if self._screen_manager.current else None

    def clear_history(self) -> None:
        """清空场景历史栈。"""
        self._history.clear()

    @property
    def history(self) -> list[str]:
        """获取场景历史栈的副本。"""
        return list(self._history)
