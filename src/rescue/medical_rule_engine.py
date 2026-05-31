"""医疗规则引擎模块。

提供急救步骤的验证、错误后果判定和成功/失败条件检查。
与 RescueFlow 和 PatientState 协作，确保急救流程符合医疗规范。
"""

from __future__ import annotations

from typing import Any, Optional


class MedicalRuleEngine:
    """医疗规则引擎，验证急救步骤的正确性并管理规则。

    根据加载的医疗规则配置，验证步骤顺序、前提条件，
    判定错误后果，检查成功/失败条件。

    Attributes:
        rules: 当前加载的规则配置
    """

    def __init__(self, config: Optional[dict] = None) -> None:
        """初始化医疗规则引擎。

        Args:
            config: 可选的初始规则配置
        """
        self.rules: dict[str, Any] = {}
        if config is not None:
            self.load_rules(config)

    # ---------- 公开接口 ----------

    def load_rules(self, config: dict) -> None:
        """加载规则配置。

        Args:
            config: 规则配置字典，包含 step_rules, success_conditions, failure_conditions 等
        """
        self.rules = config

    def validate_step(
        self,
        step_id: str,
        patient_state: dict,
        context: dict,
    ) -> tuple[bool, str]:
        """验证步骤是否可以执行。

        检查步骤顺序和前提条件，返回验证结果和原因说明。

        Args:
            step_id: 要验证的步骤 ID
            patient_state: 当前病人状态字典
            context: 上下文信息，包含 completed_steps 等

        Returns:
            (is_valid, reason) 元组，is_valid 表示是否通过验证，reason 为原因说明
        """
        step_rules = self.rules.get("step_rules", {})
        rule = step_rules.get(step_id)

        if rule is None:
            return True, f"步骤 '{step_id}' 无特定规则，默认通过"

        # 检查前提条件
        prerequisites = rule.get("prerequisites", [])
        completed_steps = context.get("completed_steps", [])

        for prereq in prerequisites:
            if prereq not in completed_steps:
                return False, f"前置步骤 '{prereq}' 尚未完成"

        # 检查病人状态条件
        required_conditions = rule.get("required_patient_conditions", {})
        for key, expected_value in required_conditions.items():
            actual_value = patient_state.get(key)
            if actual_value != expected_value:
                return False, f"病人状态不满足：{key} 应为 '{expected_value}'，实际为 '{actual_value}'"

        # 检查自定义条件函数
        custom_checks = rule.get("custom_checks", [])
        for check_name in custom_checks:
            check_result = self._run_custom_check(check_name, patient_state, context)
            if not check_result[0]:
                return False, check_result[1]

        return True, "验证通过"

    def get_consequence(self, step_id: str, error_type: str) -> dict:
        """获取步骤错误的后果配置。

        Args:
            step_id: 步骤 ID
            error_type: 错误类型，如 "wrong_order", "wrong_action", "timeout"

        Returns:
            后果配置字典，包含 damage, message 等
        """
        step_rules = self.rules.get("step_rules", {})
        rule = step_rules.get(step_id, {})

        consequences = rule.get("consequences", {})
        default_consequence = consequences.get("default", {"damage": 10, "message": "操作失误"})

        return consequences.get(error_type, default_consequence)

    def check_success_condition(self, patient_state: dict, context: dict) -> bool:
        """检查是否满足成功条件。

        Args:
            patient_state: 当前病人状态
            context: 上下文信息

        Returns:
            是否满足成功条件
        """
        success_conditions = self.rules.get("success_conditions", [])
        if not success_conditions:
            # 默认成功条件：病人状态稳定
            condition = patient_state.get("condition", "")
            return condition in ("stable", "recovering")

        for condition in success_conditions:
            cond_type = condition.get("type")
            if cond_type == "patient_condition":
                required = condition.get("value", "stable")
                if patient_state.get("condition") != required:
                    return False
            elif cond_type == "min_score":
                threshold = condition.get("value", 66)
                if patient_state.get("condition_score", 0) < threshold:
                    return False
            elif cond_type == "steps_completed":
                required_steps = condition.get("steps", [])
                completed = context.get("completed_steps", [])
                for step in required_steps:
                    if step not in completed:
                        return False

        return True

    def check_failure_condition(self, patient_state: dict, context: dict) -> bool:
        """检查是否满足失败条件。

        Args:
            patient_state: 当前病人状态
            context: 上下文信息

        Returns:
            是否满足失败条件（即已失败）
        """
        failure_conditions = self.rules.get("failure_conditions", [])
        if not failure_conditions:
            # 默认失败条件：病人死亡
            return patient_state.get("condition") == "dead" or patient_state.get("condition_score", 100) <= 0

        for condition in failure_conditions:
            cond_type = condition.get("type")
            if cond_type == "patient_dead":
                if patient_state.get("condition") == "dead":
                    return True
            elif cond_type == "max_errors":
                threshold = condition.get("value", 5)
                if len(context.get("failed_steps", [])) >= threshold:
                    return True
            elif cond_type == "time_exceeded":
                time_limit = condition.get("value", 600)
                if context.get("time_elapsed", 0) > time_limit:
                    return True
            elif cond_type == "score_zero":
                if patient_state.get("condition_score", 100) <= 0:
                    return True

        return False

    # ---------- 内部方法 ----------

    def _run_custom_check(
        self,
        check_name: str,
        patient_state: dict,
        context: dict,
    ) -> tuple[bool, str]:
        """运行自定义检查。

        Args:
            check_name: 检查名称
            patient_state: 病人状态
            context: 上下文

        Returns:
            (is_valid, reason) 元组
        """
        # 内置的自定义检查
        if check_name == "no_breathing_required":
            if patient_state.get("breathing", True):
                return False, "病人有呼吸，无需此步骤"
            return True, ""

        if check_name == "unconscious_required":
            if patient_state.get("consciousness") != "unconscious":
                return False, "病人有意识，无需此步骤"
            return True, ""

        return True, ""
