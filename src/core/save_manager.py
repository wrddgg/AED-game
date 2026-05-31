"""存档管理模块

提供游戏存档的保存、加载、列表、删除和自动存档功能。
存档以 JSON 格式存储在 data/saves/ 目录下。
"""

import json
import os
from typing import Optional

from src.core.logger import get_logger
from src.utils.path_utils import get_data_path

logger = get_logger("save_manager")

AUTOSAVE_FILENAME = "_autosave.json"


class SaveManager:
    """存档管理器。

    管理 JSON 格式的游戏存档文件，支持多槽位存档和自动存档。
    """

    def __init__(self, saves_dir: Optional[str] = None) -> None:
        """初始化存档管理器。

        Args:
            saves_dir: 存档目录，默认为 data/saves/
        """
        self._saves_dir: str = saves_dir or get_data_path("saves")
        os.makedirs(self._saves_dir, exist_ok=True)

    def _slot_path(self, slot_name: str) -> str:
        """获取存档槽位的文件路径。

        Args:
            slot_name: 槽位名称

        Returns:
            存档文件完整路径
        """
        # 清理文件名，防止路径遍历
        safe_name = os.path.basename(slot_name)
        if not safe_name.endswith(".json"):
            safe_name += ".json"
        return os.path.join(self._saves_dir, safe_name)

    def save(self, slot_name: str, data: dict) -> None:
        """保存存档到指定槽位。

        Args:
            slot_name: 槽位名称
            data: 要保存的数据字典
        """
        path = self._slot_path(slot_name)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"存档已保存: {slot_name}")
        except Exception as e:
            logger.error(f"保存存档失败: {slot_name}, 错误: {e}")
            raise

    def load(self, slot_name: str) -> Optional[dict]:
        """加载指定槽位的存档。

        Args:
            slot_name: 槽位名称

        Returns:
            存档数据字典，如果存档不存在或加载失败返回 None
        """
        path = self._slot_path(slot_name)
        if not os.path.isfile(path):
            logger.warning(f"存档不存在: {slot_name}")
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            logger.info(f"存档已加载: {slot_name}")
            return data
        except Exception as e:
            logger.error(f"加载存档失败: {slot_name}, 错误: {e}")
            return None

    def list_saves(self) -> list[str]:
        """列出所有存档槽位名称。

        Returns:
            存档名称列表（不含 .json 后缀），按文件修改时间降序排列
        """
        if not os.path.isdir(self._saves_dir):
            return []

        saves: list[tuple[str, float]] = []
        for filename in os.listdir(self._saves_dir):
            if not filename.endswith(".json"):
                continue
            full_path = os.path.join(self._saves_dir, filename)
            if not os.path.isfile(full_path):
                continue
            mtime = os.path.getmtime(full_path)
            name = filename[:-5]  # 去掉 .json
            saves.append((name, mtime))

        # 按修改时间降序排列（最近的在前）
        saves.sort(key=lambda x: x[1], reverse=True)
        return [name for name, _ in saves]

    def delete(self, slot_name: str) -> bool:
        """删除指定槽位的存档。

        Args:
            slot_name: 槽位名称

        Returns:
            是否删除成功
        """
        path = self._slot_path(slot_name)
        if not os.path.isfile(path):
            logger.warning(f"存档不存在，无法删除: {slot_name}")
            return False

        try:
            os.remove(path)
            logger.info(f"存档已删除: {slot_name}")
            return True
        except Exception as e:
            logger.error(f"删除存档失败: {slot_name}, 错误: {e}")
            return False

    def auto_save(self, data: dict) -> None:
        """自动存档到专用槽位。

        Args:
            data: 要保存的数据字典
        """
        self.save(AUTOSAVE_FILENAME, data)
        logger.debug("自动存档完成")

    def load_auto_save(self) -> Optional[dict]:
        """加载自动存档。

        Returns:
            自动存档数据，不存在则返回 None
        """
        return self.load(AUTOSAVE_FILENAME)
