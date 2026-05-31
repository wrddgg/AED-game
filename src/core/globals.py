"""全局辅助模块

提供获取全局服务引用的便捷函数，供 UI 层等模块使用。
这些函数通过 Kivy App 实例间接获取 AppManager 和各服务。
"""

from typing import Optional, Any


def get_app_manager() -> Optional[Any]:
    """获取全局 AppManager 实例。

    Returns:
        AppManager 实例，如果尚未启动则返回 None
    """
    try:
        from kivy.app import App
        app = App.get_running_app()
        if app and hasattr(app, '_app_manager'):
            return app._app_manager
    except Exception:
        pass
    return None


def get_scene_router() -> Optional[Any]:
    """获取全局 SceneRouter 实例。

    Returns:
        SceneRouter 实例，如果尚未启动则返回 None
    """
    manager = get_app_manager()
    if manager:
        return manager.scene_router
    return None


def get_app_context() -> Optional[Any]:
    """获取全局 AppContext 实例。

    Returns:
        AppContext 实例，如果尚未启动则返回 None
    """
    manager = get_app_manager()
    if manager:
        return manager.app_context
    return None


def get_event_bus() -> Optional[Any]:
    """获取全局 EventBus 实例。

    Returns:
        EventBus 实例，如果尚未启动则返回 None
    """
    manager = get_app_manager()
    if manager:
        return manager.event_bus
    return None


def navigate_to(scene_id: str, params: dict = None) -> bool:
    """导航到指定场景的便捷函数。

    Args:
        scene_id: 目标场景ID
        params: 传递给场景的参数

    Returns:
        是否成功导航
    """
    router = get_scene_router()
    if router:
        try:
            router.open(scene_id, params)
            return True
        except Exception as e:
            from src.core.logger import get_logger
            get_logger("globals").error(f"导航失败: {e}")
    return False
