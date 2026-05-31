"""资源管理模块

提供统一的资源加载和缓存管理，支持图片、音频、视频、动画和字体等资源类型。
资源根目录为项目根目录下的 assets/，使用 LRU 缓存策略。
"""

import json
import os
from collections import OrderedDict
from typing import Any, Optional

from src.core.logger import get_logger
from src.utils.path_utils import PROJECT_ROOT

logger = get_logger("resource_manager")


class ResourceManager:
    """资源管理器。

    管理各类资源的路径映射、加载和缓存。支持通过 JSON 配置覆盖
    默认的资源路径映射，加载失败时返回占位资源。
    """

    # 默认资源类型到子目录的映射
    DEFAULT_DIR_MAP: dict[str, str] = {
        "image": "images",
        "audio": "audio",
        "video": "videos",
        "animation": "animations",
        "font": "fonts",
    }

    def __init__(self, base_path: Optional[str] = None, max_cache_size: int = 100) -> None:
        """初始化资源管理器。

        Args:
            base_path: 资源根目录，默认为项目根目录下的 assets/
            max_cache_size: LRU 缓存最大条目数
        """
        self._base_path: str = base_path or os.path.join(PROJECT_ROOT, "assets")
        self._max_cache_size: int = max_cache_size
        self._cache: OrderedDict[str, Any] = OrderedDict()
        self._path_map: dict[str, str] = {}
        self._load_default_path_map()

    def _load_default_path_map(self) -> None:
        """加载默认路径映射。

        扫描资源子目录，为每个文件生成 key -> 相对路径的映射。
        key 格式为 "类型/文件名"（不含扩展名），如 "images/logo"。
        """
        for res_type, sub_dir in self.DEFAULT_DIR_MAP.items():
            dir_path = os.path.join(self._base_path, sub_dir)
            if not os.path.isdir(dir_path):
                continue
            for filename in os.listdir(dir_path):
                full_path = os.path.join(dir_path, filename)
                if not os.path.isfile(full_path):
                    continue
                name_without_ext = os.path.splitext(filename)[0]
                key = f"{sub_dir}/{name_without_ext}"
                relative = f"{sub_dir}/{filename}"
                self._path_map[key] = relative

    def load_path_map(self, json_path: str) -> None:
        """从 JSON 文件加载路径映射，覆盖默认映射。

        JSON 格式为 {"key": "relative_path", ...}

        Args:
            json_path: 路径映射 JSON 文件路径
        """
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                override = json.load(f)
            self._path_map.update(override)
            logger.debug(f"加载路径映射: {json_path}, 覆盖 {len(override)} 项")
        except Exception as e:
            logger.warning(f"加载路径映射失败: {json_path}, 错误: {e}")

    def set_base_path(self, path: str) -> None:
        """设置资源根目录。

        设置后会清空缓存并重新生成默认路径映射。

        Args:
            path: 新的资源根目录
        """
        self._base_path = path
        self._cache.clear()
        self._path_map.clear()
        self._load_default_path_map()
        logger.debug(f"资源根目录已更新: {path}")

    def _resolve_path(self, key: str) -> Optional[str]:
        """根据 key 解析资源的完整路径。

        Args:
            key: 资源键

        Returns:
            完整文件路径，如果找不到返回 None
        """
        # 先查路径映射表
        if key in self._path_map:
            return os.path.join(self._base_path, self._path_map[key])

        # 直接作为相对路径尝试
        direct_path = os.path.join(self._base_path, key)
        if os.path.isfile(direct_path):
            return direct_path

        return None

    def _get_from_cache(self, key: str) -> Optional[Any]:
        """从缓存获取资源（LRU 淘汰）。

        Args:
            key: 缓存键

        Returns:
            缓存的资源，如果不存在返回 None
        """
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return None

    def _put_to_cache(self, key: str, resource: Any) -> None:
        """将资源放入缓存，超过上限时淘汰最久未使用的。

        Args:
            key: 缓存键
            resource: 资源对象
        """
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = resource
        else:
            self._cache[key] = resource
            if len(self._cache) > self._max_cache_size:
                evicted_key, _ = self._cache.popitem(last=False)
                logger.debug(f"缓存淘汰: {evicted_key}")

    def _load_resource(self, key: str, resource_type: str) -> Any:
        """通用资源加载逻辑。

        Args:
            key: 资源键
            resource_type: 资源类型（image/audio/video/animation/font）

        Returns:
            加载的资源对象，失败时返回占位资源
        """
        # 检查缓存
        cached = self._get_from_cache(key)
        if cached is not None:
            return cached

        path = self._resolve_path(key)
        if path is None or not os.path.isfile(path):
            logger.warning(f"资源未找到: {key}, 返回占位资源")
            return self._get_placeholder(resource_type)

        try:
            resource = self._do_load(path, resource_type)
            self._put_to_cache(key, resource)
            return resource
        except Exception as e:
            logger.warning(f"资源加载失败: {key}, 路径: {path}, 错误: {e}")
            return self._get_placeholder(resource_type)

    def _do_load(self, path: str, resource_type: str) -> Any:
        """实际加载资源文件。

        对于图片、动画和字体使用 Kivy 的资源加载器，
        对于音频和视频返回文件路径字符串。

        Args:
            path: 文件绝对路径
            resource_type: 资源类型

        Returns:
            加载后的资源对象
        """
        if resource_type in ("image", "animation"):
            from kivy.core.image import Image as KivyImage
            return KivyImage(path).texture
        elif resource_type == "font":
            return path
        elif resource_type in ("audio", "video"):
            return path
        else:
            return path

    def _get_placeholder(self, resource_type: str) -> Any:
        """获取占位资源。

        Args:
            resource_type: 资源类型

        Returns:
            占位资源对象
        """
        if resource_type in ("image", "animation"):
            try:
                from kivy.graphics.texture import Texture
                texture = Texture.create(size=(2, 2), colorfmt="RGBA")
                buf = bytes([128, 128, 128, 255] * 4)
                texture.blit_buffer(buf, colorfmt="RGBA")
                return texture
            except Exception:
                return None
        return None

    def load_image(self, key: str) -> Any:
        """加载图片资源。

        Args:
            key: 资源键，如 "images/logo" 或路径映射中的 key

        Returns:
            图片纹理对象，失败时返回占位纹理
        """
        return self._load_resource(key, "image")

    def load_audio(self, key: str) -> Optional[str]:
        """加载音频资源。

        Args:
            key: 资源键，如 "audio/bgm_main"

        Returns:
            音频文件路径字符串，失败时返回 None
        """
        return self._load_resource(key, "audio")

    def load_video(self, key: str) -> Optional[str]:
        """加载视频资源。

        Args:
            key: 资源键，如 "videos/intro"

        Returns:
            视频文件路径字符串，失败时返回 None
        """
        return self._load_resource(key, "video")

    def load_animation(self, key: str) -> Any:
        """加载动画资源。

        Args:
            key: 资源键，如 "animations/cpr_loop"

        Returns:
            动画纹理对象，失败时返回占位纹理
        """
        return self._load_resource(key, "animation")

    def load_font(self, key: str) -> Optional[str]:
        """加载字体资源。

        Args:
            key: 资源键，如 "fonts/main"

        Returns:
            字体文件路径字符串，失败时返回 None
        """
        return self._load_resource(key, "font")

    def clear_cache(self) -> None:
        """清空资源缓存。"""
        self._cache.clear()
        logger.debug("资源缓存已清空")
