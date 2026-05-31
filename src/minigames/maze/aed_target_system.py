"""AED 目标系统模块

管理迷宫中 AED（自动体外除颤器）设备的位置、发现状态和
使用逻辑，与急救流程紧密关联。
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from src.core.logger import get_logger

logger = get_logger("aed_target_system")


@dataclass
class AEDDevice:
    """AED 设备数据

    Attributes:
        device_id: 设备唯一标识
        row: 迷宫中的行位置
        col: 迷宫中的列位置
        discovered: 是否已被发现
        used: 是否已被使用
        device_type: 设备类型（如 "standard", "pediatric"）
    """
    device_id: str
    row: int
    col: int
    discovered: bool = False
    used: bool = False
    device_type: str = "standard"


class AEDTargetSystem:
    """AED 目标系统

    管理迷宫中 AED 设备的放置、发现和使用。
    玩家需要在迷宫中找到 AED 设备并带到患者位置完成急救。
    """

    def __init__(self) -> None:
        self._devices: Dict[str, AEDDevice] = {}
        self._player_has_aed: bool = False
        self._carrying_device_id: Optional[str] = None

    def place_devices(
        self,
        positions: List[Tuple[int, int]],
        device_type: str = "standard",
    ) -> List[str]:
        """在迷宫中放置 AED 设备

        Args:
            positions: 设备位置列表 [(row, col), ...]
            device_type: 设备类型

        Returns:
            放置的设备ID列表
        """
        self._devices.clear()
        self._player_has_aed = False
        self._carrying_device_id = None

        device_ids: List[str] = []
        for i, (row, col) in enumerate(positions):
            device_id = f"aed_{i}"
            device = AEDDevice(
                device_id=device_id,
                row=row,
                col=col,
                device_type=device_type,
            )
            self._devices[device_id] = device
            device_ids.append(device_id)

        logger.info(f"放置了 {len(device_ids)} 个 AED 设备")
        return device_ids

    def check_discovery(self, player_row: int, player_col: int) -> Optional[AEDDevice]:
        """检查玩家是否发现了 AED 设备

        当玩家移动到 AED 所在格子时，标记为已发现。

        Args:
            player_row: 玩家当前行
            player_col: 玩家当前列

        Returns:
            发现的设备，未发现返回 None
        """
        for device in self._devices.values():
            if not device.discovered and device.row == player_row and device.col == player_col:
                device.discovered = True
                logger.info(f"发现 AED 设备: {device.device_id} at ({player_row}, {player_col})")
                return device
        return None

    def pick_up(self, player_row: int, player_col: int) -> bool:
        """拾取当前位置的 AED 设备

        玩家只能携带一台 AED。

        Args:
            player_row: 玩家当前行
            player_col: 玩家当前列

        Returns:
            是否拾取成功
        """
        if self._player_has_aed:
            logger.debug("已携带 AED，无法再拾取")
            return False

        for device in self._devices.values():
            if device.row == player_row and device.col == player_col and not device.used:
                device.discovered = True
                self._player_has_aed = True
                self._carrying_device_id = device.device_id
                logger.info(f"拾取 AED: {device.device_id}")
                return True

        return False

    def use_aed(self) -> bool:
        """使用携带的 AED 设备

        Returns:
            是否使用成功
        """
        if not self._player_has_aed or self._carrying_device_id is None:
            logger.warning("没有携带 AED 设备")
            return False

        device = self._devices.get(self._carrying_device_id)
        if device is None:
            return False

        device.used = True
        self._player_has_aed = False
        self._carrying_device_id = None
        logger.info(f"使用 AED: {device.device_id}")
        return True

    def has_aed(self) -> bool:
        """检查玩家是否携带 AED。"""
        return self._player_has_aed

    def get_carrying_device(self) -> Optional[AEDDevice]:
        """获取当前携带的设备。"""
        if self._carrying_device_id is None:
            return None
        return self._devices.get(self._carrying_device_id)

    def get_all_devices(self) -> List[AEDDevice]:
        """获取所有设备列表。"""
        return list(self._devices.values())

    def get_undiscovered_devices(self) -> List[AEDDevice]:
        """获取未发现的设备列表。"""
        return [d for d in self._devices.values() if not d.discovered]

    def get_device_at(self, row: int, col: int) -> Optional[AEDDevice]:
        """获取指定位置的设备。

        Args:
            row: 行
            col: 列

        Returns:
            该位置的设备，无则返回 None
        """
        for device in self._devices.values():
            if device.row == row and device.col == col:
                return device
        return None

    def reset(self) -> None:
        """重置所有设备状态。"""
        for device in self._devices.values():
            device.discovered = False
            device.used = False
        self._player_has_aed = False
        self._carrying_device_id = None
        logger.debug("AED 目标系统已重置")

    def to_dict(self) -> dict:
        """序列化为字典。"""
        return {
            "devices": {
                did: {
                    "row": d.row,
                    "col": d.col,
                    "discovered": d.discovered,
                    "used": d.used,
                    "device_type": d.device_type,
                }
                for did, d in self._devices.items()
            },
            "player_has_aed": self._player_has_aed,
            "carrying_device_id": self._carrying_device_id,
        }
