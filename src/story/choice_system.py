"""选项评估与执行系统，处理玩家在剧情节点的选择。"""

from typing import Optional

from src.models.story_data import ChoiceData
from src.models.game_context import GameContext
from src.story.condition_system import ConditionEvaluator
from src.story.action_system import ActionExecutor


class ChoiceSystem:
    """选项系统，负责过滤可见选项和处理玩家选择。

    根据游戏上下文评估选项的前置条件，过滤出当前可见的选项。
    玩家选择后，执行选项的效果动作并跳转到下一个节点。
    """

    def __init__(
        self,
        condition_evaluator: ConditionEvaluator,
        action_executor: ActionExecutor,
    ) -> None:
        """初始化选项系统。

        Args:
            condition_evaluator: 条件评估器，用于判断选项可见性。
            action_executor: 动作执行器，用于执行选项效果。
        """
        self.condition_evaluator = condition_evaluator
        self.action_executor = action_executor

    def evaluate_choices(
        self, choices: list[ChoiceData], context: GameContext
    ) -> list[ChoiceData]:
        """过滤出当前可见的选项。

        选项的 conditions 为空则默认显示，否则需全部条件满足才显示。

        Args:
            choices: 所有候选选项列表。
            context: 游戏上下文。

        Returns:
            满足条件的可见选项列表。
        """
        visible = []
        for choice in choices:
            conditions = choice.conditions if choice.conditions else []
            cond_dicts = [
                c.to_dict() if hasattr(c, "to_dict") else c for c in conditions
            ]
            if self.condition_evaluator.evaluate(cond_dicts, context):
                visible.append(choice)
        return visible

    def select_choice(self, choice: ChoiceData, context: GameContext) -> str:
        """执行玩家选择。

        执行选项的效果动作，记录到上下文，处理错误选择的影响，
        并返回下一个节点 ID。

        Args:
            choice: 被选中的选项。
            context: 游戏上下文。

        Returns:
            下一个节点 ID。

        Raises:
            ValueError: 选项没有 next_node。
        """
        # 执行选项效果动作
        if choice.effects:
            effect_dicts = [
                e.to_dict() if hasattr(e, "to_dict") else e for e in choice.effects
            ]
            self.action_executor.execute(effect_dicts, context)

        # 记录选择
        choice_id = choice.id if hasattr(choice, "id") else str(choice)
        context.choices_made.append(choice_id)

        # 处理错误选择对病人状态的影响
        if hasattr(choice, "is_correct") and choice.is_correct is False:
            self._apply_wrong_choice_penalty(choice, context)

        # 获取下一节点
        next_node = choice.next_node if choice.next_node else None
        if next_node is None:
            raise ValueError(f"选项 '{choice_id}' 没有指定 next_node")

        return next_node

    def _apply_wrong_choice_penalty(
        self, choice: ChoiceData, context: GameContext
    ) -> None:
        """对错误选择施加惩罚，影响病人状态。

        错误选择会降低病人的心率稳定性等指标。

        Args:
            choice: 被选中的错误选项。
            context: 游戏上下文。
        """
        penalty = getattr(choice, "penalty", None)
        if penalty:
            self.action_executor.execute(
                [penalty if isinstance(penalty, dict) else penalty],
                context,
            )
        else:
            # 默认惩罚：降低病人状态
            if context.patient_state is not None:
                current = context.patient_state.get("stability", 100)
                context.patient_state["stability"] = max(0, current - 10)
