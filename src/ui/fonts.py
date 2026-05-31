"""全局字体配置

统一管理项目中所有字体资源路径和默认字体设置。
Kivy 默认使用 Roboto 字体，不支持中文，
因此需要在应用启动时注册中文字体并设置为默认值。
"""

import os

# 项目根目录（向上两级: fonts -> assets -> 项目根）
_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

# ── 字体文件路径 ──────────────────────────────────────────────
FONT_DIR = os.path.join(_PROJECT_ROOT, "assets", "fonts")

# 主字体：黑体（SimHei）—— TTF 格式，Kivy 兼容性最好
FONT_SIMHEI = os.path.join(FONT_DIR, "simhei.ttf")

# 备用字体：微软雅黑（Microsoft YaHei）—— TTC 格式，部分 Kivy 版本可能不支持
FONT_MSYH = os.path.join(FONT_DIR, "msyh.ttc")

# ── 默认字体选择 ──────────────────────────────────────────────
# 优先使用 SimHei，如果不存在则尝试 MSYH，最后回退到 Kivy 默认
# 注意：此名称必须和 app.py 中 Config.set("kivy", "default_font", ["SimHei", ...]) 一致
DEFAULT_FONT_NAME = "SimHei"

# 字体注册名 -> 文件路径 的映射
FONT_REGISTRY = {
    DEFAULT_FONT_NAME: FONT_SIMHEI,
    "ChineseFallback": FONT_MSYH,
}


def get_default_font() -> str:
    """获取可用的默认中文字体名称。

    Returns:
        注册后的字体名称，若无可用中文字体则返回空字符串
    """
    for name, path in FONT_REGISTRY.items():
        if os.path.isfile(path):
            return name
    return ""


def get_font_path(font_name: str = DEFAULT_FONT_NAME) -> str:
    """根据注册名获取字体文件路径。

    Args:
        font_name: 字体注册名

    Returns:
        字体文件路径，不存在时返回空字符串
    """
    path = FONT_REGISTRY.get(font_name, "")
    if path and os.path.isfile(path):
        return path
    return ""


# ── 字体大小规范 ──────────────────────────────────────────────
# 统一 font_size 常量，避免各处硬编码
from kivy.metrics import dp, sp

class FontSize:
    """全局字体大小常量。"""
    # 标题
    TITLE_HERO = sp(36)       # 大标题（如主菜单游戏名）
    TITLE_LARGE = sp(26)      # 页面标题
    TITLE_MEDIUM = sp(22)     # 小节标题

    # 正文
    BODY_LARGE = sp(18)       # 大号正文
    BODY_DEFAULT = sp(16)     # 默认正文
    BODY_SMALL = sp(14)       # 小号正文
    BODY_TINY = sp(12)        # 极小文字（如版本号）

    # 特殊
    RATING = sp(48)           # 评级数字
    ICON_TEXT = sp(20)        # 图标旁文字
    BUTTON = sp(18)           # 按钮文字
    BUTTON_SMALL = sp(15)     # 小按钮文字
