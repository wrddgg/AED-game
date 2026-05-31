# 中文字体修复 - 概述

## 问题
Kivy 默认使用 Roboto 字体，不支持中文字符，导致所有中文文字（标题、按钮、标签）显示为方块/豆腐块。

## 修复方案

### 核心修改
| 文件 | 变更 |
|------|------|
| `app.py` | 在 Kivy 初始化前通过 `Config.set("kivy", "default_font", ["SimHei", path...])` 设置中文字体为默认 |
| `assets/fonts/simhei.ttf` | 从系统字体目录复制的黑体（9.4MB，TTF格式） |
| `assets/fonts/msyh.ttc` | 备用微软雅黑字体（19MB） |
| `src/ui/fonts.py` | 新建字体配置模块：FONT_REGISTRY 注册表、FontSize 大小规范 |
| `src/core/app_manager.py` | 添加 `_register_chinese_fonts()` 二次确认，确保 LabelBase 已注册 |
| `src/ui/screens/base_screen.py` | import DEFAULT_FONT_NAME，Label 添加 font_name |

### 技术要点
- **时序关键**: `Config.set("kivy", "default_font", [...])` 必须在创建任何 Widget 之前执行
- **字体格式**: TTF（SimHei）兼容性最好，TTC（MSYaHei）部分 Kivy 版本不支持
- **全局生效**: 设置 default_font 后，所有未指定 font_name 的 Label/Button 自动使用 SimHei
- **无需逐文件修改**: 不用给每个 Label 手动加 font_name，Kivy 的默认字体机制自动生效

### 验证结果
- `python app.py` 正常启动，9 个场景注册成功
- `Label.font_name` 自动变为 `SimHei`
- `LabelBase._fonts` 中已注册 `SimHei` 字体

## Git
- 提交: `7586f0b` - fix: add Chinese font support (SimHei) and fix runtime errors
- 变更: 22 files changed, 560 insertions(+), 365 deletions(-)
