"""JSON 工具模块

提供 JSON 文件的加载、保存、校验、合并以及嵌套键的访问与设置等功能。
"""

import copy
import json
import os
from typing import Any, Optional


def load_json(path: str, encoding: str = "utf-8") -> dict:
    """加载并解析 JSON 文件。

    Args:
        path: JSON 文件路径
        encoding: 文件编码，默认 utf-8

    Returns:
        解析后的字典

    Raises:
        FileNotFoundError: 文件不存在
        json.JSONDecodeError: JSON 格式错误
    """
    with open(path, "r", encoding=encoding) as f:
        return json.load(f)


def save_json(path: str, data: dict, indent: int = 2, encoding: str = "utf-8") -> None:
    """保存数据为 JSON 文件。

    父目录不存在时会自动创建。

    Args:
        path: 文件路径
        data: 要序列化的字典
        indent: 缩进层级，默认 2
        encoding: 文件编码，默认 utf-8
    """
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding=encoding) as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def validate_json(data: dict, schema: dict[str, dict]) -> tuple[bool, list[str]]:
    """根据简单 schema 校验数据。

    schema 格式示例::

        {
            "name": {"type": "str", "required": True},
            "age": {"type": "int", "required": False},
        }

    支持的类型字符串: "str", "int", "float", "bool", "list", "dict"

    Args:
        data: 待校验的数据字典
        schema: 校验规则字典

    Returns:
        (是否通过, 错误信息列表)
    """
    type_map: dict[str, type] = {
        "str": str,
        "int": int,
        "float": (int, float),
        "bool": bool,
        "list": list,
        "dict": dict,
    }

    errors: list[str] = []

    for field, rule in schema.items():
        required = rule.get("required", False)
        expected_type_str = rule.get("type")

        if field not in data:
            if required:
                errors.append(f"缺少必填字段: {field}")
            continue

        value = data[field]
        if expected_type_str is not None:
            expected_type = type_map.get(expected_type_str)
            if expected_type is None:
                errors.append(f"未知的类型定义 '{expected_type_str}'，字段: {field}")
                continue
            if not isinstance(value, expected_type):
                actual = type(value).__name__
                errors.append(
                    f"字段 '{field}' 类型错误: 期望 {expected_type_str}, 实际 {actual}"
                )

    return (len(errors) == 0, errors)


def merge_json(base: dict, override: dict) -> dict:
    """深度合并两个字典，override 中的值覆盖 base 中的同名键。

    对于嵌套字典会递归合并，非字典值直接覆盖。

    Args:
        base: 基础字典
        override: 覆盖字典

    Returns:
        合并后的新字典
    """
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_json(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def deep_get(data: dict, dotted_key: str, default: Any = None) -> Any:
    """通过点分隔键获取嵌套字典中的值。

    例如 deep_get(d, "a.b.c") 等价于 d["a"]["b"]["c"]。

    Args:
        data: 数据字典
        dotted_key: 点分隔的键路径
        default: 键不存在时返回的默认值

    Returns:
        对应的值，或 default
    """
    keys = dotted_key.split(".")
    current: Any = data
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current


def deep_set(data: dict, dotted_key: str, value: Any) -> None:
    """通过点分隔键设置嵌套字典中的值。

    路径中不存在的中间字典会自动创建。

    Args:
        data: 数据字典
        dotted_key: 点分隔的键路径
        value: 要设置的值
    """
    keys = dotted_key.split(".")
    current: Any = data
    for key in keys[:-1]:
        if key not in current or not isinstance(current[key], dict):
            current[key] = {}
        current = current[key]
    current[keys[-1]] = value
