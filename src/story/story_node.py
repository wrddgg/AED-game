"""剧情节点处理器，管理节点的进入、退出和自动跳转逻辑。"""

from typing import Any, Optional

from src.models.story_data import StoryNode
from src.models.game_context import GameContext
from src.story.condition_system import ConditionEvaluator
from src.story.action_system import ActionExecutor
from src.story.variable_system import VariableStore


class StoryNodeProcessor:
    """剧情节点处理器，负责节点的生命周期管理。

    处理节点进入时的条件检查、动作执行、渲染信息生成，
    节点退出时的清理动作，以及非交互节点的自动跳转。
    """

    def __init__(
        self,
        condition_evaluator: ConditionEvaluator,
        action_executor: ActionExecutor,
        variable_store: VariableStore,
    ) -> None:
        """初始化节点处理器。

        Args:
            condition_evaluator: 条件评估器。
            action_executor: 动作执行器。
            variable_store: 变量存储。
        """
        self.condition_evaluator = condition_evaluator
        self.action_executor = action_executor
        self.variable_store = variable_store

    def enter_node(self, node: StoryNode, context: GameContext) -> dict:
        """进入节点，执行进入逻辑并返回渲染信息。

        流程：
        1. 检查节点条件，不满足则跳转到 failure_node 或 next_node
        2. 执行节点的进入动作
        3. 收集并返回渲染信息

        Args:
            node: 要进入的剧情节点。
            context: 游戏上下文。

        Returns:
            渲染信息字典，包含以下字段：
            - type: 节点类型
            - text: 文本内容
            - video: 视频资源
            - animation: 动画资源
            - audio: 音频资源
            - background: 背景资源
            - choices: 可用选项列表
            - duration: 持续时间
            - help_topic: 帮助主题
            - redirect: 条件不满足时的跳转目标
        """
        result: dict = {
            "type": getattr(node, "type", "choice"),
            "text": getattr(node, "text", ""),
            "video": getattr(node, "video", None),
            "animation": getattr(node, "animation", None),
            "audio": getattr(node, "audio", None),
            "background": getattr(node, "background", None),
            "choices": [],
            "duration": getattr(node, "duration", None),
            "help_topic": getattr(node, "help_topic", None),
            "redirect": None,
        }

        # 检查节点条件
        conditions = getattr(node, "conditions", None)
        if conditions:
            cond_dicts = [
                c.to_dict() if hasattr(c, "to_dict") else c for c in conditions
            ]
            if not self.condition_evaluator.evaluate(cond_dicts, context):
                # 条件不满足，确定跳转目标
                failure_node = getattr(node, "failure_node", None)
                next_node = getattr(node, "next_node", None)
                result["redirect"] = failure_node or next_node
                return result

        # 执行进入动作
        actions = getattr(node, "actions", None)
        if actions:
            action_dicts = [
                a.to_dict() if hasattr(a, "to_dict") else a for a in actions
            ]
            self.action_executor.execute(action_dicts, context)

        # 收集可用选项
        choices = getattr(node, "choices", None)
        if choices:
            result["choices"] = choices

        return result

    def exit_node(self, node: StoryNode, context: GameContext) -> None:
        """退出节点时执行清理动作。

        Args:
            node: 要退出的剧情节点。
            context: 游戏上下文。
        """
        exit_actions = getattr(node, "exit_actions", None)
        if exit_actions:
            action_dicts = [
                a.to_dict() if hasattr(a, "to_dict") else a for a in exit_actions
            ]
            self.action_executor.execute(action_dicts, context)

    def get_auto_next(
        self, node: StoryNode, context: GameContext
    ) -> Optional[str]:
        """获取非交互节点的自动跳转目标。

        对于非 choice 类型节点（如动画、视频、旁白等），
        根据节点配置确定自动跳转目标。

        Args:
            node: 当前剧情节点。
            context: 游戏上下文。

        Returns:
            自动跳转的下一节点 ID，无则返回 None。
        """
        node_type = getattr(node, "type", "choice")

        # choice 类型不自动跳转
        if node_type == "choice":
            return None

        # 有明确 next_node 则返回
        next_node = getattr(node, "next_node", None)
        if next_node:
            return next_node

        # 有 duration 的节点在倒计时后跳转（此方法只返回目标，计时由外部处理）
        duration = getattr(node, "duration", None)
        if duration is not None:
            # duration 类型的节点由超时机制处理跳转
            return getattr(node, "next_node", None)

        return None
