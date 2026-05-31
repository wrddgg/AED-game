"""MedalService - 勋章/成就服务。

本地 JSON 实现，数据存储在 data/cache/medals.json。
提供解锁、查询和自动检测解锁条件功能。
"""

import json
import os
from typing import Any
from datetime import datetime


# 预定义勋章及其解锁条件
MEDAL_DEFINITIONS: dict[str, dict] = {
    "first_aid": {
        "name": "急救新手",
        "description": "完成第一次急救场景",
        "condition": lambda ctx: ctx.get("scenarios_completed", 0) >= 1,
    },
    "aed_master": {
        "name": "AED大师",
        "description": "在所有场景中获得S评级",
        "condition": lambda ctx: ctx.get("all_s_grade", False),
    },
    "speed_rescue": {
        "name": "闪电救援",
        "description": "在30秒内完成一个场景",
        "condition": lambda ctx: ctx.get("fastest_time", float("inf")) <= 30,
    },
    "perfect_score": {
        "name": "完美无缺",
        "description": "一个场景中零失误",
        "condition": lambda ctx: ctx.get("zero_mistakes", False),
    },
    "explorer": {
        "name": "探索者",
        "description": "体验所有场景",
        "condition": lambda ctx: ctx.get("scenarios_completed", 0) >= ctx.get("total_scenarios", 999),
    },
    "persistent": {
        "name": "坚持不懈",
        "description": "累计完成5次游戏",
        "condition": lambda ctx: ctx.get("total_games", 0) >= 5,
    },
}


class MedalService:
    """勋章服务：本地 JSON 存储实现。"""

    DEFAULT_PATH: str = os.path.join("data", "cache", "medals.json")

    def __init__(self, file_path: str | None = None) -> None:
        self._file_path: str = file_path or self.DEFAULT_PATH
        self._unlocked: dict[str, dict] = self._load()

    def _load(self) -> dict[str, dict]:
        """从 JSON 文件加载勋章数据。

        Returns:
            已解锁勋章字典，key 为 medal_id。
        """
        if not os.path.exists(self._file_path):
            return {}
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"[MedalService] 加载勋章数据失败: {e}")
            return {}

    def _save(self) -> None:
        """将勋章数据保存到 JSON 文件。"""
        os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
        try:
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump(self._unlocked, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"[MedalService] 保存勋章数据失败: {e}")

    def unlock(self, medal_id: str) -> None:
        """解锁指定勋章。

        Args:
            medal_id: 勋章唯一标识。
        """
        if medal_id in self._unlocked:
            return  # 已解锁
        if medal_id not in MEDAL_DEFINITIONS:
            print(f"[MedalService] 未知勋章 ID: {medal_id}")
            return

        self._unlocked[medal_id] = {
            "unlocked_at": datetime.now().isoformat(),
            "name": MEDAL_DEFINITIONS[medal_id].get("name", medal_id),
            "description": MEDAL_DEFINITIONS[medal_id].get("description", ""),
        }
        self._save()

    def has(self, medal_id: str) -> bool:
        """检查是否已解锁指定勋章。

        Args:
            medal_id: 勋章唯一标识。

        Returns:
            是否已解锁。
        """
        return medal_id in self._unlocked

    def list_unlocked(self) -> list[str]:
        """列出所有已解锁的勋章 ID。

        Returns:
            已解锁勋章 ID 列表。
        """
        return list(self._unlocked.keys())

    def check_unlocks(self, context: dict) -> list[str]:
        """根据上下文检查是否满足解锁条件，自动解锁。

        Args:
            context: 上下文数据，包含场景完成数、分数等信息。

        Returns:
            本次新解锁的勋章 ID 列表。
        """
        newly_unlocked: list[str] = []
        for medal_id, definition in MEDAL_DEFINITIONS.items():
            if medal_id in self._unlocked:
                continue
            condition = definition.get("condition")
            if condition is not None:
                try:
                    if condition(context):
                        self.unlock(medal_id)
                        newly_unlocked.append(medal_id)
                except Exception as e:
                    print(f"[MedalService] 检查勋章 {medal_id} 解锁条件时出错: {e}")
        return newly_unlocked

    def get_medal_info(self, medal_id: str) -> dict | None:
        """获取勋章详细信息。

        Args:
            medal_id: 勋章唯一标识。

        Returns:
            勋章信息字典，未找到返回 None。
        """
        if medal_id not in MEDAL_DEFINITIONS:
            return None
        info = dict(MEDAL_DEFINITIONS[medal_id])
        if medal_id in self._unlocked:
            info["unlocked"] = True
            info["unlocked_at"] = self._unlocked[medal_id].get("unlocked_at")
        else:
            info["unlocked"] = False
        # 移除不可序列化的 condition 函数
        info.pop("condition", None)
        return info

    def list_all_medals(self) -> list[dict]:
        """列出所有勋章（含解锁状态）。

        Returns:
            所有勋章信息列表。
        """
        result = []
        for medal_id in MEDAL_DEFINITIONS:
            info = self.get_medal_info(medal_id)
            if info is not None:
                info["id"] = medal_id
                result.append(info)
        return result

    def reset_all(self) -> None:
        """重置所有勋章数据。"""
        self._unlocked = {}
        self._save()
