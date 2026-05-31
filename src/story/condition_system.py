"""条件评估系统，支持递归评估复杂的逻辑条件。"""

from typing import Any

from src.models.game_context import GameContext


class ConditionEvaluator:
    """条件评估器，支持变量比较、标志检查、时间判断及递归逻辑组合。

    评估条件列表用于决定剧情分支走向、选项可见性等。
    支持 and/or/not 递归嵌套，以及多种条件类型。
    """

    # 支持的比较运算符映射
    _COMPARE_OPS = {
        "eq": lambda a, b: a == b,
        "neq": lambda a, b: a != b,
        "gt": lambda a, b: a > b,
        "lt": lambda a, b: a < b,
        "gte": lambda a, b: a >= b,
        "lte": lambda a, b: a <= b,
    }

    def evaluate(self, conditions: list[dict], context: GameContext) -> bool:
        """评估条件列表（AND 逻辑）。

        空条件列表视为满足。

        Args:
            conditions: 条件字典列表。
            context: 游戏上下文。

        Returns:
            所有条件是否全部满足。
        """
        if not conditions:
            return True
        return all(self._evaluate_single(cond, context) for cond in conditions)

    def _evaluate_single(self, cond: dict, context: GameContext) -> bool:
        """评估单个条件。

        根据条件的 type 字段分发到对应的评估逻辑。
        支持的条件类型：
        - var_compare: 变量比较
        - flag_set: 标志已设置
        - flag_not_set: 标志未设置
        - time_exceeded: 时间超限
        - step_completed: 步骤已完成
        - and: 逻辑与
        - or: 逻辑或
        - not: 逻辑非

        Args:
            cond: 条件字典，包含 type 及相关参数。
            context: 游戏上下文。

        Returns:
            条件是否满足。

        Raises:
            ValueError: 未知的条件类型。
        """
        cond_type = cond.get("type")

        if cond_type == "var_compare":
            return self._evaluate_var_compare(cond, context)
        elif cond_type == "flag_set":
            return cond.get("flag") in context.flags
        elif cond_type == "flag_not_set":
            return cond.get("flag") not in context.flags
        elif cond_type == "time_exceeded":
            return context.elapsed_time > cond.get("value", 0)
        elif cond_type == "step_completed":
            return cond.get("step_id") in context.choices_made
        elif cond_type == "and":
            return self._evaluate_and(cond.get("conditions", []), context)
        elif cond_type == "or":
            return self._evaluate_or(cond.get("conditions", []), context)
        elif cond_type == "not":
            return self._evaluate_not(cond.get("condition", {}), context)
        else:
            raise ValueError(f"未知的条件类型: {cond_type}")

    def _evaluate_var_compare(self, cond: dict, context: GameContext) -> bool:
        """评估变量比较条件。

        从 context.variables 中获取变量值，与指定值进行比较。

        Args:
            cond: 条件字典，包含 key、operator、value。
            context: 游戏上下文。

        Returns:
            比较结果。
        """
        key = cond.get("key", "")
        operator = cond.get("operator", "eq")
        expected = cond.get("value")
        actual = context.variables.get(key)

        op_func = self._COMPARE_OPS.get(operator)
        if op_func is None:
            raise ValueError(f"未知的比较运算符: {operator}")

        try:
            return op_func(actual, expected)
        except TypeError:
            return False

    def _evaluate_and(self, conditions: list, context: GameContext) -> bool:
        """递归评估 AND 逻辑。

        Args:
            conditions: 子条件列表。
            context: 游戏上下文。

        Returns:
            所有子条件是否全部满足。
        """
        if not conditions:
            return True
        return all(self._evaluate_single(cond, context) for cond in conditions)

    def _evaluate_or(self, conditions: list, context: GameContext) -> bool:
        """递归评估 OR 逻辑。

        Args:
            conditions: 子条件列表。
            context: 游戏上下文。

        Returns:
            是否有任一子条件满足。
        """
        if not conditions:
            return False
        return any(self._evaluate_single(cond, context) for cond in conditions)

    def _evaluate_not(self, condition: dict, context: GameContext) -> bool:
        """递归评估 NOT 逻辑。

        Args:
            condition: 被取反的子条件。
            context: 游戏上下文。

        Returns:
            子条件结果的取反。
        """
        if not condition:
            return True
        return not self._evaluate_single(condition, context)
