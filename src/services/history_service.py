"""HistoryService - 历史记录服务。

本地 JSON 实现，数据存储在 data/history/ 目录下。
每条记录为独立 JSON 文件，提供增删查功能。
"""

import json
import os
from typing import Any
from datetime import datetime


class HistoryService:
    """历史记录服务：本地 JSON 文件存储实现。"""

    DEFAULT_DIR: str = os.path.join("data", "history")

    def __init__(self, data_dir: str | None = None) -> None:
        self._data_dir: str = data_dir or self.DEFAULT_DIR
        os.makedirs(self._data_dir, exist_ok=True)

    def _get_file_path(self, record_id: str) -> str:
        """获取记录文件路径。

        Args:
            record_id: 记录唯一标识。

        Returns:
            文件完整路径。
        """
        # 清理 record_id 中的危险字符
        safe_id = "".join(c for c in record_id if c.isalnum() or c in ("_", "-"))
        return os.path.join(self._data_dir, f"{safe_id}.json")

    def record(self, record_data: dict) -> None:
        """保存一条游戏记录。

        Args:
            record_data: 记录数据，包含场景名、分数、结果等字段。
        """
        if "id" not in record_data:
            record_data["id"] = f"rec_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        if "date" not in record_data:
            record_data["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        record_id = record_data["id"]
        file_path = self._get_file_path(record_id)

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(record_data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"[HistoryService] 保存记录失败: {e}")

    def list_records(self) -> list[dict]:
        """列出所有游戏记录，按日期降序排列。

        Returns:
            记录列表。
        """
        records: list[dict] = []
        if not os.path.exists(self._data_dir):
            return records

        for filename in os.listdir(self._data_dir):
            if not filename.endswith(".json"):
                continue
            file_path = os.path.join(self._data_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    record = json.load(f)
                    records.append(record)
            except (json.JSONDecodeError, IOError) as e:
                print(f"[HistoryService] 读取记录 {filename} 失败: {e}")

        # 按日期降序
        records.sort(key=lambda x: x.get("date", ""), reverse=True)
        return records

    def get_record(self, record_id: str) -> dict | None:
        """获取单条游戏记录。

        Args:
            record_id: 记录唯一标识。

        Returns:
            记录数据字典，未找到返回 None。
        """
        file_path = self._get_file_path(record_id)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"[HistoryService] 读取记录 {record_id} 失败: {e}")
            return None

    def delete_record(self, record_id: str) -> None:
        """删除指定游戏记录。

        Args:
            record_id: 记录唯一标识。
        """
        file_path = self._get_file_path(record_id)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                print(f"[HistoryService] 删除记录 {record_id} 失败: {e}")

    def reset_all(self) -> None:
        """重置所有历史记录。"""
        if not os.path.exists(self._data_dir):
            return
        for filename in os.listdir(self._data_dir):
            if filename.endswith(".json"):
                file_path = os.path.join(self._data_dir, filename)
                try:
                    os.remove(file_path)
                except OSError as e:
                    print(f"[HistoryService] 删除记录 {filename} 失败: {e}")
