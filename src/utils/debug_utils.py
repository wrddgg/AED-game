"""调试工具模块

提供条件打印和上下文转储等调试辅助功能。
"""

import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.core.app_context import AppContext


def debug_print(msg: str) -> None:
    """条件打印：仅当环境变量 DEBUG=1 时输出消息。

    Args:
        msg: 要打印的调试消息
    """
    if os.environ.get("DEBUG", "0") == "1":
        print(f"[DEBUG] {msg}")


def dump_context(app_context: "AppContext") -> str:
    """将应用上下文状态转储为字符串，用于调试。

    Args:
        app_context: 应用上下文实例

    Returns:
        上下文状态的可读字符串
    """
    lines: list[str] = ["=== AppContext Dump ==="]

    # 运行时状态
    lines.append(f"current_scenario_id: {app_context.current_scenario_id}")
    lines.append(f"current_node_id: {app_context.current_node_id}")
    lines.append(f"game_running: {app_context.game_running}")
    lines.append(f"paused: {app_context.paused}")

    # 已注册的服务
    service_names = list(app_context._services.keys())
    lines.append(f"registered_services ({len(service_names)}): {', '.join(service_names)}")

    # 上下文字典内容
    ctx_dict = app_context.to_dict()
    lines.append(f"context_dict: {ctx_dict}")

    lines.append("=== End Dump ===")
    return "\n".join(lines)
