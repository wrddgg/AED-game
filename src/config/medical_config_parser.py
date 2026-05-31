"""AED 急救互动剧情游戏 - 医疗配置解析器模块

提供 MedicalConfigParser 类，负责将 JSON 原始数据解析为
结构化的医疗流程配置，包含步骤、成功/失败条件、患者规则等。
"""

from typing import Any, Dict, List


class MedicalConfigParser:
    """医疗配置解析器

    将 JSON 字典数据解析为结构化的医疗流程配置。
    """

    def parse_medical_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """解析医疗流程配置

        将原始 JSON 数据解析为包含以下结构的数据：
        - steps: 医疗步骤列表，每个步骤包含 step_id, name, allowed_time,
                 error_consequence, state_changes
        - success_condition: 成功条件
        - failure_condition: 失败条件
        - patient_rules: 患者状态规则

        Args:
            data: 医疗配置的 JSON 原始数据

        Returns:
            解析后的结构化医疗配置字典，包含 steps, success_condition,
            failure_condition, patient_rules

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(data, dict):
            raise ValueError("医疗配置数据必须是字典类型")

        result: Dict[str, Any] = {
            "steps": [],
            "success_condition": data.get("success_condition", {}),
            "failure_condition": data.get("failure_condition", {}),
            "patient_rules": data.get("patient_rules", {}),
        }

        raw_steps = data.get("steps", [])
        if isinstance(raw_steps, list):
            for step_data in raw_steps:
                if isinstance(step_data, dict):
                    step = self._parse_step(step_data)
                    result["steps"].append(step)

        return result

    def _parse_step(self, step_data: Dict[str, Any]) -> Dict[str, Any]:
        """解析单个医疗步骤

        Args:
            step_data: 步骤的 JSON 原始数据

        Returns:
            解析后的步骤字典
        """
        return {
            "step_id": step_data.get("step_id", ""),
            "name": step_data.get("name", ""),
            "description": step_data.get("description", ""),
            "allowed_time": step_data.get("allowed_time", 0.0),
            "error_consequence": step_data.get("error_consequence", {}),
            "state_changes": step_data.get("state_changes", {}),
            "required": step_data.get("required", True),
            "order": step_data.get("order", 0),
            "hints": step_data.get("hints", []),
        }
