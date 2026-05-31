"""时间工具模块

提供时间戳获取、时长格式化和"多久之前"格式化等工具函数。
"""

import time
from typing import Optional


def current_timestamp() -> float:
    """获取当前时间戳（秒）。

    Returns:
        当前 Unix 时间戳
    """
    return time.time()


def format_duration(seconds: float) -> str:
    """将秒数格式化为易读的时长字符串。

    格式示例: "1h 23m 45s", "5m 00s", "30s"

    Args:
        seconds: 秒数

    Returns:
        格式化后的时长字符串
    """
    if seconds < 0:
        seconds = 0

    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    parts: list[str] = []
    if hours > 0:
        parts.append(f"{hours}h")
    if hours > 0 or minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")

    return " ".join(parts)


def format_time_ago(timestamp: float) -> str:
    """将时间戳格式化为"多久之前"的中文描述。

    格式示例: "刚刚", "5秒前", "3分钟前", "2小时前", "1天前"

    Args:
        timestamp: Unix 时间戳

    Returns:
        中文"多久之前"描述
    """
    delta = time.time() - timestamp
    if delta < 0:
        return "刚刚"

    seconds = int(delta)
    if seconds < 10:
        return "刚刚"
    if seconds < 60:
        return f"{seconds}秒前"

    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}分钟前"

    hours = minutes // 60
    if hours < 24:
        return f"{hours}小时前"

    days = hours // 24
    if days < 30:
        return f"{days}天前"

    months = days // 30
    if months < 12:
        return f"{months}个月前"

    years = months // 12
    return f"{years}年前"
