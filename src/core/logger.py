"""日志管理模块

基于 Python logging 模块，提供统一的日志管理器。
支持同时输出到文件和控制台，日志文件存放在 data/cache/ 目录下。
"""

import logging
import os
import sys
from typing import Optional

from src.utils.path_utils import PROJECT_ROOT, get_data_path

_default_log_dir: str = get_data_path("cache")
_loggers: dict[str, logging.Logger] = {}


def setup_logging(
    log_dir: Optional[str] = None,
    level: int = logging.DEBUG,
    file_level: int = logging.DEBUG,
    console_level: int = logging.INFO,
    log_file_name: str = "aed_game.log",
) -> None:
    """初始化全局日志配置。

    设置根日志记录器的格式和输出目标。调用 get_logger 之前应先调用此函数，
    但如果未调用，get_logger 也会使用默认配置。

    Args:
        log_dir: 日志文件目录，默认为 data/cache/
        level: 根日志级别
        file_level: 文件日志级别
        console_level: 控制台日志级别
        log_file_name: 日志文件名
    """
    if log_dir is None:
        log_dir = _default_log_dir

    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, log_file_name)

    root_logger = logging.getLogger("aed_game")
    root_logger.setLevel(level)

    # 避免重复添加 handler
    if root_logger.handlers:
        return

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 文件 handler
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setLevel(file_level)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # 控制台 handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(console_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)


def get_logger(name: str) -> logging.Logger:
    """获取指定名称的日志记录器。

    返回的 logger 是 "aed_game" 的子 logger，自动继承全局配置。
    首次调用时会自动执行 setup_logging()。

    Args:
        name: 日志记录器名称（通常使用模块名）

    Returns:
        配置好的 Logger 实例
    """
    full_name = f"aed_game.{name}"

    if full_name not in _loggers:
        if not logging.getLogger("aed_game").handlers:
            setup_logging()
        _loggers[full_name] = logging.getLogger(full_name)

    return _loggers[full_name]
