"""帮助系统模块。

提供急救知识帮助内容的管理和查询，支持按主题获取帮助信息，
通过事件总线展示帮助内容。
"""

from __future__ import annotations

from typing import Any, Optional


class HelpService:
    """帮助服务，管理急救知识的帮助主题和内容。

    提供帮助主题的加载、查询和展示功能，支持从配置加载主题内容，
    并通过事件总线发布帮助展示事件。

    Implements IHelpService concept.

    Attributes:
        topics: 帮助主题缓存字典
    """

    def __init__(self, config_loader: Optional[Any] = None) -> None:
        """初始化帮助服务。

        Args:
            config_loader: 可选的配置加载器，用于从外部加载帮助内容
        """
        self.config_loader = config_loader
        self.topics: dict[str, dict] = {}
        self._event_bus: Any = None
        self.load_topics()

    # ---------- 公开接口 ----------

    def get_help(self, topic_id: str) -> str:
        """获取指定主题的帮助内容。

        Args:
            topic_id: 帮助主题 ID

        Returns:
            帮助内容字符串，主题不存在时返回提示信息
        """
        topic = self.topics.get(topic_id)
        if topic is None:
            return f"未找到帮助主题：{topic_id}"

        parts: list[str] = []
        parts.append(f"【{topic.get('title', topic_id)}】")
        parts.append("")

        content = topic.get("content", "")
        parts.append(content)

        # 如果有子步骤，列出详情
        details = topic.get("details", [])
        if details:
            parts.append("")
            parts.append("详细步骤：")
            for i, detail in enumerate(details, 1):
                parts.append(f"  {i}. {detail}")

        # 如果有注意事项
        warnings = topic.get("warnings", [])
        if warnings:
            parts.append("")
            parts.append("注意事项：")
            for warning in warnings:
                parts.append(f"  ⚠ {warning}")

        return "\n".join(parts)

    def show_help(self, topic_id: str) -> None:
        """通过事件展示帮助内容。

        Args:
            topic_id: 帮助主题 ID
        """
        content = self.get_help(topic_id)
        if self._event_bus is not None and hasattr(self._event_bus, "emit"):
            self._event_bus.emit("HelpShown", {
                "topic_id": topic_id,
                "content": content,
            })

    def list_topics(self) -> list[dict]:
        """列出所有可用的帮助主题。

        Returns:
            主题摘要列表，每项包含 id, title, category 字段
        """
        result: list[dict] = []
        for topic_id, topic in self.topics.items():
            result.append({
                "id": topic_id,
                "title": topic.get("title", topic_id),
                "category": topic.get("category", "通用"),
            })
        return result

    def load_topics(self) -> None:
        """从配置加载帮助主题。

        如果有 config_loader 则从外部加载，否则使用内置默认帮助主题。
        """
        if self.config_loader is not None and hasattr(self.config_loader, "load"):
            external_topics = self.config_loader.load()
            if isinstance(external_topics, dict):
                self.topics.update(external_topics)
                return

        # 内置默认帮助主题
        self.topics = {
            "check_safety": {
                "id": "check_safety",
                "title": "确认现场安全",
                "category": "急救基础",
                "content": "在接近病人之前，首先确认现场环境安全。观察是否有触电、火灾、交通等危险因素。",
                "details": [
                    "环顾四周，观察是否有明显危险源",
                    "如果现场不安全，等待专业人员处理",
                    "确认安全后方可接近病人",
                ],
                "warnings": [
                    "切勿在危险环境中贸然施救",
                    "施救者安全第一",
                ],
            },
            "check_consciousness": {
                "id": "check_consciousness",
                "title": "检查意识",
                "category": "急救基础",
                "content": "通过轻拍病人肩膀和大声呼唤来判断病人是否有意识。",
                "details": [
                    "轻拍病人双肩",
                    "在病人耳边大声呼唤：'你还好吗？'",
                    "观察病人是否有反应",
                ],
                "warnings": [
                    "不要剧烈摇晃病人",
                    "如果病人有脊柱受伤可能，不要移动病人",
                ],
            },
            "call_emergency": {
                "id": "call_emergency",
                "title": "拨打急救电话",
                "category": "急救基础",
                "content": "确认病人无意识或无呼吸后，立即拨打120急救电话。",
                "details": [
                    "拨打120或当地急救电话",
                    "说明地点、病人情况、人数",
                    "告知接线员正在进行的急救措施",
                    "保持电话畅通，按指示操作",
                ],
                "warnings": [
                    "不要先做其他事情再打电话",
                    "如果只有你一人，先打120再施救",
                ],
            },
            "check_breathing": {
                "id": "check_breathing",
                "title": "检查呼吸",
                "category": "急救基础",
                "content": "观察病人胸部是否有起伏，判断是否有正常呼吸。",
                "details": [
                    "让病人平躺，开放气道",
                    "观察胸部是否有起伏",
                    "观察5-10秒（不超过10秒）",
                    "同时感受口鼻是否有气流",
                ],
                "warnings": [
                    "不要用脸贴近病人面部感受呼吸",
                    "判断时间不超过10秒",
                    "如果不确定是否有呼吸，按无呼吸处理",
                ],
            },
            "cpr_basics": {
                "id": "cpr_basics",
                "title": "心肺复苏（CPR）",
                "category": "急救操作",
                "content": "对无意识无呼吸的病人进行心肺复苏，包括胸外按压和人工呼吸。",
                "details": [
                    "将病人放在坚硬平坦的表面上",
                    "双手重叠，掌根放在胸骨下半段",
                    "按压深度5-6厘米，频率100-120次/分钟",
                    "每30次按压后进行2次人工呼吸",
                    "持续进行直到AED到达或急救人员接手",
                ],
                "warnings": [
                    "按压位置正确，避免按压肋骨",
                    "每次按压后让胸廓完全回弹",
                    "尽量减少中断，中断时间不超过10秒",
                ],
            },
            "aed_usage": {
                "id": "aed_usage",
                "title": "AED 使用方法",
                "category": "急救操作",
                "content": "自动体外除颤器（AED）是救治心脏骤停的关键设备，操作简单，听从语音提示即可。",
                "details": [
                    "打开AED电源",
                    "按图示贴好电极片",
                    "AED自动分析心律，此时所有人离开病人",
                    "如AED提示需要电击，确保无人接触病人后按下电击键",
                    "电击后立即继续CPR",
                ],
                "warnings": [
                    "AED分析时所有人必须离开病人",
                    "电击前确认无人接触病人",
                    "不要在潮湿环境使用AED",
                    "如果病人有起搏器，电极片避开起搏器位置",
                ],
            },
            "recovery_position": {
                "id": "recovery_position",
                "title": "复原体位",
                "category": "急救操作",
                "content": "当病人恢复呼吸和意识后，将其置于复原体位，保持气道通畅。",
                "details": [
                    "将病人近侧手臂伸直",
                    "将远侧手放在近侧脸颊旁",
                    "抬起远侧膝盖，向施救者方向翻转病人",
                    "调整头部位置，确保气道通畅",
                ],
                "warnings": [
                    "仅在有呼吸有脉搏时使用复原体位",
                    "持续观察病人呼吸情况",
                    "每5分钟检查一次呼吸",
                ],
            },
        }
