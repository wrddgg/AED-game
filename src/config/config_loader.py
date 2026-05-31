"""AED 急救互动剧情游戏 - 配置加载器模块

提供 ConfigLoader 类，负责从 JSON 配置文件加载各类游戏配置数据。
内置缓存机制避免重复读取，支持强制重新加载。
"""

import json
import os
from typing import Any, Dict, Optional


class ConfigLoader:
    """配置加载器

    从指定基础路径加载 JSON 配置文件，支持缓存和重新加载。

    Attributes:
        base_path: 配置文件的基础路径
        _cache: 已加载配置的缓存字典
    """

    def __init__(self, base_path: str = "configs/") -> None:
        """初始化配置加载器

        Args:
            base_path: 配置文件的基础路径，默认为 "configs/"
        """
        self.base_path = base_path
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _resolve_path(self, path: str) -> str:
        """解析配置文件的完整路径

        Args:
            path: 相对于 base_path 的路径

        Returns:
            完整的文件路径
        """
        return os.path.join(self.base_path, path)

    def load_json(self, path: str) -> Dict[str, Any]:
        """从 base_path + path 读取 JSON 配置

        优先从缓存读取，缓存未命中时从文件加载。

        Args:
            path: 相对于 base_path 的 JSON 文件路径

        Returns:
            解析后的字典数据

        Raises:
            FileNotFoundError: 配置文件不存在
            json.JSONDecodeError: JSON 解析失败
        """
        if path in self._cache:
            return self._cache[path]

        full_path = self._resolve_path(path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"配置文件不存在: {full_path}")

        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._cache[path] = data
        return data

    def load_scenario(self, scenario_id: str) -> Dict[str, Any]:
        """加载场景配置

        Args:
            scenario_id: 场景 ID

        Returns:
            场景配置字典
        """
        return self.load_json(f"scenarios/{scenario_id}.json")

    def load_story(self, story_id: str) -> Dict[str, Any]:
        """加载剧情图配置

        Args:
            story_id: 剧情图 ID

        Returns:
            剧情图配置字典
        """
        return self.load_json(f"stories/{story_id}.json")

    def load_medical(self, config_id: str) -> Dict[str, Any]:
        """加载医疗流程配置

        Args:
            config_id: 医疗配置 ID

        Returns:
            医疗配置字典
        """
        return self.load_json(f"medical/{config_id}.json")

    def load_maze(self, config_id: str) -> Dict[str, Any]:
        """加载迷宫难度配置

        Args:
            config_id: 迷宫配置 ID

        Returns:
            迷宫配置字典
        """
        return self.load_json(f"difficulty/{config_id}.json")

    def load_help(self, topic_id: str) -> Dict[str, Any]:
        """加载帮助主题配置

        Args:
            topic_id: 帮助主题 ID

        Returns:
            帮助主题配置字典
        """
        return self.load_json(f"help/{topic_id}.json")

    def load_rewards(self) -> Dict[str, Any]:
        """加载奖励配置

        Returns:
            奖励配置字典
        """
        return self.load_json("rewards/rewards.json")

    def reload(self, path: str) -> Dict[str, Any]:
        """强制重新加载配置（不使用缓存）

        Args:
            path: 相对于 base_path 的 JSON 文件路径

        Returns:
            重新加载后的字典数据

        Raises:
            FileNotFoundError: 配置文件不存在
            json.JSONDecodeError: JSON 解析失败
        """
        full_path = self._resolve_path(path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"配置文件不存在: {full_path}")

        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._cache[path] = data
        return data

    def clear_cache(self) -> None:
        """清除所有缓存"""
        self._cache.clear()

    def clear_cache_entry(self, path: str) -> None:
        """清除指定路径的缓存

        Args:
            path: 要清除缓存的路劲
        """
        self._cache.pop(path, None)
