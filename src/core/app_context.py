"""应用上下文模块

提供全局应用上下文 AppContext，持有服务引用和运行时状态，
并支持序列化与反序列化。
"""

from typing import Any, Optional


class AppContext:
    """全局应用上下文。

    管理已注册的服务和运行时状态信息，如当前场景ID、当前节点ID、
    游戏运行状态等。支持 to_dict / from_dict 序列化。
    """

    def __init__(self) -> None:
        self._services: dict[str, Any] = {}
        self.current_scenario_id: Optional[str] = None
        self.current_node_id: Optional[str] = None
        self.game_running: bool = False
        self.paused: bool = False
        # 扩展状态存储，用于存放自定义键值对
        self._extra: dict[str, Any] = {}

    def register_service(self, name: str, service: Any) -> None:
        """注册服务到上下文。

        Args:
            name: 服务名称
            service: 服务实例
        """
        self._services[name] = service

    def get_service(self, name: str) -> Any:
        """获取已注册的服务。

        Args:
            name: 服务名称

        Returns:
            服务实例

        Raises:
            KeyError: 服务未注册时抛出
        """
        if name not in self._services:
            raise KeyError(f"服务 '{name}' 未注册")
        return self._services[name]

    def has_service(self, name: str) -> bool:
        """检查服务是否已注册。

        Args:
            name: 服务名称

        Returns:
            是否已注册
        """
        return name in self._services

    def set_extra(self, key: str, value: Any) -> None:
        """设置扩展状态值。

        Args:
            key: 键
            value: 值
        """
        self._extra[key] = value

    def get_extra(self, key: str, default: Any = None) -> Any:
        """获取扩展状态值。

        Args:
            key: 键
            default: 默认值

        Returns:
            对应的值或默认值
        """
        return self._extra.get(key, default)

    def to_dict(self) -> dict[str, Any]:
        """将运行时状态序列化为字典。

        注意：服务引用不参与序列化。

        Returns:
            包含运行时状态的字典
        """
        return {
            "current_scenario_id": self.current_scenario_id,
            "current_node_id": self.current_node_id,
            "game_running": self.game_running,
            "paused": self.paused,
            "extra": dict(self._extra),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "AppContext":
        """从字典反序列化创建 AppContext。

        Args:
            data: 包含状态信息的字典

        Returns:
            恢复状态的 AppContext 实例
        """
        ctx = cls()
        ctx.current_scenario_id = data.get("current_scenario_id")
        ctx.current_node_id = data.get("current_node_id")
        ctx.game_running = data.get("game_running", False)
        ctx.paused = data.get("paused", False)
        ctx._extra = data.get("extra", {})
        return ctx
