"""路径工具模块

提供项目目录常量和路径拼接工具函数，统一管理项目内的各类路径。
"""

import os

# 从本文件向上推导项目根目录: src/utils/path_utils.py -> src/utils -> src -> 项目根
PROJECT_ROOT: str = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
)


def get_asset_path(relative_path: str) -> str:
    """获取 assets 目录下的完整路径。

    Args:
        relative_path: 相对于 assets/ 的路径

    Returns:
        拼接后的完整路径
    """
    return normalize_path(os.path.join(PROJECT_ROOT, "assets", relative_path))


def get_config_path(relative_path: str) -> str:
    """获取 configs 目录下的完整路径。

    Args:
        relative_path: 相对于 configs/ 的路径

    Returns:
        拼接后的完整路径
    """
    return normalize_path(os.path.join(PROJECT_ROOT, "configs", relative_path))


def get_data_path(relative_path: str) -> str:
    """获取 data 目录下的完整路径。

    Args:
        relative_path: 相对于 data/ 的路径

    Returns:
        拼接后的完整路径
    """
    return normalize_path(os.path.join(PROJECT_ROOT, "data", relative_path))


def get_doc_path(relative_path: str) -> str:
    """获取 docs 目录下的完整路径。

    Args:
        relative_path: 相对于 docs/ 的路径

    Returns:
        拼接后的完整路径
    """
    return normalize_path(os.path.join(PROJECT_ROOT, "docs", relative_path))


def normalize_path(path: str) -> str:
    """统一路径分隔符，将反斜杠替换为正斜杠。

    Args:
        path: 原始路径

    Returns:
        统一后的路径
    """
    return path.replace("\\", "/")
