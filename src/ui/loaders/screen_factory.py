"""场景工厂模块

提供统一的场景创建工厂，根据场景ID动态创建对应的 Screen 实例，
支持场景注册、延迟加载和参数传递。
"""

from typing import Any, Callable, Dict, Optional, Type

from kivy.uix.screenmanager import Screen

from src.core.logger import get_logger
from src.ui.screens.base_screen import BaseScreen

logger = get_logger("screen_factory")


class ScreenFactory:
    """场景工厂

    集中管理场景类的注册和创建，支持延迟加载和依赖注入。
    工厂维护一个场景注册表，根据场景ID创建对应的 Screen 实例。
    """

    def __init__(self) -> None:
        self._registry: Dict[str, Type[Screen]] = {}
        self._factories: Dict[str, Callable[..., Screen]] = {}
        self._app_context: Optional[Any] = None

    def set_app_context(self, app_context: Any) -> None:
        """设置应用上下文，用于向创建的场景注入依赖

        Args:
            app_context: AppContext 实例
        """
        self._app_context = app_context

    def register(self, scene_id: str, screen_class: Type[Screen]) -> None:
        """注册场景类

        Args:
            scene_id: 场景唯一标识
            screen_class: Screen 子类
        """
        if scene_id in self._registry:
            logger.warning(f"场景 '{scene_id}' 已注册，将被覆盖")
        self._registry[scene_id] = screen_class
        logger.debug(f"注册场景: {scene_id} -> {screen_class.__name__}")

    def register_factory(
        self, scene_id: str, factory: Callable[..., Screen]
    ) -> None:
        """注册场景工厂函数

        工厂函数接收 name 参数，返回 Screen 实例。
        适用于需要复杂初始化逻辑的场景。

        Args:
            scene_id: 场景唯一标识
            factory: 工厂函数
        """
        self._factories[scene_id] = factory
        logger.debug(f"注册场景工厂: {scene_id}")

    def create(
        self,
        scene_id: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Screen]:
        """创建场景实例

        优先使用工厂函数创建，其次使用注册的类直接实例化。
        如果场景是 BaseScreen 的子类，会自动注入 app_context。

        Args:
            scene_id: 场景唯一标识
            params: 传递给场景的参数

        Returns:
            创建的 Screen 实例，失败返回 None
        """
        # 优先使用工厂函数
        if scene_id in self._factories:
            try:
                screen = self._factories[scene_id](name=scene_id)
                self._inject_context(screen)
                logger.debug(f"通过工厂创建场景: {scene_id}")
                return screen
            except Exception as e:
                logger.error(f"工厂创建场景失败: {scene_id}, 错误: {e}")
                return None

        # 使用注册的类
        if scene_id in self._registry:
            screen_class = self._registry[scene_id]
            try:
                screen = screen_class(name=scene_id)
                self._inject_context(screen)
                if params and isinstance(screen, BaseScreen):
                    screen.update(params)
                logger.debug(f"创建场景: {scene_id}")
                return screen
            except Exception as e:
                logger.error(f"创建场景失败: {scene_id}, 错误: {e}")
                return None

        logger.warning(f"未注册的场景: {scene_id}")
        return None

    def _inject_context(self, screen: Screen) -> None:
        """向场景注入应用上下文

        Args:
            screen: 场景实例
        """
        if self._app_context and isinstance(screen, BaseScreen):
            screen.app_context = self._app_context

    def is_registered(self, scene_id: str) -> bool:
        """检查场景是否已注册

        Args:
            scene_id: 场景标识

        Returns:
            是否已注册
        """
        return scene_id in self._registry or scene_id in self._factories

    def get_registered_ids(self) -> list[str]:
        """获取所有已注册的场景ID列表

        Returns:
            场景ID列表
        """
        ids = set(self._registry.keys()) | set(self._factories.keys())
        return sorted(ids)

    def unregister(self, scene_id: str) -> bool:
        """取消注册场景

        Args:
            scene_id: 场景标识

        Returns:
            是否成功取消
        """
        removed = False
        if scene_id in self._registry:
            del self._registry[scene_id]
            removed = True
        if scene_id in self._factories:
            del self._factories[scene_id]
            removed = True

        if removed:
            logger.debug(f"取消注册场景: {scene_id}")
        return removed

    def clear(self) -> None:
        """清空所有注册。"""
        self._registry.clear()
        self._factories.clear()
        logger.debug("已清空场景工厂注册表")
