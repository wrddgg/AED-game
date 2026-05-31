"""LeaderboardService - 排行榜服务。

本地 JSON 实现，数据存储在 data/cache/leaderboard.json。
提供提交分数和获取排行榜列表功能。
"""

import json
import os
from typing import Any
from datetime import datetime


class LeaderboardService:
    """排行榜服务：本地 JSON 存储实现。"""

    DEFAULT_PATH: str = os.path.join("data", "cache", "leaderboard.json")

    def __init__(self, file_path: str | None = None) -> None:
        self._file_path: str = file_path or self.DEFAULT_PATH
        self._data: list[dict] = self._load()

    def _load(self) -> list[dict]:
        """从 JSON 文件加载排行数据。

        Returns:
            排行条目列表。
        """
        if not os.path.exists(self._file_path):
            return []
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"[LeaderboardService] 加载排行数据失败: {e}")
            return []

    def _save(self) -> None:
        """将排行数据保存到 JSON 文件。"""
        os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
        try:
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"[LeaderboardService] 保存排行数据失败: {e}")

    def submit_score(self, entry: dict) -> None:
        """提交一条排行记录。

        Args:
            entry: 排行条目，包含 player、score、scenario 等字段。
        """
        entry["timestamp"] = datetime.now().isoformat()
        if "id" not in entry:
            entry["id"] = f"lb_{len(self._data)}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self._data.append(entry)
        # 按分数降序排列
        self._data.sort(key=lambda x: x.get("score", 0), reverse=True)
        self._save()

    def fetch_top_list(self, count: int = 10) -> list[dict]:
        """获取排名前 N 的排行列表。

        Args:
            count: 返回的最大条目数。

        Returns:
            排行条目列表（按分数降序）。
        """
        return self._data[:count]

    def reset_all(self) -> None:
        """重置所有排行数据。"""
        self._data = []
        self._save()
