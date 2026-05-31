"""文件操作工具模块

提供文件和目录的常用操作函数，包括目录确保、文本/JSON 读写、
文件存在性检查和文件列表获取等功能。
"""

import json
import os
from typing import Optional


def ensure_dir(path: str) -> None:
    """确保目录存在，如果不存在则递归创建。

    Args:
        path: 需要确保存在的目录路径
    """
    os.makedirs(path, exist_ok=True)


def read_text(path: str, encoding: str = "utf-8") -> str:
    """读取文本文件内容。

    Args:
        path: 文件路径
        encoding: 文件编码，默认 utf-8

    Returns:
        文件文本内容

    Raises:
        FileNotFoundError: 文件不存在时抛出
        IOError: 读取失败时抛出
    """
    with open(path, "r", encoding=encoding) as f:
        return f.read()


def write_text(path: str, content: str, encoding: str = "utf-8") -> None:
    """写入文本文件。

    如果父目录不存在会自动创建。

    Args:
        path: 文件路径
        content: 要写入的文本内容
        encoding: 文件编码，默认 utf-8
    """
    parent = os.path.dirname(path)
    if parent:
        ensure_dir(parent)
    with open(path, "w", encoding=encoding) as f:
        f.write(content)


def read_json(path: str, encoding: str = "utf-8") -> dict:
    """读取并解析 JSON 文件。

    Args:
        path: JSON 文件路径
        encoding: 文件编码，默认 utf-8

    Returns:
        解析后的字典

    Raises:
        FileNotFoundError: 文件不存在时抛出
        json.JSONDecodeError: JSON 格式错误时抛出
    """
    with open(path, "r", encoding=encoding) as f:
        return json.load(f)


def write_json(path: str, data: dict, indent: int = 2, encoding: str = "utf-8") -> None:
    """将数据以 JSON 格式写入文件。

    如果父目录不存在会自动创建。

    Args:
        path: 文件路径
        data: 要序列化的字典数据
        indent: 缩进层级，默认 2
        encoding: 文件编码，默认 utf-8
    """
    parent = os.path.dirname(path)
    if parent:
        ensure_dir(parent)
    with open(path, "w", encoding=encoding) as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def file_exists(path: str) -> bool:
    """检查文件是否存在。

    Args:
        path: 文件路径

    Returns:
        文件是否存在
    """
    return os.path.isfile(path)


def list_files(directory: str, extension: Optional[str] = None) -> list[str]:
    """列出目录中的文件。

    Args:
        directory: 目录路径
        extension: 可选的文件扩展名过滤（如 ".json"），不区分大小写

    Returns:
        目录中的文件路径列表（绝对路径），不包含子目录
    """
    if not os.path.isdir(directory):
        return []

    result: list[str] = []
    for filename in os.listdir(directory):
        full_path = os.path.join(directory, filename)
        if not os.path.isfile(full_path):
            continue
        if extension is not None:
            if not filename.lower().endswith(extension.lower()):
                continue
        result.append(full_path)

    return sorted(result)
