"""变量存储系统，管理游戏中的变量状态。"""

from typing import Any, Optional


class VariableStore:
    """游戏变量存储，支持变量的增删改查及序列化。

    用于存储和管理游戏运行期间的所有变量，如分数、道具、场景状态等。
    提供 get/set/add/sub 等操作，并记录变量变更信息。
    """

    def __init__(self, initial_vars: Optional[dict] = None) -> None:
        """初始化变量存储。

        Args:
            initial_vars: 初始变量字典，默认为空。
        """
        self.variables: dict = dict(initial_vars) if initial_vars else {}

    def get(self, key: str, default: Any = None) -> Any:
        """获取变量值。

        Args:
            key: 变量名。
            default: 变量不存在时的默认值。

        Returns:
            变量值，不存在则返回 default。
        """
        return self.variables.get(key, default)

    def set(self, key: str, value: Any) -> tuple:
        """设置变量值。

        Args:
            key: 变量名。
            value: 变量值。

        Returns:
            变更信息元组 (key, old_value, new_value)。
        """
        old_value = self.variables.get(key)
        self.variables[key] = value
        return (key, old_value, value)

    def add(self, key: str, delta: Any) -> None:
        """数值增加。

        如果变量不存在，从 0 开始增加。

        Args:
            key: 变量名。
            delta: 增加的值。

        Raises:
            TypeError: 变量当前值或 delta 不支持加法操作。
        """
        current = self.variables.get(key, 0)
        self.variables[key] = current + delta

    def sub(self, key: str, delta: Any) -> None:
        """数值减少。

        如果变量不存在，从 0 开始减少。

        Args:
            key: 变量名。
            delta: 减少的值。

        Raises:
            TypeError: 变量当前值或 delta 不支持减法操作。
        """
        current = self.variables.get(key, 0)
        self.variables[key] = current - delta

    def has(self, key: str) -> bool:
        """检查变量是否存在。

        Args:
            key: 变量名。

        Returns:
            变量是否存在。
        """
        return key in self.variables

    def remove(self, key: str) -> None:
        """移除变量。

        如果变量不存在，不做任何操作。

        Args:
            key: 变量名。
        """
        self.variables.pop(key, None)

    def get_all(self) -> dict:
        """返回所有变量的副本。

        Returns:
            变量字典的浅拷贝。
        """
        return dict(self.variables)

    def reset(self, initial_vars: Optional[dict] = None) -> None:
        """重置变量存储。

        Args:
            initial_vars: 重置后的初始变量，默认为空。
        """
        self.variables = dict(initial_vars) if initial_vars else {}

    def to_dict(self) -> dict:
        """序列化为字典。

        Returns:
            变量字典的副本，可用于持久化存储。
        """
        return dict(self.variables)

    @classmethod
    def from_dict(cls, d: dict) -> "VariableStore":
        """从字典反序列化创建 VariableStore。

        Args:
            d: 变量字典。

        Returns:
            新的 VariableStore 实例。
        """
        return cls(initial_vars=d)
