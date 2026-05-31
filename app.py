"""AED 急救互动剧情游戏 - 主入口

在导入 Kivy 之前设置中文字体，确保所有控件默认使用支持中文的字体。
Kivy 的 default_font 配置格式为 [name, regular, italic, bold, bold_italic]，
设置后所有未指定 font_name 的 Label/Button 自动使用该字体。
"""
import sys
import os

# 将项目根目录加入 sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ── 在 Kivy 初始化之前设置中文字体 ──────────────────────────
# Kivy 默认使用 Roboto 字体，不支持中文，导致所有中文显示为方块。
# Config.set("kivy", "default_font", [...]) 必须在任何 kivy.app.App 运行前设置。
# 这里用 SimHei（黑体）的 TTF 路径替换 Roboto 作为默认字体，
# 四个变体（regular/italic/bold/bold_italic）全部指向同一文件（SimHei 无变体）。

_FONT_DIR = os.path.join(PROJECT_ROOT, "assets", "fonts")
_SIMHEI_PATH = os.path.join(_FONT_DIR, "simhei.ttf")

if os.path.isfile(_SIMHEI_PATH):
    # 先读取 Kivy 配置（不触发完整初始化），再修改 default_font
    import kivy.config as _kconfig
    _kconfig.Config.set(
        "kivy",
        "default_font",
        ["SimHei", _SIMHEI_PATH, _SIMHEI_PATH, _SIMHEI_PATH, _SIMHEI_PATH],
    )

from src.core.app_manager import AppManager


def main():
    """启动应用"""
    manager = AppManager()
    manager.run()


if __name__ == "__main__":
    main()
